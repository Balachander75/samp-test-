"""API endpoints for persisted feasibility-check requests, technical verdicts, and audit logging."""

from io import BytesIO
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Body, Depends, HTTPException, Query, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.auth.security import get_current_user, get_optional_current_user
from app.database import get_db
from app.schemas.feasibility import (
    FeasibilityActivityLogOut,
    FeasibilityMarketingDecisionPayload,
    FeasibilityNoteCreate,
    FeasibilityRequestCreate,
    FeasibilityRequestOut,
    FeasibilitySampVerdictPayload,
)
from app.services.feasibility_service import FeasibilityService
from app.services.sample_request_service import SampleRequestService

router = APIRouter(prefix="/api/v1/feasibility-requests", tags=["Feasibility Requests"])


def get_feasibility_service(db: Session = Depends(get_db)) -> FeasibilityService:
    return FeasibilityService(db, api_prefix=router.prefix)


def get_sample_request_service(db: Session = Depends(get_db)) -> SampleRequestService:
    return SampleRequestService(db)


def require_department(current_user, department: str):
    if not current_user:
        raise HTTPException(status_code=401, detail="Authentication required")
    role = (current_user.role or "").strip().lower()
    if role in ("admin", "superadmin", "management"):
        return current_user
    roles = f"{current_user.role or ''} {current_user.sub_role or ''}".lower()
    terms = ("samp", "sampling") if department == "samp" else ("marketing",)
    if not any(term in roles for term in terms):
        raise HTTPException(status_code=403, detail=f"{department.title()} access is required")
    return current_user


@router.get("", response_model=List[FeasibilityRequestOut], summary="List feasibility requests")
def list_feasibility_requests(
    status_filter: Optional[str] = Query(default=None, alias="status"),
    service: FeasibilityService = Depends(get_feasibility_service),
    current_user=Depends(get_optional_current_user),
):
    return service.list_requests(status_filter=status_filter)


@router.get("/{request_id}", response_model=FeasibilityRequestOut, summary="Get single feasibility request")
def get_feasibility_request(
    request_id: int,
    service: FeasibilityService = Depends(get_feasibility_service),
    current_user=Depends(get_optional_current_user),
):
    request = service.get_by_id(request_id)
    if not request:
        raise HTTPException(status_code=404, detail="Feasibility request was not found")
    return request


@router.get(
    "/{request_id}/activity-logs",
    response_model=List[FeasibilityActivityLogOut],
    summary="List audit activities for a feasibility request",
)
def list_feasibility_activity_logs(
    request_id: int,
    service: FeasibilityService = Depends(get_feasibility_service),
    current_user=Depends(get_optional_current_user),
):
    request = service.get_by_id(request_id)
    if not request:
        raise HTTPException(status_code=404, detail="Feasibility request was not found")
    return request.get("activities", [])


@router.get("/{request_id}/images/{image_id}", summary="Read a feasibility reference image")
def get_feasibility_image(
    request_id: int,
    image_id: int,
    service: FeasibilityService = Depends(get_feasibility_service),
    current_user=Depends(get_optional_current_user),
):
    image = service.repo.get_image_record(request_id, image_id)
    if not image or not image.image_data:
        raise HTTPException(status_code=404, detail="Reference image was not found")
    return StreamingResponse(
        BytesIO(image.image_data),
        media_type=image.content_type,
        headers={"Cache-Control": "private, max-age=3600", "X-Content-Type-Options": "nosniff"},
    )


@router.post(
    "",
    response_model=FeasibilityRequestOut,
    status_code=status.HTTP_201_CREATED,
    summary="Create a feasibility request",
)
def create_feasibility_request(
    payload: FeasibilityRequestCreate,
    service: FeasibilityService = Depends(get_feasibility_service),
    current_user=Depends(get_current_user),
):
    require_department(current_user, "marketing")
    return service.create(payload, current_user=current_user)


@router.put(
    "/{request_id}/samp-verdict",
    response_model=FeasibilityRequestOut,
    summary="SAMP Team Technical Sign-off / Verdict",
)
def record_samp_verdict(
    request_id: int,
    payload: FeasibilitySampVerdictPayload,
    service: FeasibilityService = Depends(get_feasibility_service),
    current_user=Depends(get_current_user),
):
    require_department(current_user, "samp")
    return service.record_samp_verdict(request_id, payload, current_user=current_user)


@router.post(
    "/{request_id}/marketing-decision",
    response_model=FeasibilityRequestOut,
    summary="Marketing Final Decision (Accept or Reject)",
)
def record_marketing_decision(
    request_id: int,
    payload: FeasibilityMarketingDecisionPayload,
    service: FeasibilityService = Depends(get_feasibility_service),
    current_user=Depends(get_current_user),
):
    require_department(current_user, "marketing")
    return service.record_marketing_decision(request_id, payload, current_user=current_user)


@router.post(
    "/{request_id}/claim",
    response_model=FeasibilityRequestOut,
    summary="SAMP Team Member Claims/Takes Feasibility Task",
)
def claim_feasibility_task(
    request_id: int,
    service: FeasibilityService = Depends(get_feasibility_service),
    current_user=Depends(get_current_user),
):
    require_department(current_user, "samp")
    return service.claim_task(request_id, current_user=current_user)


@router.post(
    "/{request_id}/convert-to-sampling",
    response_model=Dict[str, Any],
    summary="Convert Accepted Feasibility Request into Commercial Sample Request",
)
def convert_feasibility_to_sampling(
    request_id: int,
    service: FeasibilityService = Depends(get_feasibility_service),
    current_user=Depends(get_current_user),
):
    require_department(current_user, "marketing")
    return service.convert_to_sampling(request_id, current_user=current_user)


@router.post(
    "/{request_id}/notes",
    response_model=FeasibilityRequestOut,
    summary="Add a communication note / comment to the feasibility chatter",
)
def add_feasibility_note(
    request_id: int,
    payload: FeasibilityNoteCreate,
    service: FeasibilityService = Depends(get_feasibility_service),
    current_user=Depends(get_current_user),
):
    return service.add_note(request_id, payload.note, current_user=current_user)


@router.post(
    "/{request_id}/viewed",
    summary="Record when a desk operator views a feasibility request",
)
def record_feasibility_viewed(
    request_id: int,
    service: FeasibilityService = Depends(get_feasibility_service),
    current_user=Depends(get_optional_current_user),
):
    recorded = service.record_viewed(request_id, current_user=current_user)
    return {"success": True, "recorded": recorded}


@router.put(
    "/{request_id}",
    response_model=FeasibilityRequestOut,
    summary="Update feasibility review workflow fields",
)
def update_feasibility_request(
    request_id: int,
    payload: Optional[Dict[str, Any]] = Body(default=None),
    service: FeasibilityService = Depends(get_feasibility_service),
    current_user=Depends(get_optional_current_user),
):
    if not service.repo.get_by_id(request_id):
        raise HTTPException(status_code=404, detail="Feasibility request was not found")
    raise HTTPException(
        status_code=409,
        detail="Direct workflow edits are disabled. Use the SAMP verdict or Marketing decision endpoint so the change is audited.",
    )


@router.delete(
    "/{request_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete feasibility request from database (testing / cleanup)",
)
def delete_feasibility_request(
    request_id: int,
    service: FeasibilityService = Depends(get_feasibility_service),
    sample_service: SampleRequestService = Depends(get_sample_request_service),
    current_user=Depends(get_optional_current_user),
):
    deleted = service.delete(request_id)
    if not deleted:
        deleted = sample_service.delete(request_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Feasibility request was not found")
    return None
