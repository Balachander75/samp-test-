"""
Sample Request Service.
Encapsulates business operations for Sample Requests lifecycle, business year calculations,
batch creation, and material searches.
"""
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone, date
from uuid import uuid4
from sqlalchemy.orm import Session
from app.repositories.sample_request_repo import SampleRequestRepository
from app.models.sample_request import (
    CreateSampleRequest,
    ProductCharacteristic,
    ProductDetail,
    SampleRequestType,
)
from app.models.master import Plant
from app.utils.business_year import (
    get_business_year_for_date_str,
    get_business_year_start,
    get_current_business_year,
)


class SampleRequestService:
    """Application service for Sample Requests."""

    def __init__(self, db: Session):
        self.db = db
        self.repo = SampleRequestRepository(db)

    def get_default_plant(self) -> str:
        """Lookup active default manufacturing plant."""
        try:
            p = self.db.query(Plant).filter(Plant.is_active == True).order_by(Plant.id.asc()).first()
            return p.name if p else ""
        except Exception:
            return ""

    def serialize(self, r: CreateSampleRequest) -> Dict[str, Any]:
        """Serialize a sample request database record."""
        created_date = r.date_request_created or (r.created_at.strftime("%Y-%m-%d") if r.created_at else "")
        by_val = get_business_year_for_date_str(created_date) if created_date else (r.year or get_current_business_year())
        py_val = r.program_year or (by_val.split("-")[0] if by_val and "-" in by_val else str(get_business_year_start()))
        binding_values = self._get_binding_values(r)

        audit_data = None
        if getattr(r, "request_type_audit", None):
            audit = r.request_type_audit
            audit_data = {
                "design": audit.design,
                "mockup": audit.mockup,
                "sample": audit.sample,
                "costing": audit.costing,
                "design_selected_at": audit.design_selected_at.isoformat() if audit.design_selected_at else None,
                "mockup_selected_at": audit.mockup_selected_at.isoformat() if audit.mockup_selected_at else None,
                "sample_selected_at": audit.sample_selected_at.isoformat() if audit.sample_selected_at else None,
                "costing_selected_at": audit.costing_selected_at.isoformat() if audit.costing_selected_at else None,
            }

        return {
            "id": r.id,
            "sr_number": r.sr_number,
            "year": by_val,
            "program_year": py_val,
            "program_name": r.program_name or "",
            "product_description": r.product_description or "",
            "customer": r.customer or "",
            "target_plant": r.target_plant or "",
            "date_request_created": created_date,
            "created_by": r.created_by or "Marketing",
            "material_code": r.material_code or "",
            "barcode": r.barcode or "",
            "customer_product_code": r.customer_product_code or "",
            "source_sample_code": r.source_sample_code or "",
            "binding_type_1": binding_values[0],
            "binding_type_2": binding_values[1],
            "sample_required_date": r.sample_required_date.isoformat() if r.sample_required_date else None,
            "product_type": r.product_type,
            "product_type_navneet": r.product_type_navneet,
            "product_type_new_customer": r.product_type_new_customer,
            "brand_name": r.brand_name,
            "unit_pc_pack": r.unit_pc_pack,
            "qty_for_sampling": r.qty_for_sampling,
            "qty_design_costing": r.qty_design_costing,
            "mockup_required": r.mockup_required,
            "designs_customer_creative": r.designs_customer_creative,
            "product_artwork_nos": r.product_artwork_nos,
            "product_image_path": r.product_image_path,
            "target_artwork_date_creative": r.target_artwork_date_creative,
            "target_artwork_date_studio": r.target_artwork_date_studio,
            "status": r.status or "Draft (Pre-SMT)",
            "creation_mode": r.creation_mode or "material_code",
            "request_types": r.request_types if isinstance(r.request_types, list) else [],
            "request_type_audit": audit_data,
            "created_at": r.created_at.isoformat() if r.created_at else None,
            "updated_at": r.updated_at.isoformat() if r.updated_at else None,
        }

    @staticmethod
    def _normalize_characteristic_name(name: Any) -> str:
        return "".join(character for character in str(name or "").upper() if character.isalnum())

    def _apply_product_details(self, request: CreateSampleRequest, payload: Dict[str, Any]) -> None:
        details = payload.get("custom_details") or payload.get("customDetails") or []
        if isinstance(details, list):
            for detail in details:
                if not isinstance(detail, dict):
                    continue
                characteristic = detail.get("characteristic_name") or detail.get("characteristicName")
                value = detail.get("value")
                if not characteristic or value is None or not str(value).strip():
                    continue
                normalized_name = self._normalize_characteristic_name(characteristic)
                existing = next(
                    (item for item in request.product_details
                     if self._normalize_characteristic_name(item.characteristic_name) == normalized_name),
                    None,
                )
                if existing:
                    existing.value = str(value).strip()
                    existing.uom = detail.get("uom") or existing.uom
                else:
                    request.product_details.append(
                        ProductDetail(
                            class_name=detail.get("class_name") or detail.get("className") or "Product",
                            characteristic_name=str(characteristic),
                            value=str(value).strip(),
                            uom=detail.get("uom"),
                        )
                    )

        for snake_key, camel_key, characteristic in (
            ("custom_binding_1", "customBinding1", "BINDINGTYPE1"),
            ("custom_binding_2", "customBinding2", "BINDINGTYPE2"),
        ):
            value = payload.get(snake_key) or payload.get(camel_key)
            if not value:
                continue
            normalized_name = self._normalize_characteristic_name(characteristic)
            existing = next(
                (item for item in request.product_details
                 if self._normalize_characteristic_name(item.characteristic_name) in {
                     normalized_name,
                     "BINDING1" if characteristic.endswith("1") else "BINDING2",
                 }),
                None,
            )
            if existing:
                existing.value = str(value).strip()
            else:
                request.product_details.append(
                    ProductDetail(
                        class_name="NB_BINDING",
                        characteristic_name=characteristic,
                        value=str(value).strip(),
                    )
                )

    def _clone_source_product_details(self, request: CreateSampleRequest, source_id: int) -> None:
        """Clone all product_details rows from source request to the new request."""
        source_details = (
            self.db.query(ProductDetail)
            .filter(ProductDetail.sample_request_id == source_id)
            .all()
        )
        for detail in source_details:
            request.product_details.append(
                ProductDetail(
                    class_name=detail.class_name,
                    characteristic_name=detail.characteristic_name,
                    value=detail.value,
                    uom=detail.uom,
                )
            )

    def _apply_request_type_audit(self, request: CreateSampleRequest, payload: Dict[str, Any]) -> None:
        """Assign normalized audit flags and selection timestamps."""
        req_types = payload.get("request_types") or payload.get("requestTypes") or []
        if isinstance(req_types, str):
            req_types = [t.strip().lower() for t in req_types.split(",")]
        else:
            req_types = [str(t).strip().lower() for t in req_types]

        timestamps = payload.get("request_type_timestamps") or payload.get("requestTypeTimestamps") or {}
        if not isinstance(timestamps, dict):
            timestamps = {}

        def parse_dt(val: Any) -> Optional[datetime]:
            if not val:
                return None
            if isinstance(val, datetime):
                return val
            try:
                clean = str(val).replace("Z", "+00:00")
                return datetime.fromisoformat(clean)
            except Exception:
                return None

        request.request_type_audit = SampleRequestType(
            design="design" in req_types,
            mockup="mockup" in req_types,
            sample="sample" in req_types,
            costing="costing" in req_types,
            design_selected_at=parse_dt(timestamps.get("design")),
            mockup_selected_at=parse_dt(timestamps.get("mockup")),
            sample_selected_at=parse_dt(timestamps.get("sample")),
            costing_selected_at=parse_dt(timestamps.get("costing")),
        )

    @classmethod
    def _get_binding_values(cls, request: CreateSampleRequest) -> tuple[Optional[str], Optional[str]]:
        if not request.product_details:
            return None, None
        binding1 = None
        binding2 = None
        for detail in request.product_details:
            name = cls._normalize_characteristic_name(detail.characteristic_name)
            if name in {"BINDINGTYPE1", "BINDING1"} and detail.value:
                binding1 = binding1 or detail.value
            elif name in {"BINDINGTYPE2", "BINDING2"} and detail.value:
                binding2 = binding2 or detail.value
        return binding1, binding2

    def get_business_years_summary(self) -> Dict[str, Any]:
        """Aggregate business years and counts."""
        current_by = get_current_business_year()
        rows = self.repo.get_business_year_counts()
        year_counts: Dict[str, int] = {}
        for raw_yr, count in rows:
            if not raw_yr:
                continue
            clean_yr = str(raw_yr).strip()
            if "-" not in clean_yr and clean_yr.isdigit() and len(clean_yr) == 4:
                y_int = int(clean_yr)
                clean_yr = f"{y_int - 1}-{y_int}"
            year_counts[clean_yr] = year_counts.get(clean_yr, 0) + count

        if current_by not in year_counts:
            year_counts[current_by] = 0

        sorted_years = sorted(year_counts.keys(), reverse=True)
        total_records = sum(year_counts.values())

        return {
            "current_business_year": current_by,
            "total_records": total_records,
            "years": [
                {
                    "year": y,
                    "label": f"BY {y}",
                    "is_current": y == current_by,
                    "count": year_counts[y],
                }
                for y in sorted_years
            ],
        }

    def list_requests(
        self,
        year: Optional[str] = None,
        customer: Optional[str] = None,
        status: Optional[str] = None,
        skip: int = 0,
        limit: Optional[int] = None,
    ) -> List[Dict[str, Any]]:
        """List requests optionally filtered by business year, customer, and status."""
        records = self.repo.list_by_filters(year=year, customer=customer, status=status, skip=skip, limit=limit)
        return [self.serialize(r) for r in records]

    def get_by_id(self, id: int) -> Optional[Dict[str, Any]]:
        """Fetch request by primary key."""
        r = self.repo.get_by_id(id)
        if not r:
            return None
        return self.serialize(r)

    def _build_entity(self, payload: Any) -> CreateSampleRequest:
        """Construct CreateSampleRequest instance with cloned and overridden details."""
        if hasattr(payload, "model_dump"):
            payload = payload.model_dump(by_alias=False)
        elif hasattr(payload, "dict"):
            payload = payload.dict()

        created_date_str = payload.get("date_request_created") or datetime.now(timezone.utc).strftime("%Y-%m-%d")
        calc_year = get_business_year_for_date_str(created_date_str)
        item_year = payload.get("year")
        if not item_year or "-" not in str(item_year):
            item_year = calc_year

        prog_year = payload.get("program_year") or str(get_business_year_start())
        if prog_year:
            prog_year = str(prog_year).replace("BTS", "").strip()

        target_plant = payload.get("target_plant")
        if not target_plant or not str(target_plant).strip():
            target_plant = self.get_default_plant()
        else:
            target_plant = str(target_plant).strip()

        sr_num = payload.get("sr_number")

        sample_req_date = None
        s_date_val = payload.get("sample_required_date")
        if s_date_val:
            try:
                sample_req_date = date.fromisoformat(str(s_date_val).split("T")[0])
            except (ValueError, TypeError):
                sample_req_date = None

        req = CreateSampleRequest(
            sr_number=sr_num or "",
            year=item_year,
            program_year=prog_year,
            program_name=payload.get("program_name") or None,
            product_description=payload.get("product_description") or "",
            customer=payload.get("customer") or "",
            target_plant=target_plant,
            date_request_created=created_date_str,
            created_by=payload.get("created_by") or "Marketing",
            material_code=payload.get("material_code") or "",
            barcode=payload.get("barcode") or None,
            customer_product_code=payload.get("customer_product_code") or None,
            source_sample_code=payload.get("source_sample_code") or None,
            sample_required_date=sample_req_date,
            product_type=payload.get("product_type") or None,
            product_type_navneet=payload.get("product_type_navneet") or None,
            product_type_new_customer=payload.get("product_type_new_customer") or None,
            brand_name=payload.get("brand_name") or None,
            unit_pc_pack=str(payload.get("unit_pc_pack")) if payload.get("unit_pc_pack") is not None else None,
            qty_for_sampling=str(payload.get("qty_for_sampling")) if payload.get("qty_for_sampling") is not None else None,
            qty_design_costing=str(payload.get("qty_design_costing")) if payload.get("qty_design_costing") is not None else None,
            mockup_required=payload.get("mockup_required") or None,
            designs_customer_creative=payload.get("designs_customer_creative") or None,
            product_artwork_nos=str(payload.get("product_artwork_nos")) if payload.get("product_artwork_nos") is not None else None,
            product_image_path=payload.get("product_image_path") or None,
            target_artwork_date_creative=payload.get("target_artwork_date_creative") or None,
            target_artwork_date_studio=payload.get("target_artwork_date_studio") or None,
            status=payload.get("status") or "Draft (Pre-SMT)",
            creation_mode=payload.get("creation_mode") or "material_code",
            request_types=payload.get("request_types") or [],
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )

        source_id = payload.get("source_sample_request_id") or payload.get("sourceSampleRequestId")
        if not source_id and payload.get("source_sample_code"):
            src_code = str(payload.get("source_sample_code")).strip()
            src_match = self.repo.get_by_sr_number(src_code)
            if not src_match:
                matches = self.repo.search_materials(src_code, limit=1)
                if matches:
                    src_match = matches[0]
            if src_match:
                source_id = src_match.id

        if source_id:
            try:
                self._clone_source_product_details(req, int(source_id))
            except Exception:
                pass

        self._apply_product_details(req, payload)
        self._apply_request_type_audit(req, payload)
        return req

    def _reserve_sr_number(self, request: CreateSampleRequest) -> None:
        """Assign an SR number from the persisted request ID, avoiding legacy codes."""
        created_date = request.date_request_created or datetime.now(timezone.utc).strftime("%Y-%m-%d")
        try:
            year = date.fromisoformat(str(created_date).split("T")[0]).year
        except (TypeError, ValueError):
            year = datetime.now(timezone.utc).year

        sequence = request.id
        while True:
            candidate = f"SR-{year % 100:02d}-{sequence:06d}"
            if not self.repo.get_by_sr_number(candidate):
                request.sr_number = candidate
                return
            sequence += 1

    def create(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Create single sample request entity."""
        try:
            req = self._build_entity(payload)
            # SR numbers are server-owned. A unique temporary value lets the row
            # flush to obtain its ID without trusting a stale client-side counter.
            req.sr_number = f"TMP-SR-{uuid4().hex}"
            self.db.add(req)
            self.db.flush()

            mat_code = str(req.material_code or "").strip()
            if not mat_code or mat_code.upper() in {"PENDING", "TEMP"}:
                req.material_code = f"A1-{req.id}"

            self._reserve_sr_number(req)

            self.db.commit()
            self.db.refresh(req)
            return self.serialize(req)
        except Exception as e:
            self.db.rollback()
            raise e

    def batch_create(self, items: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Atomically create each staged product payload supplied by the batch endpoint."""
        if not items:
            return []

        created_records = []
        try:
            for item in items:
                req = self._build_entity(item)
                req.sr_number = f"TMP-SR-{uuid4().hex}"
                self.db.add(req)
                self.db.flush()

                mat_code = str(req.material_code or "").strip()
                if not mat_code or mat_code.upper() in {"PENDING", "TEMP"}:
                    req.material_code = f"A1-{req.id}"

                self._reserve_sr_number(req)

                created_records.append(req)

            self.db.commit()
            for rec in created_records:
                self.db.refresh(rec)
            return [self.serialize(r) for r in created_records]
        except Exception as e:
            self.db.rollback()
            raise e

    def update(self, id: int, payload: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Update sample request entity."""
        record = self.repo.get_by_id(id)
        if not record:
            return None

        update_fields: Dict[str, Any] = {}
        for key, val in payload.items():
            if hasattr(record, key) and val is not None:
                if key == "sample_required_date" and val:
                    try:
                        update_fields[key] = date.fromisoformat(str(val).split("T")[0])
                    except (ValueError, TypeError):
                        pass
                else:
                    update_fields[key] = val

        update_fields["updated_at"] = datetime.now(timezone.utc)
        self._apply_product_details(record, payload)
        updated = self.repo.update(record, update_fields)
        return self.serialize(updated)

    def batch_update_status(self, ids: List[int], status: str) -> int:
        """Batch update status on requests."""
        return self.repo.batch_update_status(ids, status)

    def delete(self, id: int) -> bool:
        """Delete request by primary key."""
        return self.repo.delete(id)

    def search_materials(self, code: Optional[str] = None) -> List[Dict[str, Any]]:
        """Search products by material code or description."""
        records = self.repo.search_materials(code=code)
        return [
            {
                "id": r.id,
                "sr_number": r.sr_number,
                "material_code": r.material_code,
                "product_description": r.product_description,
                "customer": r.customer,
                "target_plant": r.target_plant,
                "source_sample_code": r.source_sample_code,
                "binding_type_1": self._get_binding_values(r)[0],
                "binding_type_2": self._get_binding_values(r)[1],
            }
            for r in records
        ]

    def search_products_by_binding(
        self,
        binding1: str,
        binding2: Optional[str] = None,
        limit: Optional[int] = None,
    ) -> List[Dict[str, Any]]:
        records = self.repo.search_by_binding(binding1, binding2, limit)
        return [
            {
                "id": record.id,
                "sr_number": record.sr_number,
                "material_code": record.material_code,
                "product_description": record.product_description,
                "customer": record.customer,
                "target_plant": record.target_plant,
                "source_sample_code": record.source_sample_code,
                "binding_type_1": self._get_binding_values(record)[0] or binding1,
                "binding_type_2": self._get_binding_values(record)[1],
            }
            for record in records
        ]

    def get_all_characteristics(self) -> List[Dict[str, Any]]:
        """Return all active master product characteristics sorted by sequence."""
        rows = (
            self.db.query(ProductCharacteristic)
            .filter(ProductCharacteristic.is_active == True)
            .order_by(ProductCharacteristic.class_name, ProductCharacteristic.sequence)
            .all()
        )
        return [
            {
                "id": c.id,
                "class_name": c.class_name,
                "characteristic_name": c.characteristic_name,
                "sequence": c.sequence,
                "uom": c.uom,
                "options": c.options or [],
                "is_active": c.is_active,
            }
            for c in rows
        ]

    def get_characteristic_classes(self) -> List[Dict[str, Any]]:
        """Return distinct characteristic classes and their characteristics."""
        rows = (
            self.db.query(ProductCharacteristic)
            .filter(ProductCharacteristic.is_active == True)
            .order_by(ProductCharacteristic.class_name, ProductCharacteristic.sequence)
            .all()
        )
        classes_map: Dict[str, List[Dict[str, Any]]] = {}
        for c in rows:
            classes_map.setdefault(c.class_name, []).append({
                "id": c.id,
                "characteristic_name": c.characteristic_name,
                "sequence": c.sequence,
                "uom": c.uom,
                "options": c.options or [],
            })
        return [
            {"class_name": cls_name, "characteristics": chars}
            for cls_name, chars in classes_map.items()
        ]

    def get_product_details(self, sample_request_id: int) -> List[Dict[str, Any]]:
        """Return product details for a given sample request."""
        rows = (
            self.db.query(ProductDetail)
            .filter(ProductDetail.sample_request_id == sample_request_id)
            .order_by(ProductDetail.id)
            .all()
        )
        return [
            {
                "id": d.id,
                "sample_request_id": d.sample_request_id,
                "sampleRequestId": d.sample_request_id,
                "class_name": d.class_name,
                "className": d.class_name,
                "characteristic_name": d.characteristic_name,
                "characteristicName": d.characteristic_name,
                "value": d.value,
                "uom": d.uom,
            }
            for d in rows
        ]

    def save_product_details(self, sample_request_id: int, details: List[Dict[str, Any]]) -> bool:
        """Upsert product details for a sample request."""
        req = self.repo.get_by_id(sample_request_id)
        if not req:
            return False

        existing_details = {
            f"{d.class_name}::{d.characteristic_name}".lower(): d
            for d in req.product_details
        }

        for item in details:
            class_name = item.get("class_name") or item.get("className") or "Product"
            char_name = item.get("characteristic_name") or item.get("characteristicName")
            if not char_name:
                continue
            key = f"{class_name}::{char_name}".lower()
            val = item.get("value")
            val_str = str(val).strip() if val is not None else None
            uom = item.get("uom")

            if key in existing_details:
                existing_details[key].value = val_str
                if uom is not None:
                    existing_details[key].uom = uom
            else:
                new_detail = ProductDetail(
                    sample_request_id=sample_request_id,
                    class_name=class_name,
                    characteristic_name=char_name,
                    value=val_str,
                    uom=uom,
                )
                self.db.add(new_detail)
                req.product_details.append(new_detail)

        req.updated_at = datetime.now(timezone.utc)
        self.db.commit()
        return True
