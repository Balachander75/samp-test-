"""
Feasibility Request Repository.
Handles all database operations for `feasibility_requests`, `feasibility_activities`,
and `feasibility_reference_images`.
"""
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session, joinedload, selectinload
from sqlalchemy import func
from app.repositories.base import BaseRepository
from app.models.feasibility import (
    FeasibilityRequest,
    FeasibilityActivityLog,
    FeasibilityReferenceImage,
)


class FeasibilityRepository(BaseRepository[FeasibilityRequest]):
    """Repository dedicated to feasibility requests and their audit logs."""

    def __init__(self, db: Session):
        super().__init__(FeasibilityRequest, db)

    def _eager_options(self):
        return (
            joinedload(FeasibilityRequest.customer),
            selectinload(FeasibilityRequest.activities),
            selectinload(FeasibilityRequest.reference_image_records).load_only(
                FeasibilityReferenceImage.id,
                FeasibilityReferenceImage.feasibility_request_id,
                FeasibilityReferenceImage.original_name,
                FeasibilityReferenceImage.content_type,
                FeasibilityReferenceImage.sort_order,
            ),
        )

    def get_with_details(self, request_id: int) -> Optional[FeasibilityRequest]:
        """Fetch request with eager-loaded customer, activities, and image metadata."""
        return (
            self.db.query(FeasibilityRequest)
            .options(*self._eager_options())
            .filter(FeasibilityRequest.id == request_id)
            .first()
        )

    def get_by_sr_number(self, sr_number: str) -> Optional[FeasibilityRequest]:
        """Fetch request by SR number."""
        return (
            self.db.query(FeasibilityRequest)
            .options(*self._eager_options())
            .filter(FeasibilityRequest.sr_number == sr_number)
            .first()
        )

    def list_all_detailed(self) -> List[FeasibilityRequest]:
        """List all feasibility requests with full details ordered newest first."""
        return (
            self.db.query(FeasibilityRequest)
            .options(*self._eager_options())
            .order_by(FeasibilityRequest.id.desc())
            .all()
        )

    def add_activity_log(
        self,
        feasibility_request_id: int,
        actor_id: Optional[int],
        actor_name: str,
        actor_department: str,
        action: str,
        payload: Dict[str, Any],
    ) -> FeasibilityActivityLog:
        """Append an audit log event to a feasibility request."""
        log = FeasibilityActivityLog(
            feasibility_request_id=feasibility_request_id,
            actor_id=actor_id,
            actor_name=actor_name,
            actor_department=actor_department,
            action=action,
            payload=payload,
        )
        self.db.add(log)
        self.db.commit()
        self.db.refresh(log)
        return log

    def get_image_record(self, request_id: int, image_id: int) -> Optional[FeasibilityReferenceImage]:
        """Fetch image binary content by image ID."""
        return (
            self.db.query(FeasibilityReferenceImage)
            .filter(
                FeasibilityReferenceImage.id == image_id,
                FeasibilityReferenceImage.feasibility_request_id == request_id,
            )
            .first()
        )
