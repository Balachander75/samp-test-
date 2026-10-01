"""API endpoints for persisted feasibility-check requests, technical verdicts, and audit logging."""

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy import text
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.models.feasibility import FeasibilityActivityLog, FeasibilityRequest
from app.models.master import Customer
from app.schemas.feasibility import (
    FeasibilityActivityLogOut,
    FeasibilityMarketingDecisionPayload,
    FeasibilityRequestCreate,
    FeasibilityRequestOut,
    FeasibilityRequestUpdate,
    FeasibilitySampVerdictPayload,
)


router = APIRouter(prefix="/api/v1/feasibility-requests", tags=["Feasibility Requests"])


class ViewerTelemetryPayload(BaseModel):
    viewer_name: str = Field(min_length=1, max_length=255)
    department: str = Field(default="SAMP Lab", max_length=100)


def resequence_feasibility_requests(db: Session):
    """
    Re-sequences all existing FeasibilityRequests so their sample codes (sr_number and request_code)
    are strictly contiguous (e.g. FC-0001, FC-0002, SR-26-001, SR-26-002).
    Also resets the PostgreSQL auto-increment sequence feasibility_requests_id_seq.
    """
    items = db.query(FeasibilityRequest).order_by(FeasibilityRequest.id.asc()).all()
    yr_suffix = datetime.now(timezone.utc).year % 100

    # 1. Assign temporary codes to avoid unique constraint conflicts
    for idx, item in enumerate(items, start=1):
        item.request_code = f"FC-TMP-{item.id:04d}"
        item.sr_number = f"SR-TMP-{item.id:04d}"
    db.flush()

    # 2. Assign strictly sequential codes (001, 002, 003...)
    for idx, item in enumerate(items, start=1):
        item.request_code = f"FC-{idx:04d}"
        item.sr_number = f"SR-{yr_suffix:02d}-{idx:03d}"
    db.flush()

    # 3. Reset the sequence counter
    if not items:
        db.execute(text("ALTER SEQUENCE feasibility_requests_id_seq RESTART WITH 1"))
    else:
        max_id = max(item.id for item in items)
        db.execute(text(f"SELECT setval('feasibility_requests_id_seq', {max_id}, true)"))
    db.commit()


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
        "reference_images": request.reference_images or [],
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
):
    query = (
        db.query(FeasibilityRequest)
        .options(
            joinedload(FeasibilityRequest.customer),
            joinedload(FeasibilityRequest.activities),
        )
        .order_by(FeasibilityRequest.id.desc())
    )
    if status_filter and status_filter.strip():
        query = query.filter(FeasibilityRequest.status == status_filter.strip())
    return [serialize_request(request) for request in query.all()]


@router.get("/{request_id}", response_model=FeasibilityRequestOut, summary="Get single feasibility request")
def get_feasibility_request(
    request_id: int,
    db: Session = Depends(get_db),
):
    request = (
        db.query(FeasibilityRequest)
        .options(
            joinedload(FeasibilityRequest.customer),
            joinedload(FeasibilityRequest.activities),
        )
        .filter(FeasibilityRequest.id == request_id)
        .first()
    )
    if not request:
        raise HTTPException(status_code=404, detail="Feasibility request was not found")
    return serialize_request(request)


@router.get("/{request_id}/activities", response_model=List[FeasibilityActivityLogOut], summary="Get activity timeline")
def get_feasibility_activities(
    request_id: int,
    db: Session = Depends(get_db),
):
    activities = (
        db.query(FeasibilityActivityLog)
        .filter(FeasibilityActivityLog.feasibility_request_id == request_id)
        .order_by(FeasibilityActivityLog.id.asc())
        .all()
    )
    return [serialize_activity(act) for act in activities]


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
):
    customer_name = payload.customer.strip()
    customer = db.query(Customer).filter(Customer.name.ilike(customer_name)).first()
    if not customer:
        customer = Customer(name=customer_name)
        db.add(customer)
        db.flush()

    request_creator = (payload.request_created_by or payload.created_by or "").strip() or "Marketing Specialist"
    request = FeasibilityRequest(
        request_code="PENDING",
        sr_number="PENDING",
        customer_id=customer.id,
        feasibility_type=payload.feasibility_type,
        custom_feasibility_type=(payload.custom_feasibility_type or "").strip() or None,
        description_notes=payload.description_notes.strip(),
        required_date=payload.required_date,
        marketing_remarks=(payload.marketing_remarks or "").strip() or None,
        reference_images=payload.reference_images,
        reference_links=payload.reference_links,
        created_by_user_id=payload.created_by_user_id,
        created_by=request_creator,
        request_created_by=request_creator,
        status="Pending Feasibility",
    )
    db.add(request)
    db.flush()

    existing_count = db.query(FeasibilityRequest).count()
    yr_suffix = datetime.now(timezone.utc).year % 100
    request.request_code = f"FC-{existing_count:04d}"
    request.sr_number = f"SR-{yr_suffix:02d}-{existing_count:03d}"

    # Log initial "CREATED" activity
    activity = FeasibilityActivityLog(
        feasibility_request_id=request.id,
        actor_id=payload.created_by_user_id,
        actor_name=request_creator,
        actor_department="Marketing",
        action="CREATED",
        payload={
            "feasibility_type": request.feasibility_type,
            "custom_feasibility_type": request.custom_feasibility_type,
            "required_date": str(request.required_date),
            "customer": customer.name,
        },
    )
    db.add(activity)

    db.commit()
    db.refresh(request)
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
):
    request = (
        db.query(FeasibilityRequest)
        .options(
            joinedload(FeasibilityRequest.customer),
            joinedload(FeasibilityRequest.activities),
        )
        .filter(FeasibilityRequest.id == request_id)
        .first()
    )
    if not request:
        raise HTTPException(status_code=404, detail="Feasibility request was not found")

    now = datetime.now(timezone.utc)
    # SLA Calculation: On-time if evaluated date is on or before required date
    is_on_time = now.date() <= request.required_date

    if payload.response == "Yes":
        new_status = "Feasible (SAMP Verified)"
        default_remark = "Specifications and manufacturing capabilities verified feasible by Central Sampling Lab."
    elif payload.response == "No":
        new_status = "Feasibility Rejected"
        default_remark = "Specifications rejected by Central Sampling Lab."
    else:
        new_status = "Conditional Feasibility"
        default_remark = "Conditional feasibility approved with technical caveats."

    clean_remark = (payload.remark or "").strip() or default_remark
    evaluator_name = (payload.approved_by or "").strip() or "SAMP Lab Team"

    request.sampling_feasibility_response = payload.response
    request.sampling_feasibility_remark = clean_remark
    request.sampling_feasibility_approved_by = evaluator_name
    request.feasibility_closed_at = now
    request.feasibility_closed_by = "sampling"
    request.is_responded_on_time = is_on_time
    request.status = new_status

    # Record "SAMP_EVALUATED" activity log
    activity = FeasibilityActivityLog(
        feasibility_request_id=request.id,
        actor_name=evaluator_name,
        actor_department="SAMP Lab",
        action="SAMP_EVALUATED",
        payload={
            "response": payload.response,
            "remark": clean_remark,
            "is_responded_on_time": is_on_time,
            "evaluated_at": now.isoformat(),
            "status": new_status,
        },
    )
    db.add(activity)

    db.commit()
    db.refresh(request)
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
):
    request = (
        db.query(FeasibilityRequest)
        .options(
            joinedload(FeasibilityRequest.customer),
            joinedload(FeasibilityRequest.activities),
        )
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

    now = datetime.now(timezone.utc)
    new_status = "Approved by Marketing" if payload.decision == "Accepted" else "Closed (Rejected)"
    decider_name = (payload.decision_by or "").strip() or "Marketing Specialist"
    clean_remark = (payload.decision_remark or "").strip() or None

    request.marketing_decision = payload.decision
    request.marketing_decision_by = decider_name
    request.marketing_decision_at = now
    request.marketing_decision_remark = clean_remark
    request.status = new_status

    # Record "MARKETING_DECIDED" activity log
    activity = FeasibilityActivityLog(
        feasibility_request_id=request.id,
        actor_name=decider_name,
        actor_department="Marketing",
        action="MARKETING_DECIDED",
        payload={
            "decision": payload.decision,
            "remark": clean_remark,
            "decided_at": now.isoformat(),
            "status": new_status,
        },
    )
    db.add(activity)

    db.commit()
    db.refresh(request)
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
    payload: ViewerTelemetryPayload,
    db: Session = Depends(get_db),
):
    request = db.query(FeasibilityRequest).filter(FeasibilityRequest.id == request_id).first()
    if not request:
        raise HTTPException(status_code=404, detail="Feasibility request was not found")

    # Only log one VIEWED per department to keep chatter clean
    already_viewed = (
        db.query(FeasibilityActivityLog)
        .filter(
            FeasibilityActivityLog.feasibility_request_id == request_id,
            FeasibilityActivityLog.action == "VIEWED",
            FeasibilityActivityLog.actor_department == payload.department,
        )
        .first()
    )
    if not already_viewed:
        activity = FeasibilityActivityLog(
            feasibility_request_id=request.id,
            actor_name=payload.viewer_name,
            actor_department=payload.department,
            action="VIEWED",
            payload={"viewed_at": datetime.now(timezone.utc).isoformat()},
        )
        db.add(activity)
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
    payload: FeasibilityRequestUpdate,
    db: Session = Depends(get_db),
):
    request = (
        db.query(FeasibilityRequest)
        .options(
            joinedload(FeasibilityRequest.customer),
            joinedload(FeasibilityRequest.activities),
        )
        .filter(FeasibilityRequest.id == request_id)
        .first()
    )
    if not request:
        raise HTTPException(status_code=404, detail="Feasibility request was not found")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(request, field, value)

    db.commit()
    db.refresh(request)
    return serialize_request(request)


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
):
    request = db.query(FeasibilityRequest).filter(FeasibilityRequest.id == request_id).first()
    if not request:
        raise HTTPException(status_code=404, detail="Feasibility request was not found")

    db.delete(request)
    db.commit()

    # Automatically re-sequence remaining requests
    resequence_feasibility_requests(db)
    return None


@router.post(
    "/reset-sample-codes",
    summary="Reset and re-sequence feasibility sample codes and database sequence",
)
def reset_feasibility_sample_codes(
    db: Session = Depends(get_db),
):
    resequence_feasibility_requests(db)
    return {"success": True, "message": "Feasibility sample codes and sequence reset successfully"}
