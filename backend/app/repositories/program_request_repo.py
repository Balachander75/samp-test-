"""
Program Request Repository.
Handles all database operations for `program_requests` and `program_material_specifications`.
"""
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session, selectinload
from sqlalchemy import text
from app.repositories.base import BaseRepository
from app.models.program_request import ProgramRequest, ProgramMaterialSpecification, ProgramActivityLog


class ProgramRequestRepository(BaseRepository[ProgramRequest]):
    """Repository dedicated to seasonal program requests and material matrix."""

    def __init__(self, db: Session):
        super().__init__(ProgramRequest, db)

    def list_all_detailed(self) -> List[ProgramRequest]:
        """List all program requests with eager-loaded material specifications and activity logs."""
        return (
            self.db.query(ProgramRequest)
            .options(
                selectinload(ProgramRequest.materials),
                selectinload(ProgramRequest.activities),
            )
            .order_by(ProgramRequest.id.desc())
            .all()
        )

    def get_with_materials(self, request_id: int) -> Optional[ProgramRequest]:
        """Fetch program request by ID with materials and activity logs."""
        return (
            self.db.query(ProgramRequest)
            .options(
                selectinload(ProgramRequest.materials),
                selectinload(ProgramRequest.activities),
            )
            .filter(ProgramRequest.id == request_id)
            .first()
        )

    def add_activity_log(
        self,
        program_request_id: int,
        actor_name: str,
        actor_department: str,
        action: str,
        payload: Dict[str, Any],
        actor_id: Optional[int] = None,
    ) -> ProgramActivityLog:
        """Create and persist an activity log for seasonal program planning."""
        log = ProgramActivityLog(
            program_request_id=program_request_id,
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


    def add_material(
        self,
        program_request_id: int,
        material_data: Dict[str, Any],
    ) -> ProgramMaterialSpecification:
        """Add a material row to a program request."""
        mat = ProgramMaterialSpecification(
            program_request_id=program_request_id,
            **material_data,
        )
        self.db.add(mat)
        self.db.commit()
        self.db.refresh(mat)
        return mat

    def delete_material(self, program_request_id: int, material_id: int) -> bool:
        """Delete a material line from a program request."""
        mat = (
            self.db.query(ProgramMaterialSpecification)
            .filter(
                ProgramMaterialSpecification.id == material_id,
                ProgramMaterialSpecification.program_request_id == program_request_id,
            )
            .first()
        )
        if not mat:
            return False
        self.db.delete(mat)
        self.db.commit()
        return True

    def resequence_all(self, yr_suffix: int):
        """Re-sequence contiguous program request codes."""
        items = self.db.query(ProgramRequest).order_by(ProgramRequest.id.asc()).all()
        for item in items:
            item.request_code = f"PG-TMP-{item.id:04d}"
            item.sr_number = f"SR-TMP-{item.id:04d}"
        self.db.flush()

        for idx, item in enumerate(items, start=1):
            item.request_code = f"PG-{idx:04d}"
            item.sr_number = f"SR-{yr_suffix:02d}-PG-{idx:03d}"
        self.db.flush()

        if not items:
            self.db.execute(text("ALTER SEQUENCE program_requests_id_seq RESTART WITH 1"))
        else:
            max_id = max(item.id for item in items)
            self.db.execute(text(f"SELECT setval('program_requests_id_seq', {max_id}, true)"))
        self.db.commit()
