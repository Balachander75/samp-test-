"""API endpoints for Seasonal Program Planning and Material Specification Matrix."""

from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import text
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.models.program_request import ProgramMaterialSpecification, ProgramRequest
from app.utils.business_year import get_current_business_year
from app.schemas.program_request import (
    ProgramBatchSampRemarksUpdate,
    ProgramMaterialCreate,
    ProgramRequestCreate,
    ProgramRequestOut,
    ProgramRequestUpdate,
    SingleSampRemarkUpdate,
)

router = APIRouter(prefix="/api/v1/program-requests", tags=["Program Requests"])


def resequence_program_requests(db: Session):
    """
    Re-sequences all existing ProgramRequests so their sample codes (sr_number and request_code)
    are strictly contiguous (e.g. PG-0001, PG-0002, SR-26-PG-001, SR-26-PG-002).
    Also resets the PostgreSQL auto-increment sequence program_requests_id_seq.
    """
    items = db.query(ProgramRequest).order_by(ProgramRequest.id.asc()).all()
    yr_suffix = datetime.now(timezone.utc).year % 100

    # 1. Assign temporary codes to avoid unique constraint conflicts
    for idx, item in enumerate(items, start=1):
        item.request_code = f"PG-TMP-{item.id:04d}"
        item.sr_number = f"SR-TMP-{item.id:04d}"
    db.flush()

    # 2. Assign strictly sequential codes (001, 002, 003...)
    for idx, item in enumerate(items, start=1):
        item.request_code = f"PG-{idx:04d}"
        item.sr_number = f"SR-{yr_suffix:02d}-PG-{idx:03d}"
    db.flush()

    # 3. Reset the sequence counter
    if not items:
        db.execute(text("ALTER SEQUENCE program_requests_id_seq RESTART WITH 1"))
    else:
        max_id = max(item.id for item in items)
        db.execute(text(f"SELECT setval('program_requests_id_seq', {max_id}, true)"))
    db.commit()


def serialize_program_request(item: ProgramRequest) -> dict:
    """Serializes a ProgramRequest and its material specifications to a clean dictionary."""
    return {
        "id": item.id,
        "request_code": item.request_code,
        "sr_number": item.sr_number,
        "customer_name": item.customer_name,
        "target_plant": item.target_plant,
        "program_campaign_title": item.program_campaign_title,
        "program_year": item.program_year,
        "status": item.status,
        "created_by": item.created_by,
        "created_at": item.created_at,
        "updated_at": item.updated_at,
        "materials": [
            {
                "id": mat.id,
                "program_request_id": mat.program_request_id,
                "material_type": mat.material_type,
                "supplier_name": mat.supplier_name,
                "grade": mat.grade,
                "color_variant": mat.color_variant,
                "caliper_wt": mat.caliper_wt,
                "quantity": mat.quantity,
                "unit": mat.unit,
                "remark": mat.remark,
                "samp_remark": mat.samp_remark,
                "created_at": mat.created_at,
                "updated_at": mat.updated_at,
            }
            for mat in (item.materials or [])
        ],
    }


@router.get("", response_model=List[ProgramRequestOut], summary="List all seasonal program requests")
def list_program_requests(
    status_filter: Optional[str] = Query(default=None, alias="status"),
    db: Session = Depends(get_db),
):
    """Retrieve all program requests with their material specification matrix rows."""
    query = (
        db.query(ProgramRequest)
        .options(joinedload(ProgramRequest.materials))
        .order_by(ProgramRequest.id.desc())
    )
    if status_filter and status_filter.strip():
        query = query.filter(ProgramRequest.status == status_filter.strip())

    return [serialize_program_request(item) for item in query.all()]


@router.get("/{request_id}", response_model=ProgramRequestOut, summary="Get program request by ID")
def get_program_request(
    request_id: int,
    db: Session = Depends(get_db),
):
    """Fetch single program planning request with full matrix rows."""
    item = (
        db.query(ProgramRequest)
        .options(joinedload(ProgramRequest.materials))
        .filter(ProgramRequest.id == request_id)
        .first()
    )
    if not item:
        raise HTTPException(status_code=404, detail="Program planning request was not found")

    return serialize_program_request(item)


@router.post(
    "",
    response_model=ProgramRequestOut,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new program planning request with material matrix",
)
def create_program_request(
    payload: ProgramRequestCreate,
    db: Session = Depends(get_db),
):
    """
    Creates a new program planning request with customer name, target plant,
    program campaign title, program year, and an optional material specification matrix.
    """
    program_req = ProgramRequest(
        request_code="PENDING",
        sr_number="PENDING",
        customer_name=payload.customer_name.strip(),
        target_plant=payload.target_plant.strip(),
        program_campaign_title=payload.program_campaign_title.strip(),
        program_year=(payload.program_year or get_current_business_year()).strip(),
        status="Pending SAMP Review",
        created_by=(payload.created_by or "Marketing Team").strip() or None,
    )
    db.add(program_req)
    db.flush()

    # Assign operational identifier codes based on current sequence count
    existing_count = db.query(ProgramRequest).count()
    yr_suffix = datetime.now(timezone.utc).year % 100
    program_req.request_code = f"PG-{existing_count:04d}"
    program_req.sr_number = f"SR-{yr_suffix:02d}-PG-{existing_count:03d}"

    # Add Material Specification Matrix rows (all fields optional)
    if payload.materials:
        for mat_item in payload.materials:
            spec = ProgramMaterialSpecification(
                program_request_id=program_req.id,
                material_type=(mat_item.material_type or "").strip() or None,
                supplier_name=(mat_item.supplier_name or "").strip() or None,
                grade=(mat_item.grade or "").strip() or None,
                color_variant=(mat_item.color_variant or "").strip() or None,
                caliper_wt=(mat_item.caliper_wt or "").strip() or None,
                quantity=(mat_item.quantity or "").strip() or None,
                unit=(mat_item.unit or "").strip() or None,
                remark=(mat_item.remark or "").strip() or None,
                samp_remark=(mat_item.samp_remark or "").strip() or None,
            )
            db.add(spec)

    db.commit()
    db.refresh(program_req)
    return serialize_program_request(program_req)


@router.put("/{request_id}", response_model=ProgramRequestOut, summary="Update program request metadata")
def update_program_request(
    request_id: int,
    payload: ProgramRequestUpdate,
    db: Session = Depends(get_db),
):
    """Update high-level program request fields (e.g. status, customer, plant)."""
    item = (
        db.query(ProgramRequest)
        .options(joinedload(ProgramRequest.materials))
        .filter(ProgramRequest.id == request_id)
        .first()
    )
    if not item:
        raise HTTPException(status_code=404, detail="Program planning request was not found")

    for field, value in payload.model_dump(exclude_unset=True).items():
        if value is not None:
            setattr(item, field, value)

    db.commit()
    db.refresh(item)
    return serialize_program_request(item)


@router.put(
    "/{request_id}/samp-remarks",
    response_model=ProgramRequestOut,
    summary="Batch update SAMP team remarks on material specification matrix rows",
)
def update_batch_samp_remarks(
    request_id: int,
    payload: ProgramBatchSampRemarksUpdate,
    db: Session = Depends(get_db),
):
    """
    Allows the SAMP team in view mode to record/update their evaluation remarks
    on multiple material specification matrix rows at once.
    """
    item = (
        db.query(ProgramRequest)
        .options(joinedload(ProgramRequest.materials))
        .filter(ProgramRequest.id == request_id)
        .first()
    )
    if not item:
        raise HTTPException(status_code=404, detail="Program planning request was not found")

    # Map materials by ID for fast lookup
    mat_map = {mat.id: mat for mat in item.materials}

    for remark_update in payload.remarks:
        mat = mat_map.get(remark_update.material_id)
        if mat:
            mat.samp_remark = (remark_update.samp_remark or "").strip() or None

    db.commit()
    db.refresh(item)
    return serialize_program_request(item)


@router.patch(
    "/{request_id}/materials/{material_id}/samp-remark",
    response_model=ProgramRequestOut,
    summary="Update SAMP team remark on a single material specification row",
)
def update_single_material_samp_remark(
    request_id: int,
    material_id: int,
    payload: SingleSampRemarkUpdate,
    db: Session = Depends(get_db),
):
    """
    Allows the SAMP team in view mode to update the SAMP remark on an individual
    material specification row with immediate live feedback.
    """
    item = (
        db.query(ProgramRequest)
        .options(joinedload(ProgramRequest.materials))
        .filter(ProgramRequest.id == request_id)
        .first()
    )
    if not item:
        raise HTTPException(status_code=404, detail="Program planning request was not found")

    mat = (
        db.query(ProgramMaterialSpecification)
        .filter(
            ProgramMaterialSpecification.id == material_id,
            ProgramMaterialSpecification.program_request_id == request_id,
        )
        .first()
    )
    if not mat:
        raise HTTPException(status_code=404, detail="Material specification row was not found")

    mat.samp_remark = (payload.samp_remark or "").strip() or None
    db.commit()
    db.refresh(item)
    return serialize_program_request(item)


@router.post(
    "/{request_id}/materials",
    response_model=ProgramRequestOut,
    status_code=status.HTTP_201_CREATED,
    summary="Add a new material specification row to an existing program planning request",
)
def add_program_material(
    request_id: int,
    payload: ProgramMaterialCreate,
    db: Session = Depends(get_db),
):
    """
    Appends a new Material Specification Matrix row to an existing program planning request.
    Timestamp `created_at` is automatically recorded in the database.
    """
    item = (
        db.query(ProgramRequest)
        .options(joinedload(ProgramRequest.materials))
        .filter(ProgramRequest.id == request_id)
        .first()
    )
    if not item:
        raise HTTPException(status_code=404, detail="Program planning request was not found")

    new_mat = ProgramMaterialSpecification(
        program_request_id=request_id,
        material_type=(payload.material_type or "").strip() or None,
        supplier_name=(payload.supplier_name or "").strip() or None,
        grade=(payload.grade or "").strip() or None,
        color_variant=(payload.color_variant or "").strip() or None,
        caliper_wt=(payload.caliper_wt or "").strip() or None,
        quantity=(payload.quantity or "").strip() or None,
        unit=(payload.unit or "").strip() or None,
        remark=(payload.remark or "").strip() or None,
        samp_remark=(payload.samp_remark or "").strip() or None,
    )
    db.add(new_mat)
    db.commit()
    db.refresh(item)
    return serialize_program_request(item)


@router.delete(
    "/{request_id}/materials/{material_id}",
    response_model=ProgramRequestOut,
    summary="Delete a material specification row from an existing program request",
)
def delete_program_material(
    request_id: int,
    material_id: int,
    db: Session = Depends(get_db),
):
    """Deletes an individual material specification row from a program request."""
    item = (
        db.query(ProgramRequest)
        .options(joinedload(ProgramRequest.materials))
        .filter(ProgramRequest.id == request_id)
        .first()
    )
    if not item:
        raise HTTPException(status_code=404, detail="Program planning request was not found")

    mat = (
        db.query(ProgramMaterialSpecification)
        .filter(
            ProgramMaterialSpecification.id == material_id,
            ProgramMaterialSpecification.program_request_id == request_id,
        )
        .first()
    )
    if not mat:
        raise HTTPException(status_code=404, detail="Material specification row was not found")

    db.delete(mat)
    db.commit()
    db.refresh(item)
    return serialize_program_request(item)


@router.delete(
    "/{request_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete program request",
)
def delete_program_request(
    request_id: int,
    db: Session = Depends(get_db),
):
    """Delete a program planning request and all associated matrix items."""
    item = db.query(ProgramRequest).filter(ProgramRequest.id == request_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Program planning request was not found")

    db.delete(item)
    db.commit()

    # Automatically resequence remaining requests and reset sample code sequence
    resequence_program_requests(db)
    return None


@router.post(
    "/reset-sample-codes",
    summary="Reset and re-sequence program planning sample codes and database sequence",
)
def reset_program_sample_codes(
    db: Session = Depends(get_db),
):
    """Manually trigger resequencing of all program planning sample codes."""
    resequence_program_requests(db)
    return {"success": True, "message": "Program sample codes and sequence reset successfully"}
