"""
Sample Request Service.
Encapsulates business operations for Sample Requests lifecycle, business year calculations,
batch creation, and material searches.
"""
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone, date
from sqlalchemy.orm import Session
from app.repositories.sample_request_repo import SampleRequestRepository
from app.models.sample_request import CreateSampleRequest, ProductCharacteristic, ProductDetail
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
            "creation_mode": r.creation_mode or "marketing_request",
            "request_types": r.request_types if isinstance(r.request_types, list) else [],
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
                        class_name="Product",
                        characteristic_name=characteristic,
                        value=str(value).strip(),
                    )
                )

    @classmethod
    def _get_binding_values(cls, request: CreateSampleRequest) -> tuple[Optional[str], Optional[str]]:
        binding1 = None
        binding2 = None
        for detail in request.product_details or []:
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

    def create(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Create new sample request entity."""
        created_date_str = payload.get("date_request_created") or datetime.now(timezone.utc).strftime("%Y-%m-%d")
        calc_year = get_business_year_for_date_str(created_date_str)
        item_year = payload.get("year")
        if not item_year or "-" not in str(item_year):
            item_year = calc_year

        # Generate sequence code if not provided
        sr_num = payload.get("sr_number")
        if not sr_num:
            yr_suffix = datetime.now(timezone.utc).year % 100
            total_count = self.repo.total_count()
            sr_num = f"SR-{yr_suffix:02d}-{total_count + 1:04d}"

        # Parse sample_required_date
        sample_req_date = None
        s_date_val = payload.get("sample_required_date")
        if s_date_val:
            try:
                sample_req_date = date.fromisoformat(str(s_date_val).split("T")[0])
            except (ValueError, TypeError):
                sample_req_date = None

        req = CreateSampleRequest(
            sr_number=sr_num,
            year=item_year,
            program_year=payload.get("program_year") or str(get_business_year_start()),
            program_name=payload.get("program_name") or None,
            product_description=payload.get("product_description") or "",
            customer=payload.get("customer") or "",
            target_plant=payload.get("target_plant") or self.get_default_plant(),
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
            creation_mode=payload.get("creation_mode") or "marketing_request",
            request_types=payload.get("request_types") or [],
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )

        self._apply_product_details(req, payload)

        created = self.repo.create(req)
        return self.serialize(created)

    def batch_create(self, items: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Create each staged product payload supplied by the batch endpoint."""
        if not items:
            return []
        return [self.create(item) for item in items]

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
        limit: int = 50,
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
                "binding_type_1": self._get_binding_values(record)[0],
                "binding_type_2": self._get_binding_values(record)[1],
            }
            for record in records
        ]
