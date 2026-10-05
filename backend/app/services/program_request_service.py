"""
Program Request Service.
Encapsulates business operations for Seasonal Program Planning, Material Matrices,
and permanent audit chatter logging.
"""
from typing import Optional, List, Dict, Any, Tuple
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.repositories.program_request_repo import ProgramRequestRepository
from app.models.program_request import ProgramRequest
from app.schemas.program_request import (
    ProgramRequestCreate,
    ProgramRequestUpdate,
    ProgramBatchSampRemarksUpdate,
    SingleSampRemarkUpdate,
    ProgramMaterialCreate,
)
from app.utils.business_year import get_current_business_year


class ProgramRequestService:
    """Application service for Seasonal Program Planning."""

    def __init__(self, db: Session):
        self.db = db
        self.repo = ProgramRequestRepository(db)

    def _get_actor_info(self, current_user: Optional[Any] = None) -> Tuple[Optional[int], str, str]:
        """Extract user id, display name, and department from current_user object."""
        if current_user:
            name = (
                getattr(current_user, "name", None)
                or getattr(current_user, "username", None)
                or getattr(current_user, "email", None)
                or "Unknown User"
            )
            dept = (
                getattr(current_user, "department", None)
                or getattr(current_user, "role", None)
                or "Marketing"
            )
            uid = getattr(current_user, "id", None)
            return uid, name, dept
        return None, "System Operator", "System"

    def serialize(self, item: ProgramRequest) -> Dict[str, Any]:
        """Serializes a ProgramRequest, material matrix, and activity audit logs."""
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
                    "id": m.id,
                    "program_request_id": m.program_request_id,
                    "material_type": m.material_type,
                    "supplier_name": m.supplier_name,
                    "grade": m.grade,
                    "color_variant": m.color_variant,
                    "caliper_wt": m.caliper_wt,
                    "quantity": m.quantity,
                    "unit": m.unit,
                    "remark": m.remark,
                    "samp_remark": m.samp_remark,
                    "created_at": m.created_at,
                    "updated_at": m.updated_at,
                }
                for m in (item.materials or [])
            ],
            "activities": [
                {
                    "id": a.id,
                    "program_request_id": a.program_request_id,
                    "actor_id": a.actor_id,
                    "actor_name": a.actor_name,
                    "actor_department": a.actor_department,
                    "action": a.action,
                    "payload": a.payload or {},
                    "created_at": a.created_at,
                }
                for a in sorted(item.activities or [], key=lambda x: x.created_at or datetime.min)
            ],
        }

    def list_all(self) -> List[Dict[str, Any]]:
        """List all program requests."""
        items = self.repo.list_all_detailed()
        return [self.serialize(i) for i in items]

    def get_by_id(self, request_id: int) -> Optional[Dict[str, Any]]:
        """Fetch single program request by ID."""
        item = self.repo.get_with_materials(request_id)
        if not item:
            return None
        return self.serialize(item)

    def create(self, payload: ProgramRequestCreate, current_user: Optional[Any] = None) -> Dict[str, Any]:
        """Create program planning request and assign contiguous codes."""
        actor_id, actor_name, actor_dept = self._get_actor_info(current_user)
        creator_name = payload.created_by or actor_name or "Marketing Team"

        program_req = ProgramRequest(
            request_code="PENDING",
            sr_number="PENDING",
            customer_name=payload.customer_name.strip(),
            target_plant=payload.target_plant.strip(),
            program_campaign_title=payload.program_campaign_title.strip(),
            program_year=(payload.program_year or get_current_business_year()).strip(),
            status="Pending SAMP Review",
            created_by=creator_name,
        )
        self.db.add(program_req)
        self.db.flush()

        existing_count = self.db.query(ProgramRequest).count()
        yr_suffix = datetime.now(timezone.utc).year % 100
        program_req.request_code = f"PG-{existing_count:04d}"
        program_req.sr_number = f"SR-{yr_suffix:02d}-PG-{existing_count:03d}"

        materials_count = 0
        if payload.materials:
            for mat_item in payload.materials:
                self.repo.add_material(
                    program_request_id=program_req.id,
                    material_data={
                        "material_type": (mat_item.material_type or "").strip() or None,
                        "supplier_name": (mat_item.supplier_name or "").strip() or None,
                        "grade": (mat_item.grade or "").strip() or None,
                        "color_variant": (mat_item.color_variant or "").strip() or None,
                        "caliper_wt": (mat_item.caliper_wt or "").strip() or None,
                        "quantity": (mat_item.quantity or "").strip() or None,
                        "unit": (mat_item.unit or "").strip() or None,
                        "remark": (mat_item.remark or "").strip() or None,
                        "samp_remark": (mat_item.samp_remark or "").strip() or None,
                    },
                )
                materials_count += 1

        # Audit activity
        self.repo.add_activity_log(
            program_request_id=program_req.id,
            actor_name=creator_name,
            actor_department=actor_dept if current_user else "Marketing",
            action="CREATED",
            payload={
                "customer_name": program_req.customer_name,
                "program_campaign_title": program_req.program_campaign_title,
                "material_count": materials_count,
            },
            actor_id=actor_id,
        )

        self.db.commit()
        item = self.repo.get_with_materials(program_req.id)
        return self.serialize(item)

    def update(
        self,
        request_id: int,
        payload: ProgramRequestUpdate,
        current_user: Optional[Any] = None,
    ) -> Optional[Dict[str, Any]]:
        """Update high-level metadata."""
        item = self.repo.get_with_materials(request_id)
        if not item:
            return None

        actor_id, actor_name, actor_dept = self._get_actor_info(current_user)
        updates = payload.model_dump(exclude_unset=True)
        old_status = item.status

        for field, value in updates.items():
            if value is not None:
                setattr(item, field, value)

        # Audit status changes or general updates
        if "status" in updates and updates["status"] != old_status:
            self.repo.add_activity_log(
                program_request_id=item.id,
                actor_name=actor_name,
                actor_department=actor_dept,
                action="STATUS_UPDATED",
                payload={"old_status": old_status, "new_status": item.status},
                actor_id=actor_id,
            )
        elif updates:
            self.repo.add_activity_log(
                program_request_id=item.id,
                actor_name=actor_name,
                actor_department=actor_dept,
                action="UPDATED",
                payload={"fields": list(updates.keys())},
                actor_id=actor_id,
            )

        self.db.commit()
        self.db.refresh(item)
        return self.serialize(item)

    def update_batch_samp_remarks(
        self,
        request_id: int,
        payload: ProgramBatchSampRemarksUpdate,
        current_user: Optional[Any] = None,
    ) -> Optional[Dict[str, Any]]:
        """Batch update SAMP remarks on materials."""
        item = self.repo.get_with_materials(request_id)
        if not item:
            return None

        actor_id, actor_name, actor_dept = self._get_actor_info(current_user)
        mat_map = {mat.id: mat for mat in item.materials}
        updated_count = 0

        for remark_update in payload.remarks:
            mat = mat_map.get(remark_update.material_id)
            if mat:
                mat.samp_remark = (remark_update.samp_remark or "").strip() or None
                updated_count += 1

        self.repo.add_activity_log(
            program_request_id=item.id,
            actor_name=actor_name,
            actor_department=actor_dept,
            action="SAMP_REMARKS_UPDATED",
            payload={"updated_count": updated_count},
            actor_id=actor_id,
        )

        self.db.commit()
        self.db.refresh(item)
        return self.serialize(item)

    def update_single_samp_remark(
        self,
        request_id: int,
        material_id: int,
        payload: SingleSampRemarkUpdate,
        current_user: Optional[Any] = None,
    ) -> Optional[Dict[str, Any]]:
        """Update single SAMP remark."""
        item = self.repo.get_with_materials(request_id)
        if not item:
            return None
        mat = next((m for m in item.materials if m.id == material_id), None)
        if not mat:
            return None

        actor_id, actor_name, actor_dept = self._get_actor_info(current_user)
        old_remark = mat.samp_remark
        new_remark = (payload.samp_remark or "").strip() or None
        mat.samp_remark = new_remark

        self.repo.add_activity_log(
            program_request_id=item.id,
            actor_name=actor_name,
            actor_department=actor_dept,
            action="SAMP_REMARK_UPDATED",
            payload={
                "material_id": material_id,
                "material_type": mat.material_type,
                "old_remark": old_remark,
                "new_remark": new_remark,
            },
            actor_id=actor_id,
        )

        self.db.commit()
        self.db.refresh(item)
        return self.serialize(item)

    def add_material(
        self,
        request_id: int,
        payload: ProgramMaterialCreate,
        current_user: Optional[Any] = None,
    ) -> Optional[Dict[str, Any]]:
        """Add single material spec to program request."""
        item = self.repo.get_with_materials(request_id)
        if not item:
            return None

        actor_id, actor_name, actor_dept = self._get_actor_info(current_user)
        mat = self.repo.add_material(
            program_request_id=request_id,
            material_data={
                "material_type": (payload.material_type or "").strip() or None,
                "supplier_name": (payload.supplier_name or "").strip() or None,
                "grade": (payload.grade or "").strip() or None,
                "color_variant": (payload.color_variant or "").strip() or None,
                "caliper_wt": (payload.caliper_wt or "").strip() or None,
                "quantity": (payload.quantity or "").strip() or None,
                "unit": (payload.unit or "").strip() or None,
                "remark": (payload.remark or "").strip() or None,
                "samp_remark": (payload.samp_remark or "").strip() or None,
            },
        )

        self.repo.add_activity_log(
            program_request_id=item.id,
            actor_name=actor_name,
            actor_department=actor_dept,
            action="MATERIAL_ADDED",
            payload={
                "material_id": mat.id,
                "material_type": mat.material_type,
                "supplier_name": mat.supplier_name,
                "quantity": mat.quantity,
            },
            actor_id=actor_id,
        )

        self.db.refresh(item)
        return self.serialize(item)

    def delete_material(
        self,
        request_id: int,
        material_id: int,
        current_user: Optional[Any] = None,
    ) -> Optional[Dict[str, Any]]:
        """Delete material spec from program request."""
        item = self.repo.get_with_materials(request_id)
        if not item:
            return None

        mat = next((m for m in item.materials if m.id == material_id), None)
        if not mat:
            return None

        actor_id, actor_name, actor_dept = self._get_actor_info(current_user)
        mat_type = mat.material_type

        deleted = self.repo.delete_material(request_id, material_id)
        if not deleted:
            return None

        self.repo.add_activity_log(
            program_request_id=item.id,
            actor_name=actor_name,
            actor_department=actor_dept,
            action="MATERIAL_DELETED",
            payload={"material_id": material_id, "material_type": mat_type},
            actor_id=actor_id,
        )

        self.db.refresh(item)
        return self.serialize(item)

    def add_note(
        self,
        request_id: int,
        note: str,
        current_user: Optional[Any] = None,
    ) -> Dict[str, Any]:
        """Add a persistent communication note to program request chatter audit log."""
        item = self.repo.get_with_materials(request_id)
        if not item:
            raise HTTPException(status_code=404, detail="Program planning request was not found")

        trimmed_note = (note or "").strip()
        if not trimmed_note:
            raise HTTPException(status_code=400, detail="Note content cannot be empty")

        actor_id, actor_name, actor_dept = self._get_actor_info(current_user)

        self.repo.add_activity_log(
            program_request_id=item.id,
            actor_name=actor_name,
            actor_department=actor_dept,
            action="NOTE_POSTED",
            payload={"note": trimmed_note},
            actor_id=actor_id,
        )

        self.db.refresh(item)
        return self.serialize(item)

    def delete(self, request_id: int) -> bool:
        """Delete program request and re-sequence remaining."""
        item = self.repo.get_by_id(request_id)
        if not item:
            return False
        self.db.delete(item)
        self.db.commit()
        yr_suffix = datetime.now(timezone.utc).year % 100
        self.repo.resequence_all(yr_suffix)
        return True
