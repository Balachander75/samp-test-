"""API endpoints for persisted feasibility-check requests, technical verdicts, and audit logging."""

import base64
import binascii
import re
from datetime import datetime, timezone
from io import BytesIO
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Body, Depends, HTTPException, Query, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session, joinedload, selectinload

from app.auth.security import get_current_user, get_optional_current_user, require_admin
from app.database import get_db
from app.models.feasibility import (
    FeasibilityActivityLog,
    FeasibilityReferenceImage,
    FeasibilityRequest,
)
from app.models.master import Customer
from app.schemas.feasibility import (
    FeasibilityActivityLogOut,
    FeasibilityMarketingDecisionPayload,
    FeasibilityRequestCreate,
    FeasibilityRequestOut,
    FeasibilitySampVerdictPayload,
)


router = APIRouter(prefix="/api/v1/feasibility-requests", tags=["Feasibility Requests"])

MAX_IMAGE_BYTES = 1_048_576
IMAGE_DATA_URL_RE = re.compile(r"^data:(image/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$")


def require_department(current_user, department: str):
    if not current_user:
        return None
    if (current_user.role or "").strip().lower() == "admin":
        return current_user
    roles = f"{current_user.role or ''} {current_user.sub_role or ''}".lower()
    terms = ("samp", "sampling") if department == "samp" else ("marketing",)
    if not any(term in roles for term in terms):
        raise HTTPException(status_code=403, detail=f"{department.title()} access is required")
    return current_user


def decode_image_data_url(data_url: str, enforce_size_limit: bool = True):
    match = IMAGE_DATA_URL_RE.fullmatch(data_url or "")
    if not match:
        raise HTTPException(status_code=422, detail="Reference images must be JPEG, PNG, or WebP data URLs")
    content_type, encoded = match.groups()
    try:
        image_data = base64.b64decode(encoded, validate=True)
    except (binascii.Error, ValueError):
        raise HTTPException(status_code=422, detail="Reference image data is invalid")
    if not image_data or (enforce_size_limit and len(image_data) > MAX_IMAGE_BYTES):
        raise HTTPException(status_code=413, detail="Each compressed reference image must be at most 1 MB")
    signatures = {
        "image/jpeg": image_data.startswith(b"\xff\xd8\xff"),
        "image/png": image_data.startswith(b"\x89PNG\r\n\x1a\n"),
        "image/webp": image_data.startswith(b"RIFF") and image_data[8:12] == b"WEBP",
    }
    if not signatures.get(content_type, False):
        raise HTTPException(status_code=422, detail="Reference image content does not match its file type")
    return content_type, image_data


def add_activity(db: Session, request: FeasibilityRequest, actor, department: str, action: str, payload: dict):
    db.add(FeasibilityActivityLog(
        feasibility_request_id=request.id,
        actor_id=actor.id,
        actor_name=actor.name,
        actor_department=department,
        action=action,
        payload=payload,
    ))


def reference_image_metadata_option():
    return selectinload(FeasibilityRequest.reference_image_records).load_only(
        FeasibilityReferenceImage.id,
        FeasibilityReferenceImage.feasibility_request_id,
        FeasibilityReferenceImage.original_name,
        FeasibilityReferenceImage.content_type,
        FeasibilityReferenceImage.sort_order,
    )


def load_request_for_response(db: Session, request_id: int) -> FeasibilityRequest:
    return (
        db.query(FeasibilityRequest)
        .options(
            joinedload(FeasibilityRequest.customer),
            selectinload(FeasibilityRequest.activities),
            reference_image_metadata_option(),
        )
        .filter(FeasibilityRequest.id == request_id)
        .first()
    )


def migrate_legacy_images(request: FeasibilityRequest, db: Session) -> bool:
    """Move older base64 JSON images into the normalized byte storage table."""
    legacy = request.reference_images or []
    remaining = []
    changed = False
    for index, value in enumerate(legacy):
        if isinstance(value, str) and value.startswith("data:image/"):
            try:
                content_type, image_data = decode_image_data_url(value, enforce_size_limit=False)
            except HTTPException:
                remaining.append(value)
                continue
            image = FeasibilityReferenceImage(
                original_name=f"Reference image {index + 1}",
                content_type=content_type,
                image_data=image_data,
                sort_order=index,
            )
            request.reference_image_records.append(image)
            changed = True
        else:
            remaining.append(value)
    if changed:
        request.reference_images = remaining
    return changed


def serialize_activity(activity: FeasibilityActivityLog) -> Dict[str, Any]:
    return {
        "id": activity.id,
        "feasibility_request_id": activity.feasibility_request_id,
        "actor_id": activity.actor_id,
        "actor_name": activity.actor_name,
        "actor_department": activity.actor_department,
        "action": activity.action,
        "payload": activity.payload or {},
        "created_at": activity.created_at,
    }


def serialize_request(request: FeasibilityRequest) -> Dict[str, Any]:
    # Determine SLA on-time status dynamically if not already saved
    is_on_time = request.is_responded_on_time
    if is_on_time is None and request.feasibility_closed_at:
        is_on_time = request.feasibility_closed_at.date() <= request.required_date

    return {
        "id": request.id,
        "request_code": request.request_code,
        "sr_number": request.sr_number,
        "customer": request.customer.name if request.customer else "",
        "feasibility_type": request.feasibility_type,
        "custom_feasibility_type": request.custom_feasibility_type,
        "description_notes": request.description_notes,
        "required_date": request.required_date,
        "marketing_remarks": request.marketing_remarks,
        "reference_images": [
            *[
                f"{router.prefix}/{request.id}/images/{image.id}"
                for image in (request.reference_image_records or [])
            ],
            *[
                value for value in (request.reference_images or []) if isinstance(value, str)
            ],
        ],
        "reference_image_names": [
            image.original_name for image in (request.reference_image_records or [])
        ],
        "reference_links": request.reference_links or [],
        "status": request.status,
        "created_by": request.created_by,
        "request_created_by": request.request_created_by,
        "created_by_user_id": request.created_by_user_id,
        "request_raised_at": request.request_raised_at,
        "updated_at": request.updated_at,
        "sampling_feasibility_response": request.sampling_feasibility_response,
        "sampling_feasibility_remark": request.sampling_feasibility_remark,
        "sampling_feasibility_approved_by": request.sampling_feasibility_approved_by,
        "feasibility_closed_at": request.feasibility_closed_at,
        "feasibility_closed_by": request.feasibility_closed_by,
        "is_responded_on_time": is_on_time,
        "marketing_decision": request.marketing_decision,
        "marketing_decision_by": request.marketing_decision_by,
        "marketing_decision_at": request.marketing_decision_at,
        "marketing_decision_remark": request.marketing_decision_remark,
        "activities": [
            serialize_activity(act)
            for act in (request.activities or [])
        ],
    }


# ---------------------------------------------------------------------------
# Queries
# ---------------------------------------------------------------------------

@router.get("", response_model=List[FeasibilityRequestOut], summary="List feasibility requests")
def list_feasibility_requests(
    status_filter: Optional[str] = Query(default=None, alias="status"),
    db: Session = Depends(get_db),
    current_user=Depends(get_optional_current_user),
):
    query = (
        db.query(FeasibilityRequest)
        .options(
            joinedload(FeasibilityRequest.customer),
            selectinload(FeasibilityRequest.activities),
            reference_image_metadata_option(),
        )
        .order_by(FeasibilityRequest.id.desc())
    )
    if status_filter and status_filter.strip():
        query = query.filter(FeasibilityRequest.status == status_filter.strip())
    requests = query.all()
    migrated = False
    for request in requests:
        migrated = migrate_legacy_images(request, db) or migrated
    if migrated:
        db.commit()
        requests = query.all()
    return [serialize_request(request) for request in requests]


@router.get("/{request_id}", response_model=FeasibilityRequestOut, summary="Get single feasibility request")
def get_feasibility_request(
    request_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_optional_current_user),
):
    request = (
        db.query(FeasibilityRequest)
        .options(
            joinedload(FeasibilityRequest.customer),
            selectinload(FeasibilityRequest.activities),
            reference_image_metadata_option(),
        )
        .filter(FeasibilityRequest.id == request_id)
        .first()
    )
    if not request:
        raise HTTPException(status_code=404, detail="Feasibility request was not found")
    if migrate_legacy_images(request, db):
        db.commit()
        request = (
            db.query(FeasibilityRequest)
            .options(
                joinedload(FeasibilityRequest.customer),
                selectinload(FeasibilityRequest.activities),
                reference_image_metadata_option(),
            )
            .filter(FeasibilityRequest.id == request_id)
            .first()
        )
    return serialize_request(request)


@router.get("/{request_id}/activities", response_model=List[FeasibilityActivityLogOut], summary="Get activity timeline")
def get_feasibility_activities(
    request_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_optional_current_user),
):
    if not db.query(FeasibilityRequest.id).filter(FeasibilityRequest.id == request_id).first():
        raise HTTPException(status_code=404, detail="Feasibility request was not found")
    activities = (
        db.query(FeasibilityActivityLog)
        .filter(FeasibilityActivityLog.feasibility_request_id == request_id)
        .order_by(FeasibilityActivityLog.id.asc())
        .all()
    )
    return [serialize_activity(act) for act in activities]


@router.get("/{request_id}/images/{image_id}", summary="Read a feasibility reference image")
def get_feasibility_image(
    request_id: int,
    image_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_optional_current_user),
):
    image = (
        db.query(FeasibilityReferenceImage)
        .filter(
            FeasibilityReferenceImage.id == image_id,
            FeasibilityReferenceImage.feasibility_request_id == request_id,
        )
        .first()
    )
    if not image:
        raise HTTPException(status_code=404, detail="Reference image was not found")
    return StreamingResponse(
        BytesIO(image.image_data),
        media_type=image.content_type,
        headers={"Cache-Control": "private, max-age=3600", "X-Content-Type-Options": "nosniff"},
    )


# ---------------------------------------------------------------------------
# Intake / Creation
# ---------------------------------------------------------------------------

@router.post(
    "",
    response_model=FeasibilityRequestOut,
    status_code=status.HTTP_201_CREATED,
    summary="Create a feasibility request",
)
def create_feasibility_request(
    payload: FeasibilityRequestCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_optional_current_user),
):
    require_department(current_user, "marketing")
    decoded_images = [decode_image_data_url(value) for value in payload.reference_images]
    customer_name = payload.customer.strip()
    customer = db.query(Customer).filter(Customer.name.ilike(customer_name)).first()
    if not customer:
        customer = Customer(name=customer_name)
        db.add(customer)
        db.flush()

    request_creator = current_user.name
    request = FeasibilityRequest(
        request_code="PENDING",
        sr_number="PENDING",
        customer_id=customer.id,
        feasibility_type=payload.feasibility_type,
        custom_feasibility_type=(payload.custom_feasibility_type or "").strip() or None,
        description_notes=payload.description_notes.strip(),
        required_date=payload.required_date,
        marketing_remarks=(payload.marketing_remarks or "").strip() or None,
        reference_images=[],
        reference_links=payload.reference_links,
        created_by_user_id=current_user.id,
        created_by=request_creator,
        request_created_by=request_creator,
        status="Pending Feasibility",
    )
    db.add(request)
    db.flush()

    yr_suffix = datetime.now(timezone.utc).year % 100
    request.request_code = f"FC-{request.id:04d}"
    request.sr_number = f"SR-{yr_suffix:02d}-{request.id:03d}"

    for index, (content_type, image_data) in enumerate(decoded_images):
        filename = (payload.reference_image_names[index] if payload.reference_image_names else f"Reference image {index + 1}").strip()
        request.reference_image_records.append(FeasibilityReferenceImage(
            original_name=filename[:255] or f"Reference image {index + 1}",
            content_type=content_type,
            image_data=image_data,
            sort_order=index,
        ))

    # Log initial "CREATED" activity
    add_activity(db, request, current_user, "Marketing", "CREATED", {
            "feasibility_type": request.feasibility_type,
            "custom_feasibility_type": request.custom_feasibility_type,
            "required_date": str(request.required_date),
            "customer": customer.name,
        })

    db.commit()
    request = load_request_for_response(db, request.id)
    return serialize_request(request)


# ---------------------------------------------------------------------------
# SAMP Lab Verdict Sign-off
# ---------------------------------------------------------------------------

@router.put(
    "/{request_id}/samp-verdict",
    response_model=FeasibilityRequestOut,
    summary="SAMP Lab Technical Sign-off / Verdict",
)
def record_samp_verdict(
    request_id: int,
    payload: FeasibilitySampVerdictPayload,
    db: Session = Depends(get_db),
    current_user=Depends(get_optional_current_user),
):
    require_department(current_user, "samp")
    request = (
        db.query(FeasibilityRequest)
        .options(
            joinedload(FeasibilityRequest.customer),
            selectinload(FeasibilityRequest.activities),
            reference_image_metadata_option(),
        )
        .with_for_update(of=FeasibilityRequest)
        .filter(FeasibilityRequest.id == request_id)
        .first()
    )
    if not request:
        raise HTTPException(status_code=404, detail="Feasibility request was not found")
    if request.sampling_feasibility_response:
        raise HTTPException(status_code=409, detail="The SAMP verdict has already been recorded")

    now = datetime.now(timezone.utc)
    # SLA Calculation: On-time if evaluated date is on or before required date
    is_on_time = now.date() <= request.required_date

    if payload.response == "Yes":
        new_status = "Feasible (SAMP Verified)"
    elif payload.response == "No":
        new_status = "Feasibility Rejected"
    else:
        new_status = "Conditional Feasibility"

    clean_remark = (payload.remark or "").strip() or None
    evaluator_name = current_user.name

    request.sampling_feasibility_response = payload.response
    request.sampling_feasibility_remark = clean_remark
    request.sampling_feasibility_approved_by = evaluator_name
    request.feasibility_closed_at = now
    request.feasibility_closed_by = "sampling"
    request.is_responded_on_time = is_on_time
    request.status = new_status

    # Record "SAMP_EVALUATED" activity log
    add_activity(db, request, current_user, "SAMP Lab", "SAMP_EVALUATED", {
            "response": payload.response,
            "remark": clean_remark,
            "is_responded_on_time": is_on_time,
            "evaluated_at": now.isoformat(),
            "status": new_status,
        })

    db.commit()
    request = load_request_for_response(db, request.id)
    return serialize_request(request)


# ---------------------------------------------------------------------------
# Marketing Final Decision (Accept or Reject)
# ---------------------------------------------------------------------------

@router.post(
    "/{request_id}/marketing-decision",
    response_model=FeasibilityRequestOut,
    summary="Marketing Final Decision (Accept or Reject)",
)
def record_marketing_decision(
    request_id: int,
    payload: FeasibilityMarketingDecisionPayload,
    db: Session = Depends(get_db),
    current_user=Depends(get_optional_current_user),
):
    require_department(current_user, "marketing")
    request = (
        db.query(FeasibilityRequest)
        .options(
            joinedload(FeasibilityRequest.customer),
            selectinload(FeasibilityRequest.activities),
            reference_image_metadata_option(),
        )
        .with_for_update(of=FeasibilityRequest)
        .filter(FeasibilityRequest.id == request_id)
        .first()
    )
    if not request:
        raise HTTPException(status_code=404, detail="Feasibility request was not found")

    if not request.sampling_feasibility_response:
        raise HTTPException(
            status_code=400,
            detail="Cannot record marketing decision before SAMP Lab has submitted an evaluation verdict.",
        )
    if request.marketing_decision:
        raise HTTPException(status_code=409, detail="The Marketing decision has already been recorded")

    now = datetime.now(timezone.utc)
    new_status = "Approved by Marketing" if payload.decision == "Accepted" else "Closed (Rejected)"
    decider_name = current_user.name
    clean_remark = (payload.decision_remark or "").strip() or None

    request.marketing_decision = payload.decision
    request.marketing_decision_by = decider_name
    request.marketing_decision_at = now
    request.marketing_decision_remark = clean_remark
    request.status = new_status

    # Record "MARKETING_DECIDED" activity log
    add_activity(db, request, current_user, "Marketing", "MARKETING_DECIDED", {
            "decision": payload.decision,
            "remark": clean_remark,
            "decided_at": now.isoformat(),
            "status": new_status,
        })

    db.commit()
    request = load_request_for_response(db, request.id)
    return serialize_request(request)


# ---------------------------------------------------------------------------
# Telemetry: Mark Request as Viewed
# ---------------------------------------------------------------------------

@router.post(
    "/{request_id}/viewed",
    summary="Record when a desk operator views a feasibility request",
)
def record_feasibility_viewed(
    request_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_optional_current_user),
):
    request = (
        db.query(FeasibilityRequest)
        .with_for_update(of=FeasibilityRequest)
        .filter(FeasibilityRequest.id == request_id)
        .first()
    )
    if not request:
        raise HTTPException(status_code=404, detail="Feasibility request was not found")

    roles = f"{current_user.role or ''} {current_user.sub_role or ''}".lower()
    actor_department = (
        "SAMP Lab" if "samp" in roles or "sampling" in roles
        else "Marketing" if "marketing" in roles
        else (current_user.sub_role or current_user.role or "Operations")
    )

    # Only log one VIEWED per department to keep chatter clean
    already_viewed = (
        db.query(FeasibilityActivityLog)
        .filter(
            FeasibilityActivityLog.feasibility_request_id == request_id,
            FeasibilityActivityLog.action == "VIEWED",
            FeasibilityActivityLog.actor_department == actor_department,
        )
        .first()
    )
    if not already_viewed:
        add_activity(
            db, request, current_user, actor_department, "VIEWED",
            {"viewed_at": datetime.now(timezone.utc).isoformat()},
        )
        db.commit()

    return {"success": True, "message": "View event recorded"}


# ---------------------------------------------------------------------------
# Generic Update (Compatibility)
# ---------------------------------------------------------------------------

@router.put(
    "/{request_id}",
    response_model=FeasibilityRequestOut,
    summary="Update feasibility review workflow fields",
)
def update_feasibility_request(
    request_id: int,
    payload: Optional[Dict[str, Any]] = Body(default=None),
    db: Session = Depends(get_db),
    current_user=Depends(get_optional_current_user),
):
    if not db.query(FeasibilityRequest.id).filter(FeasibilityRequest.id == request_id).first():
        raise HTTPException(status_code=404, detail="Feasibility request was not found")
    raise HTTPException(
        status_code=409,
        detail="Direct workflow edits are disabled. Use the SAMP verdict or Marketing decision endpoint so the change is audited.",
    )


# ---------------------------------------------------------------------------
# Delete & Resequencing
# ---------------------------------------------------------------------------

@router.delete(
    "/{request_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete feasibility request from database (testing / cleanup)",
)
def delete_feasibility_request(
    request_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    request = db.query(FeasibilityRequest).filter(FeasibilityRequest.id == request_id).first()
    if not request:
        raise HTTPException(status_code=404, detail="Feasibility request was not found")

    db.delete(request)
    db.commit()

    return None
