"""
Sample requests and operational flow routers.
Provides endpoints for sample requests, design requests, and cross-desk downstream tasks
(studio dielines, creative briefs, costing estimations, product characteristics).
Delegates domain persistence to SampleRequestService, DesignRequestService, and Repositories.
"""
from typing import Any, Dict, List, Optional
from datetime import datetime, timedelta, timezone
import re
from urllib.parse import urlsplit
from uuid import uuid4
from fastapi import APIRouter, Body, Depends, HTTPException, Request, Response, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.auth.security import get_optional_current_user
from app.database import get_db
from app.models.sample_request import CreateSampleRequest, ProductCharacteristic, ProductDetail
from app.services.sample_request_service import SampleRequestService
from app.services.design_request_service import DesignRequestService
from app.services.downstream_service import DownstreamService

router = APIRouter(tags=["Sample Requests & Operations"])


def _normalize_binding(value: Any) -> str:
    return re.sub(r"[^a-z0-9]+", "", str(value or "").casefold())


def _validate_sample_design_count(payload: Dict[str, Any]) -> None:
    request_types = payload.get("request_types", payload.get("requestTypes", [])) or []
    if "design" not in request_types:
        return
    raw_count = (
        payload.get("number_of_designs")
        or payload.get("numberOfDesigns")
        or payload.get("product_artwork_nos")
        or payload.get("designs_customer_creative")
        or 1
    )
    try:
        count = int(raw_count)
    except (TypeError, ValueError):
        count = 0
    if not 1 <= count <= 100:
        raise HTTPException(status_code=422, detail="Request between 1 and 100 artwork variants")


def _validate_new_mockup_design(payload: Dict[str, Any]) -> None:
    """New Mockup products must carry a complete Design request before persistence."""
    raw_types = payload.get("request_types", payload.get("requestTypes", [])) or []
    if isinstance(raw_types, str):
        request_types = {value.strip().lower() for value in raw_types.split(",")}
    else:
        request_types = {str(value).strip().lower() for value in raw_types}
    creation_mode = str(payload.get("creation_mode", payload.get("creationMode", ""))).strip().lower()
    mockup_required = str(payload.get("mockup_required", payload.get("mockupRequired", ""))).strip().lower()
    is_mockup = "mockup" in request_types or mockup_required == "yes"
    if not is_mockup or creation_mode != "new":
        return
    if "design" not in request_types:
        raise HTTPException(status_code=422, detail="A new Mockup product must include a Design request.")

    description = payload.get("product_description", payload.get("productDescription"))
    if not str(description or "").strip():
        raise HTTPException(status_code=422, detail="A product description is required for a new Mockup product.")

    raw_count = (
        payload.get("number_of_designs")
        or payload.get("numberOfDesigns")
        or payload.get("product_artwork_nos")
        or payload.get("designs_customer_creative")
    )
    if raw_count in (None, ""):
        raise HTTPException(status_code=422, detail="The number of designs is required for a new Mockup product.")

    raw_date = (
        payload.get("target_artwork_date_creative")
        or payload.get("targetArtworkDateCreative")
        or payload.get("sample_required_date")
        or payload.get("sampleRequiredDate")
    )
    if not raw_date:
        raise HTTPException(status_code=422, detail="A Design required date is required for a new Mockup product.")


def get_sample_request_service(db: Session = Depends(get_db)) -> SampleRequestService:
    return SampleRequestService(db)


def get_design_request_service(db: Session = Depends(get_db)) -> DesignRequestService:
    return DesignRequestService(db)


def get_downstream_service(db: Session = Depends(get_db)) -> DownstreamService:
    return DownstreamService(db)



# ---------------------------------------------------------------------------
# Business Years Metadata
# ---------------------------------------------------------------------------

@router.get("/api/v1/sample-requests/business-years", summary="Get available business years and summary")
@router.get("/api/sample-requests/business-years", summary="Get available business years and summary (legacy alias)")
def get_business_years(service: SampleRequestService = Depends(get_sample_request_service)):
    return service.get_business_years_summary()


# ---------------------------------------------------------------------------
# Sample Requests (/api/v1/sample-requests and legacy alias /api/sample-requests)
# ---------------------------------------------------------------------------

@router.get("/api/v1/sample-requests", summary="List sample requests with filters")
@router.get("/api/sample-requests", summary="List sample requests (legacy alias)")
def list_sample_requests(
    year: Optional[str] = None,
    customer: Optional[str] = None,
    status: Optional[str] = None,
    stage: Optional[str] = None,
    created_by: Optional[str] = None,
    service: SampleRequestService = Depends(get_sample_request_service),
):
    effective_status = status or stage
    return service.list_requests(
        year=year,
        customer=customer,
        status=effective_status,
        created_by=created_by,
    )


@router.get("/api/v1/sample-requests/search-material", summary="Search products by material code (alias)")
@router.get("/api/v1/sample-requests/search-materials", summary="Search products by material code")
def search_materials_get(
    query: Optional[str] = None,
    code: Optional[str] = None,
    service: SampleRequestService = Depends(get_sample_request_service),
):
    search_term = code or query or ""
    return service.search_materials(search_term)


@router.get("/api/v1/sample-requests/{id}", response_model=Dict[str, Any], summary="Get sample request by ID or SR Number")
@router.get("/api/sample-requests/{id}", response_model=Dict[str, Any], summary="Get sample request (legacy alias)")
def get_sample_request(
    id: str,
    service: SampleRequestService = Depends(get_sample_request_service),
):
    num_id = int(id) if id.isdigit() else None
    if not num_id:
        req = service.repo.get_by_sr_number(id)
        if not req:
            raise HTTPException(status_code=404, detail="Sample request not found")
        num_id = req.id

    result = service.get_by_id(num_id)
    if not result:
        raise HTTPException(status_code=404, detail="Sample request not found")
    return result


@router.post("/api/v1/sample-requests", status_code=status.HTTP_201_CREATED, summary="Create a single sample request")
@router.post("/api/sample-requests", status_code=status.HTTP_201_CREATED, summary="Create a single sample request (legacy alias)")
def create_sample_request(
    payload: Dict[str, Any] = Body(...),
    service: SampleRequestService = Depends(get_sample_request_service),
    design_service: DesignRequestService = Depends(get_design_request_service),
    current_user = Depends(get_optional_current_user),
):
    if not isinstance(payload, dict):
        raise HTTPException(status_code=400, detail="Invalid JSON body")

    _validate_sample_design_count(payload)
    _validate_new_mockup_design(payload)
    created = service.create(payload)

    # Sync to design requests if request involves design
    request_types = payload.get("request_types") or []
    if "design" in request_types:
        sync_payload = {**payload, **created}
        design_service.sync_sample_request(sync_payload)

    return {"success": True, "message": "Sample request created successfully", "data": created}


@router.post("/api/v1/sample-requests/batch", status_code=status.HTTP_201_CREATED, summary="Batch create multiple sample requests")
@router.post("/api/sample-requests/batch", status_code=status.HTTP_201_CREATED, summary="Batch create multiple sample requests (legacy alias)")
def create_sample_requests_batch(
    body: Any = Body(...),
    service: SampleRequestService = Depends(get_sample_request_service),
    design_service: DesignRequestService = Depends(get_design_request_service),
    current_user = Depends(get_optional_current_user),
):
    if isinstance(body, list):
        normalized_items = [item for item in body if isinstance(item, dict)]
        if len(normalized_items) != len(body):
            raise HTTPException(status_code=422, detail="Every batch item must be an object")
    elif isinstance(body, dict):
        items = body.get("requests") or body.get("items", [])
        if not items or not isinstance(items, list):
            raise HTTPException(status_code=422, detail="Expected 'requests' or 'items' array in payload")
        shared_fields = {
            key: value for key, value in body.items() if key not in {"requests", "items"}
        }
        normalized_items = [
            {**shared_fields, **item} for item in items if isinstance(item, dict)
        ]
        if len(normalized_items) != len(items):
            raise HTTPException(status_code=422, detail="Every batch item must be an object")
    else:
        raise HTTPException(status_code=422, detail="Payload must be a list or object with requests array")

    for item in normalized_items:
        _validate_sample_design_count(item)
        _validate_new_mockup_design(item)
    created_results = service.batch_create(normalized_items)

    # Sync any design-scoped items with original input fields
    for idx, item in enumerate(created_results):
        req_types = item.get("request_types") or []
        if "design" in req_types:
            raw_input = normalized_items[idx] if idx < len(normalized_items) else {}
            sync_payload = {**raw_input, **item}
            design_service.sync_sample_request(sync_payload)

    return {
        "success": True,
        "count": len(created_results),
        "results": created_results,
    }


@router.post("/api/v1/sample-requests/search-materials", summary="Search products by material code")
def search_materials_post(
    body: Dict[str, Any] = Body(default_factory=dict),
    service: SampleRequestService = Depends(get_sample_request_service),
):
    query = body.get("query", "") if isinstance(body, dict) else ""
    return service.search_materials(query)


@router.put("/api/v1/sample-requests/{id}", summary="Update sample request (PUT)")
@router.put("/api/sample-requests/{id}", summary="Update sample request (PUT legacy alias)")
@router.patch("/api/v1/sample-requests/{id}", summary="Update sample request")
@router.patch("/api/sample-requests/{id}", summary="Update sample request (legacy alias)")
def update_sample_request(
    id: str,
    body: Dict[str, Any] = Body(...),
    service: SampleRequestService = Depends(get_sample_request_service),
    design_service: DesignRequestService = Depends(get_design_request_service),
    current_user = Depends(get_optional_current_user),
):
    if not isinstance(body, dict):
        raise HTTPException(status_code=400, detail="Invalid JSON body")

    num_id = int(id) if id.isdigit() else None
    if not num_id:
        req = service.repo.get_by_sr_number(id)
        if req:
            num_id = req.id

    if not num_id:
        raise HTTPException(status_code=404, detail="Sample request not found")

    existing = service.get_by_id(num_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Sample request not found")

    if any(key in body for key in ("creation_mode", "creationMode", "request_types", "requestTypes")):
        _validate_new_mockup_design({**existing, **body})

    old_types = existing.get("request_types") or []
    requested_types = body.get("request_types", body.get("requestTypes", old_types))
    if not isinstance(requested_types, list):
        raise HTTPException(status_code=422, detail="Request types must be a list")
    current_design = design_service.repo.get_model_by_sr_number(existing.get("sr_number"))
    if "design" in old_types and "design" not in requested_types and current_design:
        if not str(current_design.status or "").casefold().startswith("draft") or current_design.creative_submissions:
            raise HTTPException(status_code=409, detail="An active design workflow cannot be removed from its sample request")

    raw_design_count = body.get("number_of_designs", body.get("numberOfDesigns", body.get("product_artwork_nos")))
    if raw_design_count not in (None, "") and "design" in requested_types:
        try:
            requested_design_count = int(raw_design_count)
        except (TypeError, ValueError):
            raise HTTPException(status_code=422, detail="Number of designs must be an integer")
        if not 1 <= requested_design_count <= 100:
            raise HTTPException(status_code=422, detail="Request between 1 and 100 artwork variants")
        if current_design and requested_design_count != int(current_design.number_of_designs or 0):
            if not str(current_design.status or "").casefold().startswith("draft") or current_design.creative_submissions:
                raise HTTPException(status_code=409, detail="Artwork count can only be changed before the request is released")

    updated = service.update(num_id, body)
    if not updated:
        raise HTTPException(status_code=404, detail="Sample request not found")

    req_types = updated.get("request_types") or []
    if "design" in old_types and "design" not in req_types:
        design_service.sync_sample_request(existing, is_delete=True)
    elif "design" in req_types:
        sync_payload = {**body, **updated}
        design_service.sync_sample_request(sync_payload)

    return updated


@router.post("/api/v1/sample-requests/batch-status", summary="Batch update status")
def batch_update_status(
    body: Dict[str, Any] = Body(...),
    service: SampleRequestService = Depends(get_sample_request_service),
    design_service: DesignRequestService = Depends(get_design_request_service),
    current_user = Depends(get_optional_current_user),
):
    if not isinstance(body, dict):
        raise HTTPException(status_code=400, detail="Invalid JSON body")

    ids = body.get("sample_request_ids") or body.get("ids") or []
    new_status = body.get("status")
    if not ids or not new_status:
        raise HTTPException(status_code=422, detail="Missing required parameters")

    numeric_ids = [int(i) for i in ids if str(i).isdigit()]
    updated_count = service.batch_update_status(numeric_ids, new_status)
    for request_id in numeric_ids:
        updated_request = service.get_by_id(request_id)
        if (
            updated_request
            and (
                "mockup" in (updated_request.get("request_types") or [])
                or str(updated_request.get("mockup_required") or "").casefold() == "yes"
            )
            and str(new_status).strip().casefold() == "creative"
        ):
            state = updated_request.get("mockup_workflow_state") or {"events": []}
            if state.get("stage") in {None, "marketing", "creative"}:
                now = datetime.now(timezone.utc).isoformat()
                actor = getattr(current_user, "name", None) or getattr(current_user, "userid", None) or "Marketing"
                events = list(state.get("events") or [])
                if not state.get("releasedToCreativeAt"):
                    events.append({
                        "action": "MOCKUP_RELEASED_TO_CREATIVE",
                        "title": "Mockup request released to Creative",
                        "actorName": str(actor),
                        "actorDepartment": "Marketing",
                        "timestamp": now,
                    })
                state.update({"stage": "creative", "releasedToCreativeAt": state.get("releasedToCreativeAt") or now, "events": events[-100:]})
                updated_request = service.update(request_id, {"mockup_workflow_state": state}) or updated_request
        if updated_request and "design" in (updated_request.get("request_types") or []):
            design_service.sync_sample_request(updated_request)
    return {"success": True, "updated_count": updated_count}


def _mockup_actor(current_user: Any, body: Dict[str, Any]) -> str:
    return str(
        getattr(current_user, "name", None)
        or getattr(current_user, "userid", None)
        or body.get("actor_name")
        or ""
    ).strip()


def _require_mockup_request(sample: Dict[str, Any]) -> Dict[str, Any]:
    request_types = sample.get("request_types") or []
    if "mockup" not in request_types and str(sample.get("mockup_required") or "").casefold() != "yes":
        raise HTTPException(status_code=409, detail="This request does not include a mockup deliverable")
    state = sample.get("mockup_workflow_state") or {}
    return state if isinstance(state, dict) else {}


@router.post("/api/v1/sample-requests/{sample_id}/mockup/send-to-studio", summary="Send a mockup request from Creative to Studio")
def send_mockup_request_to_studio(
    sample_id: int,
    body: Dict[str, Any] = Body(default_factory=dict),
    service: SampleRequestService = Depends(get_sample_request_service),
    current_user = Depends(get_optional_current_user),
):
    sample = service.get_by_id(sample_id)
    if not sample:
        raise HTTPException(status_code=404, detail="Sample request not found")
    state = _require_mockup_request(sample)
    if state.get("stage") != "creative":
        raise HTTPException(status_code=409, detail="This mockup request is not waiting for Creative review")
    actor = _mockup_actor(current_user, body if isinstance(body, dict) else {}) or "Creative Studio"
    now = datetime.now(timezone.utc).isoformat()
    events = list(state.get("events") or [])
    events.append({
        "action": "MOCKUP_SENT_TO_STUDIO",
        "title": "Creative sent the mockup brief to Studio",
        "actorName": actor,
        "actorDepartment": "Creative Studio",
        "timestamp": now,
    })
    state.update({"stage": "studio", "sentToStudioAt": now, "sentToStudioBy": actor, "events": events[-100:]})
    updated = service.update(sample_id, {"mockup_workflow_state": state})
    if not updated:
        raise HTTPException(status_code=404, detail="Sample request not found")
    return updated


@router.post("/api/v1/sample-requests/{sample_id}/mockup/submit", summary="Submit a Studio mockup link to Marketing")
def submit_studio_mockup(
    sample_id: int,
    body: Dict[str, Any] = Body(default_factory=dict),
    service: SampleRequestService = Depends(get_sample_request_service),
    current_user = Depends(get_optional_current_user),
):
    sample = service.get_by_id(sample_id)
    if not sample:
        raise HTTPException(status_code=404, detail="Sample request not found")
    state = _require_mockup_request(sample)
    if state.get("stage") != "studio":
        raise HTTPException(status_code=409, detail="This mockup request is not waiting for Studio")
    mockup_url = str(body.get("mockup_url") or body.get("mockupUrl") or "").strip()
    parsed_url = urlsplit(mockup_url)
    if len(mockup_url) > 2048 or parsed_url.scheme not in {"http", "https"} or not parsed_url.netloc:
        raise HTTPException(status_code=422, detail="Enter a valid http or https mockup link")
    actor = _mockup_actor(current_user, body) or "Studio"
    now = datetime.now(timezone.utc).isoformat()
    events = list(state.get("events") or [])
    events.append({
        "action": "MOCKUP_SUBMITTED_TO_MARKETING",
        "title": "Studio sent the mockup to Marketing",
        "actorName": actor,
        "actorDepartment": "Studio",
        "timestamp": now,
        "mockupUrl": mockup_url,
    })
    state.update({"stage": "marketing", "mockupUrl": mockup_url, "submittedToMarketingAt": now, "submittedToMarketingBy": actor, "events": events[-100:]})
    updated = service.update(sample_id, {"mockup_workflow_state": state})
    if not updated:
        raise HTTPException(status_code=404, detail="Sample request not found")
    return updated



@router.delete("/api/v1/sample-requests/{id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete sample request")
@router.delete("/api/sample-requests/{id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete sample request (legacy alias)")
def delete_sample_request(
    id: str,
    service: SampleRequestService = Depends(get_sample_request_service),
    design_service: DesignRequestService = Depends(get_design_request_service),
):
    num_id = int(id) if id.isdigit() else None
    if not num_id:
        req = service.repo.get_by_sr_number(id)
        if req:
            num_id = req.id

    if not num_id:
        raise HTTPException(status_code=404, detail="Sample request not found")

    existing = service.get_by_id(num_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Sample request not found")
    if "design" in (existing.get("request_types") or []):
        design_service.sync_sample_request(existing, is_delete=True)
    if not service.delete(num_id):
        raise HTTPException(status_code=404, detail="Sample request not found")

    return Response(status_code=status.HTTP_204_NO_CONTENT)


# ---------------------------------------------------------------------------
# Design Requests (/api/v1/design-requests)
# ---------------------------------------------------------------------------

@router.get("/api/v1/design-requests", response_model=List[Dict[str, Any]], summary="List design requests")
def list_design_requests(service: DesignRequestService = Depends(get_design_request_service)):
    return service.list_all()


def _design_workflow_state(record: Any) -> Dict[str, Any]:
    state = record.get("workflow_state") if isinstance(record, dict) else record.workflow_state
    return dict(state) if isinstance(state, dict) else {}


def _require_design_counter_window_open(record: Any) -> None:
    """Enforce the claim/counter window from the original Marketing request time."""
    raised_at = record.get("created_at") if isinstance(record, dict) else record.created_at
    if isinstance(raised_at, str):
        try:
            raised_at = datetime.fromisoformat(raised_at.replace("Z", "+00:00"))
        except ValueError:
            raised_at = None
    if not isinstance(raised_at, datetime):
        raise HTTPException(status_code=409, detail="Marketing request time is unavailable for the 48-hour window")
    if raised_at.tzinfo is None:
        raised_at = raised_at.replace(tzinfo=timezone.utc)
    deadline = raised_at.astimezone(timezone.utc) + timedelta(hours=48)
    if datetime.now(timezone.utc) >= deadline:
        raise HTTPException(status_code=409, detail="The 48-hour claim and counter-date window from Marketing's request has expired")


def _append_design_event(
    state: Dict[str, Any],
    *,
    action: str,
    title: str,
    body: str,
    actor: str,
    department: str,
    badge_text: str = "Update",
    badge_variant: str = "neutral",
    is_note: bool = False,
) -> Dict[str, Any]:
    events = list(state.get("events") or [])
    events.insert(0, {
        "id": f"event-{uuid4().hex}",
        "actorName": actor,
        "actorDepartment": department,
        "action": action,
        "title": title,
        "body": body,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "isNote": is_note,
        "badge": {"text": badge_text, "variant": badge_variant},
    })
    state["events"] = events[:500]
    return state


def _get_design_workflow_record(id: int, service: DesignRequestService) -> Dict[str, Any]:
    record = service.get_by_id(id)
    if not record:
        raise HTTPException(status_code=404, detail="Design request not found")
    return record


@router.post("/api/v1/design-requests/{id}/claim", summary="Claim a Creative design request")
def claim_design_request(
    id: int,
    body: Dict[str, Any] = Body(default_factory=dict),
    service: DesignRequestService = Depends(get_design_request_service),
    current_user = Depends(get_optional_current_user),
):
    body = body if isinstance(body, dict) else {}
    actor = str(
        getattr(current_user, "name", None)
        or getattr(current_user, "userid", None)
        or body.get("designer_name")
        or "Creative Designer"
    ).strip()[:100]

    def mutate(item):
        if item.status not in {"Creative", "Creative Remaining Requested", "Creative Studio", "Target Date Counter Proposed"}:
            raise HTTPException(status_code=409, detail="This design request is not available to Creative")
        state = _design_workflow_state(item)
        current_claim = str(state.get("claimedBy") or "")
        if current_claim and current_claim.casefold() != actor.casefold():
            raise HTTPException(status_code=409, detail=f"This task is already claimed by {current_claim}")
        if not current_claim:
            _require_design_counter_window_open(item)
            now = datetime.now(timezone.utc).isoformat()
            state.update({"claimedBy": actor, "claimedAt": now})
            _append_design_event(
                state, action="TASK_CLAIMED", title="Task claimed by Creative",
                body=f"{actor} claimed ownership of this design request.", actor=actor,
                department="Creative Studio", badge_text="Claimed", badge_variant="purple",
            )
            item.workflow_state = state

    saved = service.mutate(id, mutate)
    if not saved:
        raise HTTPException(status_code=404, detail="Design request not found")
    return saved


@router.delete("/api/v1/design-requests/{id}/claim", summary="Reject release of an assigned Creative design request")
def release_design_request_claim(
    id: int,
):
    raise HTTPException(status_code=409, detail="A Creative claim cannot be released after assignment")


@router.post("/api/v1/design-requests/{id}/counter-date-proposal", summary="Propose a revised design target date")
def propose_design_counter_date(
    id: int,
    body: Dict[str, Any] = Body(...),
    service: DesignRequestService = Depends(get_design_request_service),
    current_user = Depends(get_optional_current_user),
):
    body = body if isinstance(body, dict) else {}
    proposed_date = str(body.get("proposed_date") or "").strip()
    reason = str(body.get("reason") or "").strip()[:500]
    if not proposed_date or not reason:
        raise HTTPException(status_code=422, detail="Proposed date and reason are required")
    try:
        proposed_day = datetime.strptime(proposed_date, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status_code=422, detail="Proposed date must use YYYY-MM-DD format")
    actor = (
        getattr(current_user, "name", None)
        or getattr(current_user, "userid", None)
        or body.get("designer_name")
        or "Creative Designer"
    )

    def mutate(item):
        if item.status not in {"Creative", "Creative Remaining Requested", "Creative Studio", "Target Date Counter Proposed"}:
            raise HTTPException(status_code=409, detail="This design request is not in Creative work")
        state = _design_workflow_state(item)
        claimed_by = str(state.get("claimedBy") or "")
        if not claimed_by:
            raise HTTPException(status_code=409, detail="Claim this design request before proposing a new date")
        if actor and claimed_by.casefold() != str(actor).casefold():
            raise HTTPException(status_code=403, detail="Only the assigned designer can propose a new date")
        if state.get("isCounterDateActive"):
            raise HTTPException(status_code=409, detail="A counter-date proposal is already awaiting Marketing")
        if (
            state.get("counterDateRequestedAt")
            or state.get("counter_date_requested_at")
            or state.get("proposedTargetDate")
            or state.get("proposed_target_date")
            or state.get("counterDateDecision")
            or state.get("counter_date_decision")
        ):
            raise HTTPException(status_code=409, detail="Only one counter-date proposal is allowed per design request")
        _require_design_counter_window_open(item)
        today = datetime.now(timezone.utc).date()
        if proposed_day <= today:
            raise HTTPException(status_code=422, detail="The revised date must be in the future")
        original_date = str(item.design_required_date or "").split("T", 1)[0]
        if original_date and proposed_date <= original_date:
            raise HTTPException(status_code=422, detail="Proposed date must be later than the original required date")
        now = datetime.now(timezone.utc).isoformat()
        state.update({
            "isCounterDateActive": True,
            "proposedTargetDate": proposed_date,
            "counterDateReason": reason,
            "counterDateRequestedAt": now,
            "counterDateRequestedBy": actor,
            "counterDateDecision": "pending",
        })
        _append_design_event(
            state, action="COUNTER_DATE_PROPOSED", title="Revised target date proposed",
            body=f"Proposed {proposed_date}. {reason}", actor=str(actor),
            department="Creative Studio", badge_text="Counter Date", badge_variant="amber",
        )
        item.workflow_state = state

    saved = service.mutate(id, mutate)
    if not saved:
        raise HTTPException(status_code=404, detail="Design request not found")
    return saved


@router.post("/api/v1/design-requests/{id}/counter-date-decision", summary="Accept or reject a revised design target date")
def decide_design_counter_date(
    id: int,
    body: Dict[str, Any] = Body(...),
    service: DesignRequestService = Depends(get_design_request_service),
    sample_service: SampleRequestService = Depends(get_sample_request_service),
    current_user = Depends(get_optional_current_user),
):
    body = body if isinstance(body, dict) else {}
    decision = body.get("decision")
    if decision not in {"accepted", "rejected"}:
        raise HTTPException(status_code=422, detail="Decision must be accepted or rejected")
    accepted = decision == "accepted"
    notes = str(body.get("notes") or ("Accepted by Marketing" if accepted else "Rejected by Marketing. Original deadline holds.")).strip()[:1000]
    actor = getattr(current_user, "name", None) or getattr(current_user, "userid", None) or ""

    def mutate(item):
        state = _design_workflow_state(item)
        if item.marketing_decision == "accepted" or item.status == "Approved / Closed":
            raise HTTPException(status_code=409, detail="A closed design request cannot accept a counter-date proposal")
        proposed_date = state.get("proposedTargetDate")
        if not state.get("isCounterDateActive") or not proposed_date:
            raise HTTPException(status_code=409, detail="There is no pending counter-date proposal")
        if accepted:
            item.design_required_date = proposed_date
            linked_sample = sample_service.repo.get_by_sr_number(item.sr_number)
            if linked_sample:
                linked_sample.target_artwork_date_creative = proposed_date
                try:
                    linked_sample.sample_required_date = datetime.strptime(proposed_date, "%Y-%m-%d").date()
                except ValueError:
                    raise HTTPException(status_code=409, detail="The proposed date on this request is invalid")
        state.update({
            "isCounterDateActive": False,
            "counterDateDecision": decision,
            "counterDateDecisionAt": datetime.now(timezone.utc).isoformat(),
            "counterDateDecisionNotes": notes,
        })
        _append_design_event(
            state, action=f"COUNTER_DATE_{decision.upper()}",
            title=f"Counter date {decision}",
            body=notes, actor=str(actor), department="Marketing",
            badge_text="Date Accepted" if accepted else "Date Retained",
            badge_variant="emerald" if accepted else "rose",
        )
        item.workflow_state = state

    saved = service.mutate(id, mutate)
    if not saved:
        raise HTTPException(status_code=404, detail="Design request not found")
    return saved


@router.post("/api/v1/design-requests/{id}/notes", summary="Add a design workflow note")
def add_design_workflow_note(
    id: int,
    body: Dict[str, Any] = Body(...),
    service: DesignRequestService = Depends(get_design_request_service),
    current_user = Depends(get_optional_current_user),
):
    body = body if isinstance(body, dict) else {}
    note_text = str(body.get("body") or "").strip()
    if not note_text or len(note_text) > 2000:
        raise HTTPException(status_code=422, detail="Note text is required")
    actor = getattr(current_user, "name", None) or getattr(current_user, "userid", None) or str(body.get("actor_name") or "")
    department = str(body.get("actor_department") or "Creative Studio")
    if department not in {"Marketing", "Creative Studio"}:
        department = "Team"
    note = {
        "id": f"note-{uuid4().hex}",
        "actorName": actor,
        "actorDepartment": department,
        "action": "NOTE_POSTED",
        "title": "Internal Note",
        "body": note_text,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "isNote": True,
        "badge": {"text": "Note", "variant": "neutral"},
    }

    def mutate(item):
        state = _design_workflow_state(item)
        state["notes"] = [note, *(state.get("notes") or [])][:500]
        item.workflow_state = state

    saved = service.mutate(id, mutate)
    if not saved:
        raise HTTPException(status_code=404, detail="Design request not found")
    return saved


@router.post("/api/v1/design-requests/{id}/release", summary="Release a design request to Creative")
def release_design_request(
    id: int,
    service: DesignRequestService = Depends(get_design_request_service),
    sample_service: SampleRequestService = Depends(get_sample_request_service),
    current_user = Depends(get_optional_current_user),
):
    actor = getattr(current_user, "name", None) or getattr(current_user, "userid", None) or ""

    def mutate(item):
        current_status = str(item.status or "")
        if not current_status.casefold().startswith("draft"):
            if current_status in {"Creative", "Creative Remaining Requested", "Creative Studio", "Target Date Counter Proposed"}:
                return
            raise HTTPException(status_code=409, detail="Only a draft design request can be released")
        now = datetime.now(timezone.utc).isoformat()
        state = _design_workflow_state(item)
        state["releasedAt"] = state.get("releasedAt") or now
        _append_design_event(
            state, action="REQUEST_RELEASED", title="Released from Marketing Draft",
            body="Marketing released this design request from the pre-SMT draft queue to Creative.", actor=str(actor),
            department="Marketing", badge_text="Released", badge_variant="emerald",
        )
        item.workflow_state = state
        item.status = "Creative"
        linked_sample = sample_service.repo.get_by_sr_number(item.sr_number)
        if linked_sample:
            linked_sample.status = "Creative"

    saved = service.mutate(id, mutate)
    if not saved:
        raise HTTPException(status_code=404, detail="Design request not found")
    return saved


@router.post("/api/v1/sample-requests/{sample_id}/design-brief", summary="Submit a design-only brief to Creative")
def submit_design_brief(
    sample_id: int,
    body: Dict[str, Any] = Body(...),
    service: SampleRequestService = Depends(get_sample_request_service),
    design_service: DesignRequestService = Depends(get_design_request_service),
    current_user = Depends(get_optional_current_user),
):
    if not isinstance(body, dict):
        raise HTTPException(status_code=400, detail="Invalid JSON body")

    description = str(body.get("product_description") or "").strip()
    count = body.get("number_of_designs")
    if not description:
        raise HTTPException(status_code=422, detail="Product description is required")
    try:
        count = int(count)
    except (TypeError, ValueError):
        count = 0
    if not 1 <= count <= 100:
        raise HTTPException(status_code=422, detail="Request between 1 and 100 designs")
    required_date = body.get("design_required_date") or None
    if required_date:
        try:
            datetime.strptime(str(required_date), "%Y-%m-%d")
        except ValueError:
            raise HTTPException(status_code=422, detail="Design required date must use YYYY-MM-DD format")

    parent = service.get_by_id(sample_id)
    if not parent:
        raise HTTPException(status_code=404, detail="Sample request not found")
    sr_number = parent.get("sr_number")
    existing_design = next((item for item in design_service.list_all() if item.get("sr_number") == sr_number), None)
    if existing_design and not str(existing_design.get("status") or "").lower().startswith("draft"):
        raise HTTPException(status_code=409, detail="This design request has already left Draft")

    request_types = list(parent.get("request_types") or [])
    if "design" not in request_types:
        request_types.append("design")
    updated_sample = service.update(sample_id, {
        "request_types": request_types,
        "status": "Creative",
        "product_description": description,
        "product_artwork_nos": count,
        "target_artwork_date_creative": required_date,
    })
    if not updated_sample:
        raise HTTPException(status_code=404, detail="Sample request not found")

    design_service.sync_sample_request(updated_sample)
    record = next((item for item in design_service.list_all() if item.get("sr_number") == sr_number), None)
    if not record:
        raise HTTPException(status_code=500, detail="Design request could not be created")

    record = design_service.update(record["id"], {
        "status": "Creative",
        "number_of_designs": count,
        "trend": body.get("trend") or None,
        "target_audience": body.get("target_audience") or None,
        "product_description": description,
        "design_required_date": required_date,
        "reference_image": body.get("reference_image") or None,
        "reference_images": body.get("reference_images") or [],
        "reference_links": body.get("reference_links") or [],
        "design_remarks": body.get("design_remarks") or None,
        "marketing_decision": None,
        "remaining_design_count": count,
        "creative_submissions": [],
    })
    return {"success": True, "data": record}


@router.put("/api/v1/design-requests/{id}/creative-output", summary="Submit Creative design output")
def submit_creative_design_output(
    id: int,
    body: Dict[str, Any] = Body(...),
    service: DesignRequestService = Depends(get_design_request_service),
    sample_service: SampleRequestService = Depends(get_sample_request_service),
    current_user = Depends(get_optional_current_user),
):
    if not isinstance(body, dict):
        raise HTTPException(status_code=400, detail="Invalid JSON body")
    file_url = str(body.get("design_file_url") or "").strip()
    rows = body.get("rows")
    if len(file_url) > 2048:
        raise HTTPException(status_code=422, detail="Design file link is too long")
    parsed_url = urlsplit(file_url)
    if parsed_url.scheme not in {"http", "https"} or not parsed_url.netloc:
        raise HTTPException(status_code=422, detail="Use a valid http or https design file link")
    if not isinstance(rows, list) or not rows or len(rows) > 100:
        raise HTTPException(status_code=422, detail="Add at least one completed design")
    raw_rows = []
    for row in rows:
        if not isinstance(row, dict):
            raise HTTPException(status_code=422, detail="Each design output must be an object")
        description = str(row.get("description") or "").strip()
        remarks = str(row.get("remarks") or "").strip()[:1000]
        if not description or len(description) > 500:
            raise HTTPException(status_code=422, detail="Each design needs a description of 1 to 500 characters")
        raw_rows.append({"description": description, "remarks": remarks})

    actor = getattr(current_user, "name", None) or getattr(current_user, "userid", None) or body.get("designer_name")

    def mutate(item):
        if item.status not in {"Creative", "Creative Remaining Requested"}:
            raise HTTPException(status_code=409, detail="This request is not awaiting Creative output")
        state = _design_workflow_state(item)
        claimed_by = str(state.get("claimedBy") or "")
        if not claimed_by:
            raise HTTPException(status_code=409, detail="Claim this design request before submitting artwork")
        if not actor or claimed_by.casefold() != str(actor).casefold():
            raise HTTPException(status_code=403, detail="Only the assigned designer can submit artwork")
        submissions = list(item.creative_submissions or [])
        delivered_before = sum(len(batch.get("rows") or []) for batch in submissions if isinstance(batch, dict))
        requested = int(item.number_of_designs or 0)
        remaining = max(0, requested - delivered_before)
        if len(raw_rows) > remaining:
            raise HTTPException(status_code=422, detail=f"Only {remaining} design(s) remain")
        normalized_rows = []
        for offset, row in enumerate(raw_rows):
            normalized_rows.append({"design_number": f"D{delivered_before + offset + 1}", **row})
        delivered = delivered_before + len(normalized_rows)
        submissions.append({
            "submitted_at": datetime.now(timezone.utc).isoformat(),
            "design_file_url": file_url,
            "rows": normalized_rows,
        })
        item.creative_submissions = submissions
        item.remaining_design_count = max(0, requested - delivered)
        item.marketing_decision = "awaiting_marketing_review"
        item.status = "Awaiting Marketing Review"
        _append_design_event(
            state, action="DELIVERABLE_SUBMITTED", title="Artwork submitted to Marketing",
            body=f"{len(normalized_rows)} artwork(s) submitted for review.", actor=str(actor or claimed_by),
            department="Creative Studio", badge_text="Submitted", badge_variant="teal",
        )
        item.workflow_state = state
        linked_sample = sample_service.repo.get_by_sr_number(item.sr_number)
        if linked_sample:
            linked_sample.status = "Awaiting Marketing Review"

    saved = service.mutate(id, mutate)
    if not saved:
        raise HTTPException(status_code=404, detail="Design request not found")
    return saved


@router.post("/api/v1/design-requests/{id}/marketing-decision", summary="Accept design output or request remaining designs")
def marketing_design_decision(
    id: int,
    body: Dict[str, Any] = Body(...),
    service: DesignRequestService = Depends(get_design_request_service),
    sample_service: SampleRequestService = Depends(get_sample_request_service),
    current_user = Depends(get_optional_current_user),
):
    if not isinstance(body, dict):
        raise HTTPException(status_code=400, detail="Invalid JSON body")
    decision = body.get("decision")
    if decision not in {"accept", "request_remaining"}:
        raise HTTPException(status_code=422, detail="Decision must be accept or request_remaining")
    actor = getattr(current_user, "name", None) or getattr(current_user, "userid", None) or ""

    def mutate(item):
        if item.marketing_decision == "accepted" or item.status == "Approved / Closed":
            raise HTTPException(status_code=409, detail="This design request is already closed")
        if item.status != "Awaiting Marketing Review":
            raise HTTPException(status_code=409, detail="Creative output must be submitted before review")
        remaining = max(0, int(item.number_of_designs or 0) - sum(
            len(batch.get("rows") or []) for batch in (item.creative_submissions or []) if isinstance(batch, dict)
        ))
        if decision == "accept":
            item.marketing_decision = "accepted"
            item.status = "Approved / Closed"
            item.remaining_design_count = 0
            title = "Artwork approved and closed"
            body_text = "Marketing accepted the submitted artwork."
            badge = "Accepted"
            variant = "emerald"
        else:
            if remaining == 0:
                raise HTTPException(status_code=409, detail="All requested designs have been delivered")
            item.marketing_decision = "remaining_requested"
            item.status = "Creative Remaining Requested"
            item.remaining_design_count = remaining
            title = "Remaining artwork requested"
            body_text = f"Marketing returned {remaining} artwork(s) to Creative for completion."
            badge = "Revisions"
            variant = "amber"
        state = _design_workflow_state(item)
        _append_design_event(
            state, action="MARKETING_DECISION", title=title, body=body_text,
            actor=str(actor), department="Marketing", badge_text=badge, badge_variant=variant,
        )
        item.workflow_state = state
        linked_sample = sample_service.repo.get_by_sr_number(item.sr_number)
        if linked_sample:
            linked_sample.status = item.status

    saved = service.mutate(id, mutate)
    if not saved:
        raise HTTPException(status_code=404, detail="Design request not found")
    return saved


@router.post("/api/v1/design-requests", status_code=status.HTTP_201_CREATED, summary="Create design request")
def create_design_request(
    body: Dict[str, Any] = Body(default_factory=dict),
    service: DesignRequestService = Depends(get_design_request_service),
    current_user = Depends(get_optional_current_user),
):
    if not isinstance(body, dict):
        raise HTTPException(status_code=400, detail="Invalid JSON body")
    customer_name = str(body.get("customer_name") or body.get("customerName") or "").strip()
    description = str(body.get("product_description") or body.get("productDescription") or "").strip()
    if not customer_name or len(customer_name) > 150:
        raise HTTPException(status_code=422, detail="Customer name is required and must be 150 characters or fewer")
    if not description or len(description) > 5000:
        raise HTTPException(status_code=422, detail="Design brief is required and must be 5,000 characters or fewer")
    try:
        number_of_designs = int(body.get("number_of_designs", body.get("numberOfDesigns", 1)))
    except (TypeError, ValueError):
        number_of_designs = 0
    if not 1 <= number_of_designs <= 100:
        raise HTTPException(status_code=422, detail="Request between 1 and 100 artwork variants")

    required_date = body.get("design_required_date") or body.get("designRequiredDate") or None
    if required_date:
        try:
            datetime.strptime(str(required_date), "%Y-%m-%d")
        except ValueError:
            raise HTTPException(status_code=422, detail="Design required date must use YYYY-MM-DD format")

    reference_images = body.get("reference_images", body.get("referenceImages", []))
    reference_links = body.get("reference_links", body.get("referenceLinks", []))
    if not isinstance(reference_images, list) or not isinstance(reference_links, list):
        raise HTTPException(status_code=422, detail="Reference images and links must be lists")
    if len(reference_images) > 50 or len(reference_links) > 50:
        raise HTTPException(status_code=422, detail="A design request can include at most 50 references of each type")

    actor = getattr(current_user, "name", None) or getattr(current_user, "userid", None) or body.get("created_by") or ""
    request_data = {
        "sr_number": body.get("sr_number") or body.get("srNumber"),
        "customer_name": customer_name,
        "program_name": str(body.get("program_name") or body.get("programName") or "").strip() or None,
        "program_year": str(body.get("program_year") or body.get("programYear") or "").strip() or None,
        "status": "Draft (Pre-SMT)",
        "number_of_designs": number_of_designs,
        "trend": str(body.get("trend") or "").strip() or None,
        "target_audience": str(body.get("target_audience") or body.get("targetAudience") or "").strip() or None,
        "reference_image": body.get("reference_image") or body.get("referenceImage") or None,
        "product_description": description,
        "design_required_date": required_date,
        "created_by": str(actor).strip()[:100],
        "design_remarks": str(body.get("design_remarks") or body.get("designRemarks") or "").strip() or None,
        "reference_images": reference_images,
        "reference_links": reference_links,
        "creative_submissions": [],
        "marketing_decision": None,
        "remaining_design_count": number_of_designs,
    }
    try:
        return service.create(request_data)
    except IntegrityError:
        raise HTTPException(status_code=409, detail="A design request already uses this SR number")


@router.get("/api/v1/design-requests/{id}", response_model=Dict[str, Any], summary="Get design request")
def get_design_request(
    id: int,
    service: DesignRequestService = Depends(get_design_request_service),
):
    record = service.get_by_id(id)
    if not record:
        raise HTTPException(status_code=404, detail="Design request not found")
    return record


@router.patch("/api/v1/design-requests/{id}", summary="Update design request")
def update_design_request(
    id: int,
    body: Dict[str, Any] = Body(default_factory=dict),
    service: DesignRequestService = Depends(get_design_request_service),
    current_user = Depends(get_optional_current_user),
):
    if not isinstance(body, dict):
        raise HTTPException(status_code=400, detail="Invalid JSON body")
    aliases = {
        "customerName": "customer_name",
        "programName": "program_name",
        "programYear": "program_year",
        "numberOfDesigns": "number_of_designs",
        "targetAudience": "target_audience",
        "referenceImage": "reference_image",
        "productDescription": "product_description",
        "designRequiredDate": "design_required_date",
        "designRemarks": "design_remarks",
        "referenceImages": "reference_images",
        "referenceLinks": "reference_links",
    }
    editable = {
        "customer_name", "program_name", "program_year", "number_of_designs",
        "trend", "target_audience", "reference_image", "product_description",
        "design_required_date", "design_remarks", "reference_images", "reference_links",
    }
    updates = {aliases.get(key, key): value for key, value in body.items()}
    unknown = set(updates) - editable
    if unknown:
        raise HTTPException(status_code=422, detail=f"These design fields cannot be edited here: {', '.join(sorted(unknown))}")
    if not updates:
        return _get_design_workflow_record(id, service)
    for field in ("customer_name", "product_description"):
        if field in updates:
            value = str(updates[field] or "").strip()
            if not value:
                raise HTTPException(status_code=422, detail=f"{field.replace('_', ' ').title()} cannot be empty")
            max_length = 150 if field == "customer_name" else 5000
            if len(value) > max_length:
                raise HTTPException(status_code=422, detail=f"{field.replace('_', ' ').title()} is too long")
            updates[field] = value
    if "number_of_designs" in updates:
        try:
            updates["number_of_designs"] = int(updates["number_of_designs"])
        except (TypeError, ValueError):
            raise HTTPException(status_code=422, detail="Number of designs must be an integer")
        if not 1 <= updates["number_of_designs"] <= 100:
            raise HTTPException(status_code=422, detail="Request between 1 and 100 artwork variants")
    if "design_required_date" in updates and updates["design_required_date"]:
        try:
            datetime.strptime(str(updates["design_required_date"]), "%Y-%m-%d")
        except ValueError:
            raise HTTPException(status_code=422, detail="Design required date must use YYYY-MM-DD format")
    for field in ("reference_images", "reference_links"):
        if field in updates and (not isinstance(updates[field], list) or len(updates[field]) > 50):
            raise HTTPException(status_code=422, detail=f"{field.replace('_', ' ').title()} must be a list of at most 50 items")
    actor = getattr(current_user, "name", None) or getattr(current_user, "userid", None) or ""

    def mutate(item):
        count_changed = (
            updates.get("number_of_designs") is not None
            and int(updates["number_of_designs"]) != int(item.number_of_designs or 0)
        )
        if count_changed and (
            not str(item.status or "").casefold().startswith("draft") or item.creative_submissions
        ):
            raise HTTPException(status_code=409, detail="Artwork count can only be changed before the request is released")
        changed_fields = [key for key, value in updates.items() if getattr(item, key) != value]
        for key, value in updates.items():
            setattr(item, key, value)
        if count_changed:
            item.remaining_design_count = updates["number_of_designs"]
        if changed_fields:
            state = _design_workflow_state(item)
            _append_design_event(
                state,
                action="DESIGN_REQUEST_UPDATED",
                title="Design brief updated",
                body="Updated " + ", ".join(field.replace("_", " ") for field in changed_fields) + ".",
                actor=str(actor),
                department="Marketing",
                badge_text="Updated",
                badge_variant="neutral",
            )
            item.workflow_state = state

    record = service.mutate(id, mutate)
    if not record:
        raise HTTPException(status_code=404, detail="Design request not found")
    return record


@router.delete("/api/v1/design-requests/{id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete design request")
def delete_design_request(
    id: int,
    service: DesignRequestService = Depends(get_design_request_service),
    sample_service: SampleRequestService = Depends(get_sample_request_service),
):
    record = service.get_by_id(id)
    if not record:
        raise HTTPException(status_code=404, detail="Design request not found")
    linked_sample = sample_service.repo.get_by_sr_number(record.get("sr_number"))
    if linked_sample:
        linked_sample.request_types = [
            value for value in (linked_sample.request_types or []) if value != "design"
        ]
    if not service.delete(id):
        raise HTTPException(status_code=404, detail="Design request not found")
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# ---------------------------------------------------------------------------
# Downstream Cross-Desk Persistent Operations
# ---------------------------------------------------------------------------

@router.get("/api/v1/creative/briefs", response_model=List[Dict[str, Any]], summary="List creative briefs")
def list_creative_briefs(service: DownstreamService = Depends(get_downstream_service)):
    return service.list_creative_briefs()


@router.patch("/api/v1/creative/briefs/{id}", summary="Update creative brief")
def update_creative_brief(
    id: str,
    body: Dict[str, Any] = Body(...),
    service: DownstreamService = Depends(get_downstream_service),
    current_user = Depends(get_optional_current_user),
):
    if not isinstance(body, dict):
        raise HTTPException(status_code=400, detail="Invalid JSON body")
    updated = service.update_creative_brief(id, body)
    if not updated:
        raise HTTPException(status_code=404, detail="Creative brief not found")
    return updated


@router.get("/api/v1/studio/dielines", response_model=List[Dict[str, Any]], summary="List studio dielines")
def list_studio_dielines(service: DownstreamService = Depends(get_downstream_service)):
    return service.list_studio_dielines()


@router.patch("/api/v1/studio/dielines/{id}", summary="Update studio dieline")
def update_studio_dieline(
    id: str,
    body: Dict[str, Any] = Body(...),
    service: DownstreamService = Depends(get_downstream_service),
    current_user = Depends(get_optional_current_user),
):
    if not isinstance(body, dict):
        raise HTTPException(status_code=400, detail="Invalid JSON body")
    updated = service.update_studio_dieline(id, body)
    if not updated:
        raise HTTPException(status_code=404, detail="Studio dieline not found")
    return updated


@router.get("/api/v1/costing/estimations", response_model=List[Dict[str, Any]], summary="List costing estimations")
def list_costing_estimations(service: DownstreamService = Depends(get_downstream_service)):
    return service.list_costing_estimations()


@router.patch("/api/v1/costing/estimations/{id}", summary="Update costing estimation")
def update_costing_estimation(
    id: str,
    body: Dict[str, Any] = Body(...),
    service: DownstreamService = Depends(get_downstream_service),
    current_user = Depends(get_optional_current_user),
):
    if not isinstance(body, dict):
        raise HTTPException(status_code=400, detail="Invalid JSON body")
    updated = service.update_costing_estimation(id, body)
    if not updated:
        raise HTTPException(status_code=404, detail="Costing estimation not found")
    return updated


# ---------------------------------------------------------------------------
# Product Characteristics (/api/v1/product-characteristics)
# ---------------------------------------------------------------------------

@router.get("/api/v1/product-characteristics", summary="List all active product characteristics")
def list_product_characteristics(service: SampleRequestService = Depends(get_sample_request_service)):
    return service.get_all_characteristics()


@router.get("/api/v1/product-characteristics/classes", summary="List product characteristic classes")
def list_characteristic_classes(service: SampleRequestService = Depends(get_sample_request_service)):
    return service.get_characteristic_classes()


@router.get("/api/v1/product-characteristics/details/{sample_request_id}", summary="Get product details for a sample request")
def get_product_details(
    sample_request_id: int,
    exclude_na: bool = False,
    service: SampleRequestService = Depends(get_sample_request_service),
):
    return service.get_product_details(sample_request_id)


@router.post("/api/v1/product-characteristics/details", summary="Save product details for a sample request")
def save_product_details(
    request: Request,
    body: Any = Body(...),
    service: SampleRequestService = Depends(get_sample_request_service),
    current_user = Depends(get_optional_current_user),
):
    sample_request_id = (
        request.query_params.get("sample_request_id")
        or (body.get("sample_request_id") if isinstance(body, dict) else None)
        or (body.get("sampleRequestId") if isinstance(body, dict) else None)
    )
    if isinstance(body, list):
        details = body
    elif isinstance(body, dict):
        details = body.get("details") or []
    else:
        details = []

    if not sample_request_id or not isinstance(details, list):
        raise HTTPException(status_code=422, detail="Missing sample_request_id or details list")

    success = service.save_product_details(int(sample_request_id), details)
    if not success:
        raise HTTPException(status_code=404, detail="Sample request not found")
    return {"success": True, "message": "Product details updated successfully"}



@router.get("/api/v1/product-characteristics/binding-hierarchy", summary="Get binding hierarchy")
def get_binding_hierarchy(
    category: Optional[str] = None,
    sub_category: Optional[str] = None,
    third_category: Optional[str] = None,
    db: Session = Depends(get_db)
):
    binding_characteristics = (
        db.query(ProductCharacteristic)
        .filter(
            ProductCharacteristic.is_active.is_(True),
            func.upper(ProductCharacteristic.class_name) == "NB_BINDING",
        )
        .order_by(ProductCharacteristic.sequence)
        .all()
    )
    b1_char = next(
        (item for item in binding_characteristics if _normalize_binding(item.characteristic_name) == "bindingtype1"),
        None,
    )
    b2_char = next(
        (item for item in binding_characteristics if _normalize_binding(item.characteristic_name) == "bindingtype2"),
        None,
    )
    master_b1_options = b1_char.options if b1_char and b1_char.options else []
    master_b2_options = b2_char.options if b2_char and b2_char.options else []

    def normalized_taxonomy_sql(column):
        return func.regexp_replace(
            func.lower(func.coalesce(column, "")),
            "[^a-z0-9]+",
            "",
            "g",
        )

    def normalized_taxonomy_value(value: str) -> str:
        return _normalize_binding(value)

    product_query = db.query(CreateSampleRequest.id)
    if category and category.strip():
        product_query = product_query.filter(
            normalized_taxonomy_sql(CreateSampleRequest.product_category)
            == normalized_taxonomy_value(category)
        )
    if sub_category and sub_category.strip():
        product_query = product_query.filter(
            normalized_taxonomy_sql(CreateSampleRequest.product_sub_category)
            == normalized_taxonomy_value(sub_category)
        )
    if third_category and third_category.strip():
        product_query = product_query.filter(
            normalized_taxonomy_sql(CreateSampleRequest.product_third_category)
            == normalized_taxonomy_value(third_category)
        )
    product_ids = [request_id for (request_id,) in product_query.all()]
    products_by_request: Dict[int, Dict[str, str]] = {request_id: {} for request_id in product_ids}
    binding_rows = (
        db.query(
            ProductDetail.sample_request_id,
            ProductDetail.characteristic_name,
            ProductDetail.value,
        )
        .filter(ProductDetail.sample_request_id.in_(product_ids))
        .filter(func.upper(ProductDetail.class_name) == "NB_BINDING")
        .filter(normalized_taxonomy_sql(ProductDetail.characteristic_name).in_(
            ("bindingtype1", "binding1", "bindingtype2", "binding2")
        ))
        .all()
        if product_ids
        else []
    )
    for request_id, characteristic_name, value in binding_rows:
        normalized = _normalize_binding(characteristic_name)
        clean_value = str(value or "").strip()
        if not clean_value or clean_value.upper() in {"NA", "N/A", "NAN", "NULL", "NONE", "-", "—"}:
            continue
        product_bindings = products_by_request.setdefault(request_id, {})
        if normalized in {"BINDINGTYPE1", "BINDING1"}:
            product_bindings["binding1"] = clean_value
        elif normalized in {"BINDINGTYPE2", "BINDING2"}:
            product_bindings["binding2"] = clean_value

    master_b1_options = master_b1_options if isinstance(master_b1_options, list) else []
    master_b2_options = master_b2_options if isinstance(master_b2_options, list) else []
    product_b1_options = [
        bindings["binding1"] for bindings in products_by_request.values() if bindings.get("binding1")
    ]
    product_b2_options = [
        bindings["binding2"] for bindings in products_by_request.values() if bindings.get("binding2")
    ]

    def is_valid_binding_option(value: Any) -> bool:
        normalized = _normalize_binding(value)
        return bool(normalized) and normalized not in {"na", "nan", "null", "none"}

    def merge_binding_options(values: List[Any], preferred_labels: List[Any] = ()) -> List[str]:
        options_by_normalized_value: Dict[str, str] = {}
        for value in values:
            label = str(value or "").strip()
            normalized = _normalize_binding(label)
            if is_valid_binding_option(label):
                options_by_normalized_value.setdefault(normalized, label)
        for value in preferred_labels:
            label = str(value or "").strip()
            normalized = _normalize_binding(label)
            if is_valid_binding_option(label):
                options_by_normalized_value[normalized] = label
        return sorted(options_by_normalized_value.values(), key=lambda label: (label.casefold(), label))

    b1_cleaned = merge_binding_options(product_b1_options, master_b1_options)
    catalog_b2_options = merge_binding_options([], master_b2_options)
    b2_cleaned = merge_binding_options(product_b2_options, master_b2_options)

    hierarchy: Dict[str, List[str]] = {}
    for binding1 in b1_cleaned:
        matching_binding2 = [
            bindings["binding2"]
            for bindings in products_by_request.values()
            if _normalize_binding(bindings.get("binding1")) == _normalize_binding(binding1) and bindings.get("binding2")
        ]
        hierarchy[binding1] = merge_binding_options(matching_binding2, catalog_b2_options) or catalog_b2_options

    return {
        "binding1_options": b1_cleaned,
        "binding2_options": b2_cleaned,
        "hierarchy": hierarchy,
    }


@router.get("/api/v1/product-characteristics/filter-by-binding", summary="Search saved products by taxonomy and binding")
def search_products_by_binding(
    b1: Optional[str] = None,
    b2: Optional[str] = None,
    category: Optional[str] = None,
    sub_category: Optional[str] = None,
    third_category: Optional[str] = None,
    limit: Optional[int] = None,
    service: SampleRequestService = Depends(get_sample_request_service),
):
    if not any(value and value.strip() for value in (b1, b2, category, sub_category, third_category)):
        return []
    return service.search_products_by_binding(
        binding1=b1,
        binding2=b2,
        category=category,
        sub_category=sub_category,
        third_category=third_category,
        limit=limit,
    )
