"""API endpoints for Seasonal Program Planning and Material Specification Matrix."""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.auth.security import get_current_user, get_optional_current_user
from app.database import get_db
from app.schemas.program_request import (
    ProgramBatchSampRemarksUpdate,
    ProgramMaterialCreate,
    ProgramNoteCreate,
    ProgramRequestCreate,
    ProgramRequestOut,
    ProgramRequestUpdate,
    ProgramReviewSubmit,
    ProgramSeenSubmit,
    SingleSampRemarkUpdate,
)
from app.services.program_request_service import ProgramRequestService

router = APIRouter(prefix="/api/v1/program-requests", tags=["Program Requests"])


def get_program_service(db: Session = Depends(get_db)) -> ProgramRequestService:
    return ProgramRequestService(db)


@router.get("", response_model=List[ProgramRequestOut], summary="List all seasonal program requests")
def list_program_requests(
    status_filter: Optional[str] = Query(default=None, alias="status"),
    service: ProgramRequestService = Depends(get_program_service),
):
    """Retrieve all program requests with their material specification matrix rows and audit logs."""
    items = service.list_all()
    if status_filter and status_filter.strip():
        items = [i for i in items if i["status"] == status_filter.strip()]
    return items


@router.get("/{request_id}", response_model=ProgramRequestOut, summary="Get program request by ID")
def get_program_request(
    request_id: int,
    service: ProgramRequestService = Depends(get_program_service),
):
    """Fetch single program planning request with full matrix rows and audit logs."""
    item = service.get_by_id(request_id)
    if not item:
        raise HTTPException(status_code=404, detail="Program planning request was not found")
    return item


@router.post(
    "",
    response_model=ProgramRequestOut,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new program planning request with material matrix",
)
def create_program_request(
    payload: ProgramRequestCreate,
    service: ProgramRequestService = Depends(get_program_service),
    current_user=Depends(get_optional_current_user),
):
    """Creates a new program planning request with material matrix."""
    return service.create(payload, current_user=current_user)


@router.put("/{request_id}", response_model=ProgramRequestOut, summary="Update program request metadata")
def update_program_request(
    request_id: int,
    payload: ProgramRequestUpdate,
    service: ProgramRequestService = Depends(get_program_service),
    current_user=Depends(get_optional_current_user),
):
    """Update high-level program request fields (e.g. status, customer, plant)."""
    item = service.update(request_id, payload, current_user=current_user)
    if not item:
        raise HTTPException(status_code=404, detail="Program planning request was not found")
    return item


@router.patch("/{request_id}/status", response_model=ProgramRequestOut, summary="Update program request status")
def update_program_request_status(
    request_id: int,
    payload: ProgramRequestUpdate,
    service: ProgramRequestService = Depends(get_program_service),
    current_user=Depends(get_optional_current_user),
):
    """Patch status on a seasonal program request."""
    item = service.update(request_id, payload, current_user=current_user)
    if not item:
        raise HTTPException(status_code=404, detail="Program planning request was not found")
    return item


@router.post(
    "/{request_id}/notes",
    response_model=ProgramRequestOut,
    summary="Add a communication note / comment to the program planning chatter",
)
def add_program_note(
    request_id: int,
    payload: ProgramNoteCreate,
    service: ProgramRequestService = Depends(get_program_service),
    current_user=Depends(get_optional_current_user),
):
    """Add a persistent note/comment to the program planning chatter and audit activity log."""
    return service.add_note(request_id, payload.note, current_user=current_user)


@router.put(
    "/{request_id}/samp-remarks",
    response_model=ProgramRequestOut,
    summary="Batch update SAMP team remarks on material specification matrix rows",
)
def update_batch_samp_remarks(
    request_id: int,
    payload: ProgramBatchSampRemarksUpdate,
    service: ProgramRequestService = Depends(get_program_service),
    current_user=Depends(get_optional_current_user),
):
    """Batch update SAMP remarks on multiple material specification matrix rows."""
    item = service.update_batch_samp_remarks(request_id, payload, current_user=current_user)
    if not item:
        raise HTTPException(status_code=404, detail="Program planning request was not found")
    return item


@router.patch(
    "/{request_id}/materials/{material_id}/samp-remark",
    response_model=ProgramRequestOut,
    summary="Update SAMP team remark on a single material specification row",
)
def update_single_material_samp_remark(
    request_id: int,
    material_id: int,
    payload: SingleSampRemarkUpdate,
    service: ProgramRequestService = Depends(get_program_service),
    current_user=Depends(get_optional_current_user),
):
    """Update SAMP team remark on an individual material row."""
    item = service.update_single_samp_remark(request_id, material_id, payload, current_user=current_user)
    if not item:
        raise HTTPException(status_code=404, detail="Program request or material row was not found")
    return item


@router.post(
    "/{request_id}/materials",
    response_model=ProgramRequestOut,
    status_code=status.HTTP_201_CREATED,
    summary="Add a material row to an existing program planning request",
)
def add_program_material(
    request_id: int,
    payload: ProgramMaterialCreate,
    service: ProgramRequestService = Depends(get_program_service),
    current_user=Depends(get_optional_current_user),
):
    """Adds a new material specification row."""
    item = service.add_material(request_id, payload, current_user=current_user)
    if not item:
        raise HTTPException(status_code=404, detail="Program planning request was not found")
    return item


@router.delete(
    "/{request_id}/materials/{material_id}",
    response_model=ProgramRequestOut,
    summary="Delete a material row from an existing program planning request",
)
def delete_program_material(
    request_id: int,
    material_id: int,
    service: ProgramRequestService = Depends(get_program_service),
    current_user=Depends(get_optional_current_user),
):
    """Removes a material specification row."""
    item = service.delete_material(request_id, material_id, current_user=current_user)
    if not item:
        raise HTTPException(status_code=404, detail="Program request or material row was not found")
    return item


@router.post(
    "/{request_id}/review",
    response_model=ProgramRequestOut,
    summary="Submit sign-off review by Sampling Team or Plant Team",
)
def submit_program_review(
    request_id: int,
    payload: ProgramReviewSubmit,
    service: ProgramRequestService = Depends(get_program_service),
    current_user=Depends(get_optional_current_user),
):
    """Record technical or manufacturing review, verdict, and remarks."""
    item = service.submit_review(request_id, payload, current_user=current_user)
    if not item:
        raise HTTPException(status_code=404, detail="Program planning request was not found")
    return item


@router.post(
    "/{request_id}/seen",
    response_model=ProgramRequestOut,
    summary="Record that Sampling Team or Plant Team has seen/opened this program request",
)
def mark_program_seen(
    request_id: int,
    payload: ProgramSeenSubmit,
    service: ProgramRequestService = Depends(get_program_service),
    current_user=Depends(get_optional_current_user),
):
    """Update seen status timestamp and viewer."""
    item = service.mark_seen(request_id, payload, current_user=current_user)
    if not item:
        raise HTTPException(status_code=404, detail="Program planning request was not found")
    return item


@router.delete(
    "/{request_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a program planning request",
)
def delete_program_request(
    request_id: int,
    service: ProgramRequestService = Depends(get_program_service),
):
    """Permanently delete a seasonal program request and re-sequence remaining requests."""
    deleted = service.delete(request_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Program planning request was not found")
    return None

