"""
Design Request Repository.
Handles all database operations for the `design_requests` entity with fallback to local JSON cache.
"""
import json
import logging
import os
import threading
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional
from sqlalchemy.orm import Session
from app.repositories.base import BaseRepository
from app.models.sample_request import DesignRequest

logger = logging.getLogger("uvicorn.error")

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
DESIGN_REQUESTS_FILE = DATA_DIR / "design_requests_store.json"
_storage_lock = threading.Lock()


def _ensure_data_files():
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    if not DESIGN_REQUESTS_FILE.exists():
        DESIGN_REQUESTS_FILE.write_text("[]", encoding="utf-8")


def _read_records() -> List[Dict[str, Any]]:
    _ensure_data_files()
    with _storage_lock:
        try:
            with open(DESIGN_REQUESTS_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return []


def _write_records(records: List[Dict[str, Any]]):
    _ensure_data_files()
    tmp_path = DESIGN_REQUESTS_FILE.with_suffix(f".tmp.{os.getpid()}")
    with _storage_lock:
        with open(tmp_path, "w", encoding="utf-8") as f:
            json.dump(records, f, indent=2, ensure_ascii=False)
            f.flush()
            os.fsync(f.fileno())
        os.replace(tmp_path, DESIGN_REQUESTS_FILE)


class DesignRequestRepository(BaseRepository[DesignRequest]):
    """Repository dedicated to Creative Design Requests persistence."""

    def __init__(self, db: Session):
        super().__init__(DesignRequest, db)

    def list_all_records(self) -> List[Dict[str, Any]]:
        """List all design requests, preferring DB with fallback to JSON store."""
        try:
            items = self.db.query(DesignRequest).order_by(DesignRequest.id.desc()).all()
            if items:
                return [self.to_dict(i) for i in items]
        except Exception as e:
            logger.warning(f"DB error querying design_requests table: {e}. Falling back to file store.")
            self.db.rollback()

        records = _read_records()
        return list(reversed(records))

    def get_record_by_id(self, item_id: int) -> Optional[Dict[str, Any]]:
        """Fetch design request by ID."""
        try:
            item = self.db.query(DesignRequest).filter(DesignRequest.id == item_id).first()
            if item:
                return self.to_dict(item)
        except Exception as e:
            logger.warning(f"DB error fetching design_request #{item_id}: {e}")
            self.db.rollback()

        records = _read_records()
        for r in records:
            if r.get("id") == item_id or str(r.get("id")) == str(item_id):
                return r
        return None

    def create_record(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new design request in DB and sync to JSON store."""
        # Sync to file store
        records = _read_records()
        max_id = max([int(r.get("id", 0)) for r in records if str(r.get("id", 0)).isdigit()] or [0])
        next_id = max_id + 1

        now_iso = datetime.now(timezone.utc).isoformat()
        record_dict = {
            "id": next_id,
            "request_code": data.get("request_code") or f"DSG-{next_id:04d}",
            "sr_number": data.get("sr_number") or f"SR-{datetime.now(timezone.utc).year % 100:02d}-DSG-{next_id:03d}",
            "customer_name": data.get("customer_name", ""),
            "program_name": data.get("program_name", ""),
            "program_year": data.get("program_year", "2026"),
            "status": data.get("status") or "Draft (Pre-SMT)",
            "number_of_designs": data.get("number_of_designs", 1),
            "trend": data.get("trend"),
            "target_audience": data.get("target_audience"),
            "reference_image": data.get("reference_image"),
            "product_description": data.get("product_description", "Creative Design Brief"),
            "design_required_date": data.get("design_required_date"),
            "created_by": data.get("created_by") or "Marketing Specialist",
            "design_remarks": data.get("design_remarks"),
            "reference_images": data.get("reference_images") or [],
            "reference_links": data.get("reference_links") or [],
            "creative_submissions": data.get("creative_submissions") or [],
            "marketing_decision": data.get("marketing_decision"),
            "remaining_design_count": data.get("remaining_design_count") or 0,
            "created_at": now_iso,
            "updated_at": now_iso,
        }
        records.append(record_dict)
        _write_records(records)

        # Attempt to insert into database
        try:
            db_item = DesignRequest(
                id=record_dict["id"],
                request_code=record_dict["request_code"],
                sr_number=record_dict["sr_number"],
                customer_name=record_dict["customer_name"],
                program_name=record_dict["program_name"],
                program_year=record_dict["program_year"],
                status=record_dict["status"],
                number_of_designs=record_dict["number_of_designs"],
                trend=record_dict["trend"],
                target_audience=record_dict["target_audience"],
                reference_image=record_dict["reference_image"],
                product_description=record_dict["product_description"],
                design_required_date=record_dict["design_required_date"],
                created_by=record_dict["created_by"],
                design_remarks=record_dict["design_remarks"],
                reference_images=record_dict["reference_images"],
                reference_links=record_dict["reference_links"],
                creative_submissions=record_dict["creative_submissions"],
                marketing_decision=record_dict["marketing_decision"],
                remaining_design_count=record_dict["remaining_design_count"],
            )
            self.db.add(db_item)
            self.db.commit()
            self.db.refresh(db_item)
            return self.to_dict(db_item)
        except Exception as e:
            logger.warning(f"Could not persist design request to DB: {e}. Stored in JSON backup.")
            self.db.rollback()

        return record_dict

    def update_record(self, item_id: int, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Update a design request."""
        # Update in JSON store
        records = _read_records()
        target = None
        for r in records:
            if r.get("id") == item_id or str(r.get("id")) == str(item_id):
                target = r
                break

        if target:
            target.update(updates)
            target["updated_at"] = datetime.now(timezone.utc).isoformat()
            _write_records(records)

        # Update in DB
        try:
            db_item = self.db.query(DesignRequest).filter(DesignRequest.id == item_id).first()
            if db_item:
                for k, v in updates.items():
                    if hasattr(db_item, k):
                        setattr(db_item, k, v)
                db_item.updated_at = datetime.now(timezone.utc)
                self.db.commit()
                self.db.refresh(db_item)
                return self.to_dict(db_item)
        except Exception as e:
            logger.warning(f"Could not update design request #{item_id} in DB: {e}")
            self.db.rollback()

        return target

    def delete_record(self, item_id: int) -> bool:
        """Delete a design request."""
        # Remove from JSON store
        records = _read_records()
        before_len = len(records)
        records = [r for r in records if r.get("id") != item_id and str(r.get("id")) != str(item_id)]
        _write_records(records)

        # Remove from DB
        try:
            db_item = self.db.query(DesignRequest).filter(DesignRequest.id == item_id).first()
            if db_item:
                self.db.delete(db_item)
                self.db.commit()
                return True
        except Exception as e:
            logger.warning(f"Could not delete design request #{item_id} from DB: {e}")
            self.db.rollback()

        return len(records) < before_len

    def sync_sample_request_design(self, sample_req: Dict[str, Any], is_delete: bool = False):
        """Sync design requests whenever a sample request with 'design' scope is created, updated, or deleted."""
        sr_number = sample_req.get("sr_number")
        if not sr_number:
            return

        records = _read_records()
        if is_delete:
            filtered = [r for r in records if r.get("sr_number") != sr_number]
            if len(filtered) != len(records):
                _write_records(filtered)
            try:
                self.db.query(DesignRequest).filter(DesignRequest.sr_number == sr_number).delete()
                self.db.commit()
            except Exception:
                self.db.rollback()
            return

        # Check if already present
        exists = any(r.get("sr_number") == sr_number for r in records)
        if not exists:
            self.create_record({
                "sr_number": sr_number,
                "customer_name": sample_req.get("customer", ""),
                "program_name": sample_req.get("program_name", ""),
                "program_year": sample_req.get("program_year", "2026"),
                "status": sample_req.get("status") or "Draft (Pre-SMT)",
                "number_of_designs": int(sample_req.get("product_artwork_nos") or 1),
                "product_description": sample_req.get("product_description", "Creative Design Brief"),
                "design_required_date": sample_req.get("target_artwork_date_creative"),
                "created_by": sample_req.get("created_by") or "Marketing Specialist",
            })
        else:
            # Update status
            for r in records:
                if r.get("sr_number") == sr_number:
                    r["status"] = sample_req.get("status", r["status"])
                    r["updated_at"] = datetime.now(timezone.utc).isoformat()
            _write_records(records)
            try:
                self.db.query(DesignRequest).filter(DesignRequest.sr_number == sr_number).update(
                    {"status": sample_req.get("status")}, synchronize_session=False
                )
                self.db.commit()
            except Exception:
                self.db.rollback()

    @staticmethod
    def to_dict(item: DesignRequest) -> Dict[str, Any]:
        """Convert a DesignRequest model instance into a dictionary."""
        return {
            "id": item.id,
            "request_code": item.request_code,
            "sr_number": item.sr_number,
            "customer_name": item.customer_name,
            "program_name": item.program_name,
            "program_year": item.program_year,
            "status": item.status,
            "number_of_designs": item.number_of_designs,
            "trend": item.trend,
            "target_audience": item.target_audience,
            "reference_image": item.reference_image,
            "product_description": item.product_description,
            "design_required_date": item.design_required_date,
            "created_by": item.created_by,
            "design_remarks": item.design_remarks,
            "reference_images": item.reference_images or [],
            "reference_links": item.reference_links or [],
            "creative_submissions": item.creative_submissions or [],
            "marketing_decision": item.marketing_decision,
            "remaining_design_count": item.remaining_design_count or 0,
            "created_at": item.created_at.isoformat() if item.created_at else None,
            "updated_at": item.updated_at.isoformat() if item.updated_at else None,
        }
