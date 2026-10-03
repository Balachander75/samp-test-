"""
Sample requests and operational flow routers.
Provides endpoints for sample requests, design requests, and cross-desk downstream tasks
(studio dielines, creative briefs, costing estimations, product characteristics).
Directly queries and persists to the PostgreSQL database table 'create_sample_requests'.
"""
import json
import os
import threading
from datetime import date, datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy import func, or_, and_
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.sample_request import CreateSampleRequest, ProductCharacteristic
from app.utils.business_year import (
    get_business_year_for_date_str,
    get_business_year_start,
    get_current_business_year,
)

router = APIRouter(tags=["Sample Requests & Operations"])

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
DESIGN_REQUESTS_FILE = DATA_DIR / "design_requests_store.json"
_storage_lock = threading.Lock()


def _ensure_data_files():
    """Ensure data directory and JSON files exist."""
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    if not DESIGN_REQUESTS_FILE.exists():
        DESIGN_REQUESTS_FILE.write_text("[]", encoding="utf-8")


def _read_records(file_path: Path) -> List[Dict[str, Any]]:
    """Safely read records from a JSON file."""
    _ensure_data_files()
    with _storage_lock:
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return []


def _write_records(file_path: Path, records: List[Dict[str, Any]]):
    """Safely and atomically write records to a JSON file to prevent corruption."""
    _ensure_data_files()
    tmp_path = file_path.with_suffix(f".tmp.{os.getpid()}")
    with _storage_lock:
        with open(tmp_path, "w", encoding="utf-8") as f:
            json.dump(records, f, indent=2, ensure_ascii=False)
            f.flush()
            os.fsync(f.fileno())
        os.replace(tmp_path, file_path)


def _parse_date(val: Any) -> Optional[date]:
    if not val:
        return None
    if isinstance(val, date):
        return val
    if isinstance(val, datetime):
        return val.date()
    try:
        clean = str(val).strip().split("T")[0]
        return datetime.strptime(clean, "%Y-%m-%d").date()
    except Exception:
        return None


def _serialize_sample_request(r: CreateSampleRequest) -> Dict[str, Any]:
    created_date = r.date_request_created or (r.created_at.strftime("%Y-%m-%d") if r.created_at else "")
    by_val = get_business_year_for_date_str(created_date) if created_date else (r.year or get_current_business_year())
    py_val = r.program_year or (by_val.split("-")[0] if by_val and "-" in by_val else str(get_business_year_start()))
    return {
        "id": r.id,
        "sr_number": r.sr_number,
        "year": by_val,
        "program_year": py_val,
        "program_name": r.program_name or "",
        "product_description": r.product_description or "",
        "customer": r.customer or "",
        "target_plant": r.target_plant or "1505- Khaniwade",
        "date_request_created": created_date,
        "created_by": r.created_by or "Marketing",
        "material_code": r.material_code or "",
        "barcode": r.barcode or "",
        "customer_product_code": r.customer_product_code or "",
        "source_sample_code": r.source_sample_code or "",
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


# ---------------------------------------------------------------------------
# Health Check
# ---------------------------------------------------------------------------

@router.get("/api/sample-requests/health", summary="Sample requests router health check")
@router.get("/api/v1/sample-requests/health", summary="Sample requests router health check v1")
def sample_requests_health(db: Session = Depends(get_db)):
    total = db.query(CreateSampleRequest).count()
    return {"status": "ok", "total_sample_requests": total, "database": "PostgreSQL (navneet_samp)"}


# ---------------------------------------------------------------------------
# Sample Requests (/api/v1/sample-requests & /api/sample-requests)
# ---------------------------------------------------------------------------

@router.get("/api/v1/sample-requests/business-years", summary="Get distinct business years and counts")
def get_sample_request_business_years(db: Session = Depends(get_db)):
    """Return distinct business years present in sample requests, with record counts and active indicator."""
    current_by = get_current_business_year()
    rows = db.query(CreateSampleRequest.year, func.count(CreateSampleRequest.id)).group_by(CreateSampleRequest.year).all()
    year_counts = {r[0]: r[1] for r in rows if r[0]}

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


@router.get("/api/v1/sample-requests", response_model=List[Dict[str, Any]], summary="List sample requests")
@router.get("/api/sample-requests", response_model=List[Dict[str, Any]], summary="List sample requests (legacy alias)")
def list_sample_requests(year: Optional[str] = None, db: Session = Depends(get_db)):
    """Return sample requests from PostgreSQL database, optionally filtered by business year."""
    query = db.query(CreateSampleRequest)
    if year and year.strip().upper() != "ALL":
        clean_year = year.strip()
        query = query.filter(CreateSampleRequest.year == clean_year)
    records = query.order_by(CreateSampleRequest.id.desc()).all()
    return [_serialize_sample_request(r) for r in records]


@router.post("/api/v1/sample-requests", status_code=status.HTTP_201_CREATED, summary="Create sample request")
@router.post("/api/sample-requests", status_code=status.HTTP_201_CREATED, summary="Create sample request (legacy alias)")
async def create_sample_request(request: Request, db: Session = Depends(get_db)):
    try:
        payload = await request.json()
    except Exception:
        payload = {}

    max_id = db.query(func.max(CreateSampleRequest.id)).scalar() or 0
    next_id = max_id + 1

    current_year_suffix = datetime.now(timezone.utc).year % 100
    is_design = "design" in (payload.get("request_types") or [])

    default_sr = (
        f"SR-{current_year_suffix:02d}-DSG-{next_id:03d}"
        if is_design
        else f"SR-{current_year_suffix:02d}-{next_id:04d}"
    )

    req_date = payload.get("date_request_created") or datetime.now().strftime("%Y-%m-%d")
    default_year = get_business_year_for_date_str(req_date)
    default_program_year = default_year.split("-")[0] if "-" in default_year else str(get_business_year_start())

    created_record = CreateSampleRequest(
        sr_number=payload.get("sr_number") or default_sr,
        year=payload.get("year") or default_year,
        program_year=payload.get("program_year") or default_program_year,
        program_name=payload.get("program_name") or "",
        product_description=payload.get("product_description") or "Standard Product Specification",
        customer=payload.get("customer") or "",
        target_plant=payload.get("target_plant") or "1505- Khaniwade",
        date_request_created=req_date,
        created_by=payload.get("created_by") or "Marketing Specialist",
        material_code=payload.get("material_code") or (f"DSG-1505-{next_id:04d}" if is_design else f"NB-1505-{next_id:04d}"),
        barcode=payload.get("barcode") or "",
        customer_product_code=payload.get("customer_product_code") or "",
        source_sample_code=payload.get("source_sample_code") or None,
        sample_required_date=_parse_date(payload.get("sample_required_date") or payload.get("target_artwork_date_creative")),
        product_type=payload.get("product_type") or None,
        product_type_navneet=payload.get("product_type_navneet") or None,
        product_type_new_customer=payload.get("product_type_new_customer") or None,
        brand_name=payload.get("brand_name") or None,
        unit_pc_pack=str(payload.get("unit_pc_pack")) if payload.get("unit_pc_pack") is not None else None,
        qty_for_sampling=str(payload.get("qty_for_sampling")) if payload.get("qty_for_sampling") is not None else None,
        qty_design_costing=str(payload.get("qty_design_costing")) if payload.get("qty_design_costing") is not None else None,
        mockup_required=payload.get("mockup_required") or "No",
        status=payload.get("status") or "Draft (Pre-SMT)",
        creation_mode=payload.get("creation_mode") or "marketing_request",
        request_types=payload.get("request_types") or (["design"] if is_design else ["sample"]),
        product_artwork_nos=str(payload.get("product_artwork_nos") or payload.get("number_of_designs") or "") or None,
        designs_customer_creative=str(payload.get("designs_customer_creative") or payload.get("number_of_designs") or "") or None,
        target_artwork_date_creative=payload.get("target_artwork_date_creative") or payload.get("sample_required_date") or None,
        target_artwork_date_studio=payload.get("target_artwork_date_studio") or None,
        product_image_path=payload.get("product_image_path") or None,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )

    db.add(created_record)
    db.commit()
    db.refresh(created_record)

    # If this request involves design, also sync to design_requests_store
    if is_design:
        design_records = _read_records(DESIGN_REQUESTS_FILE)
        if not any(d.get("sr_number") == created_record.sr_number for d in design_records):
            design_records.append({
                "id": created_record.id,
                "request_code": f"DSG-{created_record.id:04d}",
                "sr_number": created_record.sr_number,
                "customer_name": created_record.customer,
                "program_name": created_record.program_name,
                "program_year": created_record.program_year,
                "status": created_record.status,
                "number_of_designs": payload.get("number_of_designs") or 1,
                "trend": payload.get("trend"),
                "target_audience": payload.get("target_audience"),
                "reference_image": created_record.product_image_path,
                "product_description": created_record.product_description,
                "design_required_date": created_record.sample_required_date.isoformat() if created_record.sample_required_date else None,
                "created_by": created_record.created_by,
                "created_at": created_record.created_at.isoformat(),
                "updated_at": created_record.updated_at.isoformat(),
            })
            _write_records(DESIGN_REQUESTS_FILE, design_records)

    return _serialize_sample_request(created_record)


@router.post("/api/v1/sample-requests/batch", status_code=status.HTTP_201_CREATED, summary="Batch create sample requests")
async def create_sample_requests_batch(request: Request, db: Session = Depends(get_db)):
    """Create multiple sample requests in a single transaction (from Product Staging)."""
    try:
        payload = await request.json()
    except Exception:
        payload = {}

    customer = payload.get("customer") or ""
    program_name = payload.get("program_name") or ""
    date_request_created = payload.get("date_request_created") or datetime.now().strftime("%Y-%m-%d")
    batch_default_year = payload.get("year") or get_business_year_for_date_str(date_request_created)
    default_py = batch_default_year.split("-")[0] if "-" in batch_default_year else str(get_business_year_start())
    program_year = payload.get("program_year") or default_py
    target_plant = payload.get("target_plant") or "1505- Khaniwade"
    created_by = payload.get("created_by") or "Marketing Specialist"
    items = payload.get("items") or []

    if not items:
        raise HTTPException(status_code=400, detail="Batch request must contain at least one item.")

    max_id = db.query(func.max(CreateSampleRequest.id)).scalar() or 0
    current_year_suffix = datetime.now(timezone.utc).year % 100

    created_objects: List[CreateSampleRequest] = []
    design_entries_to_add: List[Dict[str, Any]] = []

    for idx, it in enumerate(items, start=1):
        next_id = max_id + idx
        scopes = it.get("request_types") or ["sample"]
        is_design = "design" in scopes

        sr_num = it.get("sr_number") or (
            f"SR-{current_year_suffix:02d}-DSG-{next_id:03d}"
            if is_design
            else f"SR-{current_year_suffix:02d}-{next_id:04d}"
        )

        mat_code = it.get("material_code") or (
            f"DSG-1505-{next_id:04d}" if is_design else f"NB-1505-{next_id:04d}"
        )

        item_year = it.get("year") or batch_default_year
        item_prog_year = it.get("program_year") or program_year

        req_obj = CreateSampleRequest(
            sr_number=sr_num,
            year=item_year,
            program_year=item_prog_year,
            program_name=program_name,
            product_description=it.get("product_description") or "Standard Specification",
            customer=customer,
            target_plant=target_plant,
            date_request_created=date_request_created,
            created_by=created_by,
            material_code=mat_code,
            barcode=it.get("barcode") or "",
            customer_product_code=it.get("customer_product_code") or "",
            source_sample_code=it.get("source_sample_code") or None,
            sample_required_date=_parse_date(it.get("sample_required_date") or it.get("target_artwork_date_creative") or payload.get("sample_required_date")),
            product_type=it.get("product_type") or None,
            product_type_navneet=it.get("product_type_navneet") or None,
            product_type_new_customer=it.get("product_type_new_customer") or None,
            brand_name=it.get("brand_name") or None,
            unit_pc_pack=str(it.get("unit_pc_pack")) if it.get("unit_pc_pack") is not None else None,
            qty_for_sampling=str(it.get("qty_for_sampling")) if it.get("qty_for_sampling") is not None else None,
            qty_design_costing=str(it.get("qty_design_costing")) if it.get("qty_design_costing") is not None else None,
            mockup_required=it.get("mockup_required") or "No",
            status=it.get("status") or "Draft (Pre-SMT)",
            creation_mode=it.get("creation_mode") or "marketing_request",
            request_types=scopes,
            product_artwork_nos=str(it.get("product_artwork_nos") or it.get("number_of_designs") or "") or None,
            designs_customer_creative=str(it.get("designs_customer_creative") or it.get("number_of_designs") or "") or None,
            target_artwork_date_creative=it.get("target_artwork_date_creative") or None,
            target_artwork_date_studio=it.get("target_artwork_date_studio") or None,
            product_image_path=it.get("product_image_path") or None,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )

        db.add(req_obj)
        created_objects.append(req_obj)

        if is_design:
            design_entries_to_add.append({
                "id": next_id,
                "request_code": f"DSG-{next_id:04d}",
                "sr_number": sr_num,
                "customer_name": customer,
                "program_name": program_name,
                "program_year": program_year,
                "status": "Draft (Pre-SMT)",
                "number_of_designs": it.get("number_of_designs") or 1,
                "trend": it.get("trend"),
                "target_audience": it.get("target_audience"),
                "reference_image": it.get("product_image_path"),
                "product_description": req_obj.product_description,
                "design_required_date": req_obj.sample_required_date.isoformat() if req_obj.sample_required_date else None,
                "created_by": created_by,
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat(),
            })

    db.commit()
    for o in created_objects:
        db.refresh(o)

    if design_entries_to_add:
        design_records = _read_records(DESIGN_REQUESTS_FILE)
        design_records.extend(design_entries_to_add)
        _write_records(DESIGN_REQUESTS_FILE, design_records)

    return {
        "success": True,
        "message": f"Successfully created {len(created_objects)} sample request(s)",
        "total_created": len(created_objects),
        "requests": [_serialize_sample_request(r) for r in created_objects],
    }


@router.post("/api/v1/sample-requests/batch-status", summary="Batch update sample requests status")
async def batch_update_status(request: Request, db: Session = Depends(get_db)):
    try:
        body = await request.json()
    except Exception:
        body = {}

    ids = body.get("sample_request_ids") or []
    new_status = body.get("status")
    if not ids or not new_status:
        return {"success": False, "updated_count": 0}

    int_ids = [int(i) for i in ids if str(i).isdigit()]
    updated = 0
    if int_ids:
        updated = db.query(CreateSampleRequest).filter(CreateSampleRequest.id.in_(int_ids)).update(
            {"status": new_status, "updated_at": datetime.now(timezone.utc)},
            synchronize_session=False,
        )
        db.commit()

    return {"success": True, "updated_count": updated}


@router.post("/api/v1/sample-requests/batch-delete", summary="Batch delete sample requests")
async def batch_delete_sample_requests(request: Request, db: Session = Depends(get_db)):
    try:
        payload = await request.json()
    except Exception:
        payload = {}

    ids = payload.get("ids") or []
    int_ids = [int(i) for i in ids if str(i).isdigit()]
    str_codes = [str(i) for i in ids if not str(i).isdigit()]

    deleted_count = 0
    if int_ids:
        deleted_count += db.query(CreateSampleRequest).filter(CreateSampleRequest.id.in_(int_ids)).delete(synchronize_session=False)
    if str_codes:
        deleted_count += db.query(CreateSampleRequest).filter(CreateSampleRequest.sr_number.in_(str_codes)).delete(synchronize_session=False)
    db.commit()
    return {"success": True, "deleted_count": deleted_count}


@router.get("/api/v1/sample-requests/search-material", summary="Search materials")
def search_sample_materials(code: Optional[str] = None, db: Session = Depends(get_db)):
    if not code:
        items = db.query(CreateSampleRequest).order_by(CreateSampleRequest.id.desc()).limit(100).all()
    else:
        pattern = f"%{code}%"
        items = db.query(CreateSampleRequest).filter(
            or_(
                CreateSampleRequest.material_code.ilike(pattern),
                CreateSampleRequest.product_description.ilike(pattern),
                CreateSampleRequest.customer.ilike(pattern),
            )
        ).limit(100).all()
    return [_serialize_sample_request(r) for r in items]


@router.get("/api/v1/sample-requests/{id}", summary="Get sample request details")
def get_sample_request(id: str, db: Session = Depends(get_db)):
    item = None
    if id.isdigit():
        item = db.query(CreateSampleRequest).filter(CreateSampleRequest.id == int(id)).first()
    if not item:
        item = db.query(CreateSampleRequest).filter(CreateSampleRequest.sr_number == id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Sample request not found")
    return _serialize_sample_request(item)


@router.put("/api/v1/sample-requests/{id}", summary="Update sample request")
@router.patch("/api/v1/sample-requests/{id}", summary="Patch sample request")
async def update_sample_request(id: str, request: Request, db: Session = Depends(get_db)):
    try:
        body = await request.json()
    except Exception:
        body = {}

    item = None
    if id.isdigit():
        item = db.query(CreateSampleRequest).filter(CreateSampleRequest.id == int(id)).first()
    if not item:
        item = db.query(CreateSampleRequest).filter(CreateSampleRequest.sr_number == id).first()

    if not item:
        raise HTTPException(status_code=404, detail="Sample request not found")

    for k, v in body.items():
        if k == "sample_required_date":
            item.sample_required_date = _parse_date(v)
        elif k in ("id", "created_at", "updated_at"):
            continue
        elif hasattr(item, k):
            setattr(item, k, v)

    item.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(item)

    # Sync status to design_requests_store if present
    if "status" in body:
        design_records = _read_records(DESIGN_REQUESTS_FILE)
        changed_design = False
        for d in design_records:
            if str(d.get("sr_number")) == str(item.sr_number) or str(d.get("id")) == str(item.id):
                d["status"] = body["status"]
                d["updated_at"] = item.updated_at.isoformat()
                changed_design = True
        if changed_design:
            _write_records(DESIGN_REQUESTS_FILE, design_records)

    return _serialize_sample_request(item)


@router.delete("/api/v1/sample-requests/{id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete sample request")
@router.delete("/api/sample-requests/{id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete sample request (legacy alias)")
def delete_sample_request(id: str, db: Session = Depends(get_db)):
    item = None
    if id.isdigit():
        item = db.query(CreateSampleRequest).filter(CreateSampleRequest.id == int(id)).first()
    if not item:
        item = db.query(CreateSampleRequest).filter(CreateSampleRequest.sr_number == id).first()

    if item:
        sr_number = item.sr_number
        db.delete(item)
        db.commit()

        # Cross-clean design requests if matching
        d_records = _read_records(DESIGN_REQUESTS_FILE)
        d_records = [r for r in d_records if str(r.get("id")) != str(id) and str(r.get("sr_number")) != str(sr_number)]
        _write_records(DESIGN_REQUESTS_FILE, d_records)

    return Response(status_code=status.HTTP_204_NO_CONTENT)


# ---------------------------------------------------------------------------
# Design Requests (/api/v1/design-requests)
# ---------------------------------------------------------------------------

@router.get("/api/v1/design-requests", response_model=List[Dict[str, Any]], summary="List design requests")
def list_design_requests():
    records = _read_records(DESIGN_REQUESTS_FILE)
    return list(reversed(records))


@router.post("/api/v1/design-requests", status_code=status.HTTP_201_CREATED, summary="Create design request")
async def create_design_request(request: Request):
    try:
        body = await request.json()
    except Exception:
        body = {}

    records = _read_records(DESIGN_REQUESTS_FILE)
    max_id = 0
    for r in records:
        try:
            val = int(r.get("id", 0))
            if val > max_id:
                max_id = val
        except (ValueError, TypeError):
            pass
    next_id = max_id + 1

    current_year_suffix = datetime.now(timezone.utc).year % 100
    created_design: Dict[str, Any] = {
        "id": next_id,
        "request_code": f"DSG-{next_id:04d}",
        "sr_number": f"SR-{current_year_suffix:02d}-DSG-{next_id:03d}",
        "customer_name": body.get("customer_name", ""),
        "program_name": body.get("program_name", ""),
        "program_year": body.get("program_year") or get_current_business_year(),
        "status": body.get("status") or "Draft (Pre-SMT)",
        "number_of_designs": body.get("number_of_designs", 1),
        "trend": body.get("trend"),
        "target_audience": body.get("target_audience"),
        "reference_image": body.get("reference_image"),
        "product_description": body.get("product_description", "Creative Design Brief"),
        "design_required_date": body.get("design_required_date"),
        "created_by": body.get("created_by") or "Marketing Specialist",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }

    records.append(created_design)
    _write_records(DESIGN_REQUESTS_FILE, records)
    return created_design


@router.get("/api/v1/design-requests/{id}", summary="Get design request details")
def get_design_request(id: int):
    records = _read_records(DESIGN_REQUESTS_FILE)
    for r in records:
        if r.get("id") == id or str(r.get("id")) == str(id):
            return r
    raise HTTPException(status_code=404, detail="Design request not found")


@router.patch("/api/v1/design-requests/{id}", summary="Update design request")
@router.put("/api/v1/design-requests/{id}", summary="Update design request")
async def update_design_request(id: int, request: Request):
    try:
        body = await request.json()
    except Exception:
        body = {}

    records = _read_records(DESIGN_REQUESTS_FILE)
    target = None
    for r in records:
        if r.get("id") == id or str(r.get("id")) == str(id):
            target = r
            break

    if not target:
        raise HTTPException(status_code=404, detail="Design request not found")

    target.update(body)
    target["updated_at"] = datetime.now(timezone.utc).isoformat()
    _write_records(DESIGN_REQUESTS_FILE, records)
    return target


@router.delete("/api/v1/design-requests/{id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete design request")
def delete_design_request(id: int):
    records = _read_records(DESIGN_REQUESTS_FILE)
    deleted_sr_numbers = [str(r.get("sr_number")) for r in records if r.get("id") == id or str(r.get("id")) == str(id)]
    records = [r for r in records if r.get("id") != id and str(r.get("id")) != str(id)]
    _write_records(DESIGN_REQUESTS_FILE, records)

    # Cross-clean sample_requests if matching
    if deleted_sr_numbers:
        s_records = _read_records(SAMPLE_REQUESTS_FILE)
        s_records = [r for r in s_records if str(r.get("id")) != str(id) and str(r.get("sr_number")) not in deleted_sr_numbers]
        _write_records(SAMPLE_REQUESTS_FILE, s_records)

    return Response(status_code=status.HTTP_204_NO_CONTENT)


# ---------------------------------------------------------------------------
# Creative Briefs (/api/v1/creative/briefs)
# ---------------------------------------------------------------------------

@router.get("/api/v1/creative/briefs", response_model=List[Dict[str, Any]], summary="List creative briefs")
def list_creative_briefs():
    return []


@router.patch("/api/v1/creative/briefs/{id}", summary="Update creative brief")
async def update_creative_brief(id: str, request: Request):
    return {"id": id, "success": True}


# ---------------------------------------------------------------------------
# Studio Dielines (/api/v1/studio/dielines)
# ---------------------------------------------------------------------------

@router.get("/api/v1/studio/dielines", response_model=List[Dict[str, Any]], summary="List studio dielines")
def list_studio_dielines():
    return []


@router.patch("/api/v1/studio/dielines/{id}", summary="Update studio dieline")
async def update_studio_dieline(id: str, request: Request):
    return {"id": id, "success": True}


# ---------------------------------------------------------------------------
# Costing Estimations (/api/v1/costing/estimations)
# ---------------------------------------------------------------------------

@router.get("/api/v1/costing/estimations", response_model=List[Dict[str, Any]], summary="List costing estimations")
def list_costing_estimations():
    return []


@router.patch("/api/v1/costing/estimations/{id}", summary="Update costing estimation")
async def update_costing_estimation(id: str, request: Request):
    return {"id": id, "success": True}


# ---------------------------------------------------------------------------
# Product Characteristics (/api/v1/product-characteristics)
# ---------------------------------------------------------------------------

@router.get("/api/v1/product-characteristics/classes", summary="List product characteristic classes")
def list_characteristic_classes():
    return []


@router.get("/api/v1/product-characteristics/binding-hierarchy", summary="Get binding hierarchy")
def get_binding_hierarchy(db: Session = Depends(get_db)):
    b1_char = (
        db.query(ProductCharacteristic)
        .filter(ProductCharacteristic.characteristic_name == "BINDINGTYPE1")
        .first()
    )
    b2_char = (
        db.query(ProductCharacteristic)
        .filter(ProductCharacteristic.characteristic_name == "BINDINGTYPE2")
        .first()
    )
    b1_opts = b1_char.options if b1_char and b1_char.options else []
    b2_opts = b2_char.options if b2_char and b2_char.options else []

    b1_cleaned = [o for o in b1_opts if o and str(o).strip()]
    b2_cleaned = [o for o in b2_opts if o and str(o).strip()]

    hierarchy = {b1: b2_cleaned for b1 in b1_cleaned}
    return {
        "binding1_options": b1_cleaned,
        "binding2_options": b2_cleaned,
        "hierarchy": hierarchy,
    }


def _extract_binding_keywords(val: Optional[str]) -> List[str]:
    if not val or not val.strip() or val.strip().upper() == "NA" or "REFER TO SPECIAL" in val.upper():
        return []
    cleaned = val.strip()
    keywords = [cleaned]
    # Add significant individual tokens (e.g. "Soft", "Case", "Cover", "Spiral", "Wiro", "Sewn")
    tokens = [
        w for w in cleaned.replace("-", " ").replace("&", " ").replace("(", " ").replace(")", " ").split()
        if len(w) >= 4 and w.lower() not in ("style", "with", "from", "layer", "layers", "type", "round", "spine")
    ]
    for t in tokens:
        if t not in keywords:
            keywords.append(t)
    return keywords


@router.get("/api/v1/product-characteristics/filter-by-binding", summary="Filter characteristics by binding")
def filter_by_binding(
    b1: Optional[str] = None,
    b2: Optional[str] = None,
    query: Optional[str] = None,
    db: Session = Depends(get_db),
):
    q = db.query(CreateSampleRequest)
    b1_keys = _extract_binding_keywords(b1)
    b2_keys = _extract_binding_keywords(b2)

    # 1. If both b1 and b2 are specified, find items matching both first (highest relevance)
    both_items: List[CreateSampleRequest] = []
    if b1_keys and b2_keys:
        cond1 = or_(*[CreateSampleRequest.product_description.ilike(f"%{k}%") for k in b1_keys])
        cond2 = or_(*[CreateSampleRequest.product_description.ilike(f"%{k}%") for k in b2_keys])
        both_items = q.filter(and_(cond1, cond2)).limit(40).all()

    # 2. General matching for any keyword or explicit query
    filters = []
    for k in b1_keys:
        filters.append(CreateSampleRequest.product_description.ilike(f"%{k}%"))
    for k in b2_keys:
        filters.append(CreateSampleRequest.product_description.ilike(f"%{k}%"))
    if query and query.strip():
        term = f"%{query.strip()}%"
        filters.append(CreateSampleRequest.material_code.ilike(term))
        filters.append(CreateSampleRequest.product_description.ilike(term))
        filters.append(CreateSampleRequest.customer.ilike(term))

    other_items: List[CreateSampleRequest] = []
    if filters:
        existing_ids = {r.id for r in both_items}
        other_items = q.filter(or_(*filters)).limit(60).all()
        other_items = [r for r in other_items if r.id not in existing_ids]

    # Combine: items matching both bindings come first, followed by single-match items
    combined = both_items + other_items
    if not combined:
        combined = db.query(CreateSampleRequest).order_by(CreateSampleRequest.id.desc()).limit(30).all()

    results = []
    for r in combined[:60]:
        row = _serialize_sample_request(r)
        row["binding_type_1"] = b1 or "Standard"
        row["binding_type_2"] = b2 or "Standard"
        results.append(row)
    return results


@router.get("/api/v1/product-characteristics/details/{id}", summary="Get characteristic details")
def get_characteristic_details(id: str):
    return []


@router.get("/api/v1/product-characteristics/{id}/options", summary="Get characteristic options")
def get_characteristic_options(id: str):
    return []


@router.get("/api/v1/product-characteristics/{id}", summary="Get single characteristic")
def get_single_characteristic(id: str):
    return {}


@router.get("/api/v1/product-characteristics", summary="List product characteristics")
def list_product_characteristics():
    return []
