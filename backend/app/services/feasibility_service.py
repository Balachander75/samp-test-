"""
Feasibility Request Service.
Encapsulates business operations for technical verdicts, image decoding,
status transitions, and activity audit logging.
"""
import base64
import binascii
import re
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any, Tuple
from fastapi import HTTPException
from sqlalchemy.orm import Session
from app.repositories.feasibility_repo import FeasibilityRepository
from app.models.feasibility import (
    FeasibilityRequest,
    FeasibilityReferenceImage,
)
from app.models.master import Customer, Plant
from app.models.sample_request import CreateSampleRequest
from app.schemas.feasibility import (
    FeasibilityRequestCreate,
    FeasibilitySampVerdictPayload,
    FeasibilityMarketingDecisionPayload,
)

MAX_IMAGE_BYTES = 1_048_576
IMAGE_DATA_URL_RE = re.compile(r"^data:(image/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$")


class FeasibilityService:
    """Application service for Feasibility Requests and Verdicts."""

    def __init__(self, db: Session, api_prefix: str = "/api/v1/feasibility-requests"):
        self.db = db
        self.repo = FeasibilityRepository(db)
        self.api_prefix = api_prefix

    @staticmethod
    def decode_image_data_url(data_url: str, enforce_size_limit: bool = True) -> Tuple[str, bytes]:
        """Decode and validate a base64 image data URL."""
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

    def serialize_activity(self, activity) -> Dict[str, Any]:
        """Serialize an activity log entry."""
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

    def serialize_request(self, request: FeasibilityRequest) -> Dict[str, Any]:
        """Serialize FeasibilityRequest model instance."""
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
                    f"{self.api_prefix}/{request.id}/images/{image.id}"
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
            "taken_by_samp": request.taken_by_samp,
            "taken_at_samp": request.taken_at_samp,
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
            "converted_sample_request_id": request.converted_sample_request_id,
            "converted_sr_number": request.converted_sr_number,
            "converted_at": request.converted_at,
            "converted_by": request.converted_by,
            "activities": [
                self.serialize_activity(act)
                for act in (request.activities or [])
            ],
        }

    def list_requests(self, status_filter: Optional[str] = None) -> List[Dict[str, Any]]:
        """List all requests with eager-loaded relations."""
        requests = self.repo.list_all_detailed()
        if status_filter and status_filter.strip():
            requests = [r for r in requests if r.status == status_filter.strip()]
        return [self.serialize_request(r) for r in requests]

    def get_by_id(self, request_id: int) -> Optional[Dict[str, Any]]:
        """Fetch request by ID with relations."""
        req = self.repo.get_with_details(request_id)
        if not req:
            return None
        return self.serialize_request(req)

    def create(self, payload: FeasibilityRequestCreate, current_user=None) -> Dict[str, Any]:
        """Create new feasibility check and assign codes."""
        customer_name = payload.customer.strip()
        customer = self.db.query(Customer).filter(Customer.name.ilike(customer_name)).first()
        if not customer:
            customer = Customer(name=customer_name)
            self.db.add(customer)
            self.db.flush()

        creator_name = getattr(payload, "created_by", None) or (current_user.name if current_user else "Marketing Specialist")
        creator_user_id = current_user.id if current_user else None

        req = FeasibilityRequest(
            request_code="PENDING",
            sr_number="PENDING",
            customer_id=customer.id,
            feasibility_type=payload.feasibility_type,
            custom_feasibility_type=payload.custom_feasibility_type,
            description_notes=payload.description_notes,
            required_date=payload.required_date,
            marketing_remarks=payload.marketing_remarks,
            reference_images=[],
            reference_links=payload.reference_links or [],
            created_by=creator_name,
            request_created_by=creator_name,
            created_by_user_id=creator_user_id,
            status="Pending Feasibility",
        )
        self.db.add(req)
        self.db.flush()

        yr_suffix = datetime.now(timezone.utc).year % 100
        seq = req.id
        while True:
            candidate_code = f"FS-{seq:04d}"
            candidate_sr = f"SR-{yr_suffix:02d}-FS-{seq:04d}"
            collision = (
                self.db.query(FeasibilityRequest)
                .filter(
                    (FeasibilityRequest.request_code == candidate_code)
                    | (FeasibilityRequest.sr_number == candidate_sr)
                )
                .filter(FeasibilityRequest.id != req.id)
                .first()
            )
            if not collision:
                req.request_code = candidate_code
                req.sr_number = candidate_sr
                break
            seq += 1

        # Decode reference images
        if payload.reference_images:
            names = payload.reference_image_names or []
            for idx, data_url in enumerate(payload.reference_images):
                content_type, image_data = self.decode_image_data_url(data_url)
                name = names[idx] if idx < len(names) else f"Reference image {idx + 1}"
                img_record = FeasibilityReferenceImage(
                    feasibility_request_id=req.id,
                    original_name=name,
                    content_type=content_type,
                    image_data=image_data,
                    sort_order=idx,
                )
                self.db.add(img_record)

        # Log creation activity
        self.repo.add_activity_log(
            feasibility_request_id=req.id,
            actor_id=creator_user_id,
            actor_name=creator_name,
            actor_department="Marketing",
            action="CREATED",
            payload={"type": payload.feasibility_type, "customer": customer.name},
        )

        self.db.commit()
        return self.serialize_request(self.repo.get_with_details(req.id))

    def record_samp_verdict(
        self,
        request_id: int,
        payload: FeasibilitySampVerdictPayload,
        current_user=None,
    ) -> Dict[str, Any]:
        """Record technical verdict from SAMP team."""
        req = self.repo.get_with_details(request_id)
        if not req:
            raise HTTPException(status_code=404, detail="Feasibility request was not found")

        if not req.taken_by_samp:
            raise HTTPException(
                status_code=400,
                detail="Task must be claimed by a sampling team member before submitting a technical verdict.",
            )

        if req.marketing_decision or req.converted_sample_request_id:
            raise HTTPException(
                status_code=400,
                detail="Cannot modify technical verdict after a marketing decision has been rendered or request converted.",
            )

        if payload.response in ("No", "Maybe") and not (payload.remark or "").strip():
            raise HTTPException(
                status_code=400,
                detail=f"Technical evaluation remarks are compulsory when selecting '{payload.response}'.",
            )

        actor_name = current_user.name if current_user else (req.taken_by_samp or "Sampling Lead")
        actor_id = current_user.id if current_user else None

        req.sampling_feasibility_response = payload.response
        req.sampling_feasibility_remark = payload.remark.strip() if payload.remark else None
        req.sampling_feasibility_approved_by = actor_name
        req.feasibility_closed_at = datetime.now(timezone.utc)
        req.feasibility_closed_by = "sampling"
        req.status = f"Feasibility {payload.response}"
        req.is_responded_on_time = req.feasibility_closed_at.date() <= req.required_date

        self.repo.add_activity_log(
            feasibility_request_id=req.id,
            actor_id=actor_id,
            actor_name=actor_name,
            actor_department="SAMP",
            action="SAMP_EVALUATED",
            payload={"verdict": payload.response, "remark": payload.remark},
        )

        self.db.commit()
        return self.serialize_request(self.repo.get_with_details(req.id))

    def record_marketing_decision(
        self,
        request_id: int,
        payload: FeasibilityMarketingDecisionPayload,
        current_user=None,
    ) -> Dict[str, Any]:
        """Record Marketing acceptance or rejection."""
        req = self.repo.get_with_details(request_id)
        if not req:
            raise HTTPException(status_code=404, detail="Feasibility request was not found")

        if not req.sampling_feasibility_response:
            raise HTTPException(
                status_code=400,
                detail="Technical evaluation by SAMP team must be completed before recording marketing decision.",
            )

        if req.converted_sample_request_id:
            raise HTTPException(
                status_code=400,
                detail="Request has already been converted to commercial sampling.",
            )

        actor_name = current_user.name if current_user else "Marketing Specialist"
        actor_id = current_user.id if current_user else None

        req.marketing_decision = payload.decision
        req.marketing_decision_remark = payload.decision_remark.strip() if payload.decision_remark else None
        req.marketing_decision_by = actor_name
        req.marketing_decision_at = datetime.now(timezone.utc)
        req.status = f"Marketing {payload.decision}"

        self.repo.add_activity_log(
            feasibility_request_id=req.id,
            actor_id=actor_id,
            actor_name=actor_name,
            actor_department="Marketing",
            action="MARKETING_DECIDED",
            payload={"decision": payload.decision, "remark": payload.decision_remark},
        )

        self.db.commit()
        return self.serialize_request(self.repo.get_with_details(req.id))

    def claim_task(self, request_id: int, current_user=None) -> Dict[str, Any]:
        """Claim a feasibility review task by a SAMP team engineer."""
        req = self.repo.get_with_details(request_id)
        if not req:
            raise HTTPException(status_code=404, detail="Feasibility request was not found")

        if req.sampling_feasibility_response:
            raise HTTPException(
                status_code=400,
                detail="Cannot claim an already evaluated feasibility task.",
            )

        actor_name = current_user.name if current_user else "Sampling Engineer"
        actor_id = current_user.id if current_user else None

        req.taken_by_samp = actor_name
        req.taken_at_samp = datetime.now(timezone.utc)
        if req.status == "Pending Feasibility":
            req.status = "Under SAMP Review"

        self.repo.add_activity_log(
            feasibility_request_id=req.id,
            actor_id=actor_id,
            actor_name=actor_name,
            actor_department="SAMP",
            action="TASK_CLAIMED",
            payload={"claimed_by": actor_name},
        )

        self.db.commit()
        return self.serialize_request(self.repo.get_with_details(req.id))

    def convert_to_sampling(self, request_id: int, current_user=None) -> Dict[str, Any]:
        """Convert approved feasibility check to a full sampling request."""
        req = self.repo.get_with_details(request_id)
        if not req:
            raise HTTPException(status_code=404, detail="Feasibility request was not found")

        if req.marketing_decision != "Accepted":
            raise HTTPException(
                status_code=400,
                detail="Only accepted feasibility requests can be converted to commercial sampling.",
            )

        if req.converted_sample_request_id:
            raise HTTPException(
                status_code=400,
                detail="Request has already been converted to a commercial sample request.",
            )

        actor_name = current_user.name if current_user else "Marketing Lead"
        actor_id = current_user.id if current_user else None

        # Build new CreateSampleRequest
        total_sample_reqs = self.db.query(CreateSampleRequest).count()
        yr_suffix = datetime.now(timezone.utc).year % 100
        sample_sr_num = f"SR-{yr_suffix:02d}-{total_sample_reqs + 1:04d}"

        customer_name = req.customer.name if req.customer else "Unknown Customer"
        now_date_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")

        target_plant = "Plant 1"
        try:
            p = self.db.query(Plant).filter(Plant.is_active == True).order_by(Plant.id.asc()).first()
            if p and p.name:
                target_plant = p.name
        except Exception:
            pass

        sample_req = CreateSampleRequest(
            sr_number=sample_sr_num,
            year=f"20{yr_suffix}-20{yr_suffix + 1}",
            customer=customer_name,
            target_plant=target_plant,
            product_description=f"[Converted from {req.request_code}] {req.description_notes}",
            material_code=req.request_code,
            date_request_created=now_date_str,
            sample_required_date=req.required_date,
            status="Sampling Review (PMT)",
            creation_mode="feasibility_conversion",
            request_types=["sample"],
            created_by=actor_name,
            program_year=f"20{yr_suffix}-20{yr_suffix + 1}",
            program_name=f"{customer_name} · {req.custom_feasibility_type or req.feasibility_type}",
        )
        self.db.add(sample_req)
        self.db.flush()

        req.converted_sample_request_id = sample_req.id
        req.converted_sr_number = sample_sr_num
        req.converted_at = datetime.now(timezone.utc)
        req.converted_by = actor_name
        req.status = "Converted to Sampling"

        self.repo.add_activity_log(
            feasibility_request_id=req.id,
            actor_id=actor_id,
            actor_name=actor_name,
            actor_department="Marketing",
            action="CONVERTED_TO_SAMPLING",
            payload={"sample_request_id": sample_req.id, "sample_sr_number": sample_sr_num},
        )

        self.db.commit()
        return {
            "feasibility": self.serialize_request(self.repo.get_with_details(req.id)),
            "sample_request_id": sample_req.id,
            "sample_sr_number": sample_sr_num,
        }

    def add_note(self, request_id: int, note: str, current_user=None) -> Dict[str, Any]:
        """Add a manual communication note/comment to the feasibility audit chatter."""
        req = self.repo.get_with_details(request_id)
        if not req:
            raise HTTPException(status_code=404, detail="Feasibility request was not found")

        clean_note = note.strip()
        if not clean_note:
            raise HTTPException(status_code=400, detail="Note content cannot be empty.")

        actor_name = current_user.name if current_user else "Team Member"
        actor_id = current_user.id if current_user else None
        roles = f"{getattr(current_user, 'role', '') or ''} {getattr(current_user, 'sub_role', '') or ''}".lower() if current_user else ""
        actor_department = (
            "SAMP Team" if "samp" in roles or "sampling" in roles
            else "Marketing" if "marketing" in roles
            else (getattr(current_user, "sub_role", None) or getattr(current_user, "role", None) or "Operations") if current_user else "Operations"
        )

        self.repo.add_activity_log(
            feasibility_request_id=req.id,
            actor_id=actor_id,
            actor_name=actor_name,
            actor_department=actor_department,
            action="NOTE_ADDED",
            payload={"note": clean_note},
        )
        return self.serialize_request(self.repo.get_with_details(req.id))

    def record_viewed(self, request_id: int, current_user=None) -> bool:
        """Record view event with deduplication so audit logs remain clean and unpolluted."""
        req = self.repo.get_with_details(request_id)
        if not req:
            return False

        actor_name = current_user.name if current_user else "Operator"
        actor_id = current_user.id if current_user else None
        roles = f"{getattr(current_user, 'role', '') or ''} {getattr(current_user, 'sub_role', '') or ''}".lower() if current_user else ""
        actor_department = (
            "SAMP Team" if "samp" in roles or "sampling" in roles
            else "Marketing" if "marketing" in roles
            else "Operations"
        )

        # Smart deduplication: check if the latest activity was already a VIEWED event by this user
        last_log = (req.activities or [])[-1] if req.activities else None
        if last_log and last_log.action == "VIEWED" and last_log.actor_name == actor_name:
            return False

        self.repo.add_activity_log(
            feasibility_request_id=req.id,
            actor_id=actor_id,
            actor_name=actor_name,
            actor_department=actor_department,
            action="VIEWED",
            payload={"viewed_at": datetime.now(timezone.utc).isoformat()},
        )
        return True

    def delete(self, request_id: int) -> bool:
        """Delete feasibility request."""
        return self.repo.delete(request_id)
