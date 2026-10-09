"""
Sample requests and operational flow routers.
Provides endpoints for sample requests, design requests, and cross-desk downstream tasks
(studio dielines, creative briefs, costing estimations, product characteristics).
Delegates domain persistence to SampleRequestService, DesignRequestService, and Repositories.
"""
from typing import Any, Dict, List, Optional
from datetime import datetime, timezone
import re
from fastapi import APIRouter, Body, Depends, HTTPException, Request, Response, status
from sqlalchemy.orm import Session

from app.auth.security import get_optional_current_user
from app.database import get_db
from app.models.sample_request import ProductCharacteristic, ProductDetail
from app.services.sample_request_service import SampleRequestService
from app.services.design_request_service import DesignRequestService
from app.services.downstream_service import DownstreamService
from app.utils.business_year import get_current_business_year

router = APIRouter(tags=["Sample Requests & Operations"])


def _normalize_binding(value: Any) -> str:
    return re.sub(r"[^a-z0-9]+", "", str(value or "").casefold())


def get_sample_request_service(db: Session = Depends(get_db)) -> SampleRequestService:
    return SampleRequestService(db)


def get_design_request_service(db: Session = Depends(get_db)) -> DesignRequestService:
    return DesignRequestService(db)


def get_downstream_service(db: Session = Depends(get_db)) -> DownstreamService:
    return DownstreamService(db)



# ---------------------------------------------------------------------------
# Business Years Metadata
# ---------------------------------------------------------------------------

@router.get("/api/v1/sample-requests/business-years", summary="Get available business years and summary")
@router.get("/api/sample-requests/business-years", summary="Get available business years and summary (legacy alias)")
def get_business_years(service: SampleRequestService = Depends(get_sample_request_service)):
    return service.get_business_years_summary()


# ---------------------------------------------------------------------------
# Sample Requests (/api/v1/sample-requests and legacy alias /api/sample-requests)
# ---------------------------------------------------------------------------

@router.get("/api/v1/sample-requests", summary="List sample requests with filters")
@router.get("/api/sample-requests", summary="List sample requests (legacy alias)")
def list_sample_requests(
    year: Optional[str] = None,
    customer: Optional[str] = None,
    status: Optional[str] = None,
    stage: Optional[str] = None,
    created_by: Optional[str] = None,
    service: SampleRequestService = Depends(get_sample_request_service),
):
    effective_status = status or stage
    return service.list_requests(
        year=year,
        customer=customer,
        status=effective_status,
        created_by=created_by,
    )


@router.get("/api/v1/sample-requests/search-material", summary="Search products by material code (alias)")
@router.get("/api/v1/sample-requests/search-materials", summary="Search products by material code")
def search_materials_get(
    query: Optional[str] = None,
    code: Optional[str] = None,
    service: SampleRequestService = Depends(get_sample_request_service),
):
    search_term = code or query or ""
    return service.search_materials(search_term)


@router.get("/api/v1/sample-requests/{id}", response_model=Dict[str, Any], summary="Get sample request by ID or SR Number")
@router.get("/api/sample-requests/{id}", response_model=Dict[str, Any], summary="Get sample request (legacy alias)")
def get_sample_request(
    id: str,
    service: SampleRequestService = Depends(get_sample_request_service),
):
    num_id = int(id) if id.isdigit() else None
    if not num_id:
        req = service.repo.get_by_sr_number(id)
        if not req:
            raise HTTPException(status_code=404, detail="Sample request not found")
        num_id = req.id

    result = service.get_by_id(num_id)
    if not result:
        raise HTTPException(status_code=404, detail="Sample request not found")
    return result


@router.post("/api/v1/sample-requests", status_code=status.HTTP_201_CREATED, summary="Create a single sample request")
@router.post("/api/sample-requests", status_code=status.HTTP_201_CREATED, summary="Create a single sample request (legacy alias)")
def create_sample_request(
    payload: Dict[str, Any] = Body(...),
    service: SampleRequestService = Depends(get_sample_request_service),
    design_service: DesignRequestService = Depends(get_design_request_service),
    current_user = Depends(get_optional_current_user),
):
    if not isinstance(payload, dict):
        raise HTTPException(status_code=400, detail="Invalid JSON body")

    created = service.create(payload)

    # Sync to design requests if request involves design
    request_types = payload.get("request_types") or []
    if "design" in request_types:
        sync_payload = {**payload, **created}
        design_service.sync_sample_request(sync_payload)

    return {"success": True, "message": "Sample request created successfully", "data": created}


@router.post("/api/v1/sample-requests/batch", status_code=status.HTTP_201_CREATED, summary="Batch create multiple sample requests")
@router.post("/api/sample-requests/batch", status_code=status.HTTP_201_CREATED, summary="Batch create multiple sample requests (legacy alias)")
def create_sample_requests_batch(
    body: Any = Body(...),
    service: SampleRequestService = Depends(get_sample_request_service),
    design_service: DesignRequestService = Depends(get_design_request_service),
    current_user = Depends(get_optional_current_user),
):
    if isinstance(body, list):
        normalized_items = [item for item in body if isinstance(item, dict)]
        if len(normalized_items) != len(body):
            raise HTTPException(status_code=422, detail="Every batch item must be an object")
    elif isinstance(body, dict):
        items = body.get("requests") or body.get("items", [])
        if not items or not isinstance(items, list):
            raise HTTPException(status_code=422, detail="Expected 'requests' or 'items' array in payload")
        shared_fields = {
            key: value for key, value in body.items() if key not in {"requests", "items"}
        }
        normalized_items = [
            {**shared_fields, **item} for item in items if isinstance(item, dict)
        ]
        if len(normalized_items) != len(items):
            raise HTTPException(status_code=422, detail="Every batch item must be an object")
    else:
        raise HTTPException(status_code=422, detail="Payload must be a list or object with requests array")

    created_results = service.batch_create(normalized_items)

    # Sync any design-scoped items with original input fields
    for idx, item in enumerate(created_results):
        req_types = item.get("request_types") or []
        if "design" in req_types:
            raw_input = normalized_items[idx] if idx < len(normalized_items) else {}
            sync_payload = {**raw_input, **item}
            design_service.sync_sample_request(sync_payload)

    return {
        "success": True,
        "count": len(created_results),
        "results": created_results,
    }


@router.post("/api/v1/sample-requests/search-materials", summary="Search products by material code")
def search_materials_post(
    body: Dict[str, Any] = Body(default_factory=dict),
    service: SampleRequestService = Depends(get_sample_request_service),
):
    query = body.get("query", "") if isinstance(body, dict) else ""
    return service.search_materials(query)


@router.put("/api/v1/sample-requests/{id}", summary="Update sample request (PUT)")
@router.put("/api/sample-requests/{id}", summary="Update sample request (PUT legacy alias)")
@router.patch("/api/v1/sample-requests/{id}", summary="Update sample request")
@router.patch("/api/sample-requests/{id}", summary="Update sample request (legacy alias)")
def update_sample_request(
    id: str,
    body: Dict[str, Any] = Body(...),
    service: SampleRequestService = Depends(get_sample_request_service),
    design_service: DesignRequestService = Depends(get_design_request_service),
    current_user = Depends(get_optional_current_user),
):
    if not isinstance(body, dict):
        raise HTTPException(status_code=400, detail="Invalid JSON body")

    num_id = int(id) if id.isdigit() else None
    if not num_id:
        req = service.repo.get_by_sr_number(id)
        if req:
            num_id = req.id

    if not num_id:
        raise HTTPException(status_code=404, detail="Sample request not found")

    updated = service.update(num_id, body)
    if not updated:
        raise HTTPException(status_code=404, detail="Sample request not found")

    # Sync status and design metadata to design requests if present
    req_types = updated.get("request_types") or body.get("request_types") or []
    if "design" in req_types or "status" in body or "trend" in body:
        sync_payload = {**body, **updated}
        design_service.sync_sample_request(sync_payload)

    return updated


@router.post("/api/v1/sample-requests/batch-status", summary="Batch update status")
def batch_update_status(
    body: Dict[str, Any] = Body(...),
    service: SampleRequestService = Depends(get_sample_request_service),
    current_user = Depends(get_optional_current_user),
):
    if not isinstance(body, dict):
        raise HTTPException(status_code=400, detail="Invalid JSON body")

    ids = body.get("sample_request_ids") or body.get("ids") or []
    new_status = body.get("status")
    if not ids or not new_status:
        raise HTTPException(status_code=422, detail="Missing required parameters")

    numeric_ids = [int(i) for i in ids if str(i).isdigit()]
    updated_count = service.batch_update_status(numeric_ids, new_status)
    return {"success": True, "updated_count": updated_count}



@router.delete("/api/v1/sample-requests/{id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete sample request")
@router.delete("/api/sample-requests/{id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete sample request (legacy alias)")
def delete_sample_request(
    id: str,
    service: SampleRequestService = Depends(get_sample_request_service),
    design_service: DesignRequestService = Depends(get_design_request_service),
):
    num_id = int(id) if id.isdigit() else None
    if not num_id:
        req = service.repo.get_by_sr_number(id)
        if req:
            num_id = req.id

    if num_id:
        existing = service.get_by_id(num_id)
        if existing:
            design_service.sync_sample_request(existing, is_delete=True)
        service.delete(num_id)

    return Response(status_code=status.HTTP_204_NO_CONTENT)


# ---------------------------------------------------------------------------
# Design Requests (/api/v1/design-requests)
# ---------------------------------------------------------------------------

@router.get("/api/v1/design-requests", response_model=List[Dict[str, Any]], summary="List design requests")
def list_design_requests(service: DesignRequestService = Depends(get_design_request_service)):
    return service.list_all()


@router.post("/api/v1/sample-requests/{sample_id}/design-brief", summary="Submit a design-only brief to Creative")
def submit_design_brief(
    sample_id: int,
    body: Dict[str, Any] = Body(...),
    service: SampleRequestService = Depends(get_sample_request_service),
    design_service: DesignRequestService = Depends(get_design_request_service),
    current_user = Depends(get_optional_current_user),
):
    if not isinstance(body, dict):
        raise HTTPException(status_code=400, detail="Invalid JSON body")

    description = str(body.get("product_description") or "").strip()
    count = body.get("number_of_designs")
    if not description:
        raise HTTPException(status_code=422, detail="Product description is required")
    try:
        count = int(count)
    except (TypeError, ValueError):
        count = 0
    if count < 1:
        raise HTTPException(status_code=422, detail="At least one design must be requested")

    parent = service.get_by_id(sample_id)
    if not parent:
        raise HTTPException(status_code=404, detail="Sample request not found")
    sr_number = parent.get("sr_number")
    existing_design = next((item for item in design_service.list_all() if item.get("sr_number") == sr_number), None)
    if existing_design and not str(existing_design.get("status") or "").lower().startswith("draft"):
        raise HTTPException(status_code=409, detail="This design request has already left Draft")

    updated_sample = service.update(sample_id, {
        "request_types": ["design"],
        "status": "Creative",
        "product_description": description,
        "product_artwork_nos": count,
        "target_artwork_date_creative": body.get("design_required_date"),
    })
    if not updated_sample:
        raise HTTPException(status_code=404, detail="Sample request not found")

    design_service.sync_sample_request(updated_sample)
    record = next((item for item in design_service.list_all() if item.get("sr_number") == sr_number), None)
    if not record:
        raise HTTPException(status_code=500, detail="Design request could not be created")

    record = design_service.update(record["id"], {
        "status": "Creative",
        "number_of_designs": count,
        "trend": body.get("trend") or None,
        "target_audience": body.get("target_audience") or None,
        "product_description": description,
        "design_required_date": body.get("design_required_date") or None,
        "reference_image": body.get("reference_image") or None,
        "reference_images": body.get("reference_images") or [],
        "reference_links": body.get("reference_links") or [],
        "design_remarks": body.get("design_remarks") or None,
        "marketing_decision": None,
        "remaining_design_count": count,
        "creative_submissions": [],
    })
    return {"success": True, "data": record}


@router.put("/api/v1/design-requests/{id}/creative-output", summary="Submit Creative design output")
def submit_creative_design_output(
    id: int,
    body: Dict[str, Any] = Body(...),
    service: DesignRequestService = Depends(get_design_request_service),
    sample_service: SampleRequestService = Depends(get_sample_request_service),
    current_user = Depends(get_optional_current_user),
):
    if not isinstance(body, dict):
        raise HTTPException(status_code=400, detail="Invalid JSON body")
    record = service.get_by_id(id)
    if not record:
        raise HTTPException(status_code=404, detail="Design request not found")
    if record.get("status") not in {"Creative", "Creative Remaining Requested"}:
        raise HTTPException(status_code=409, detail="This request is not awaiting Creative output")

    file_url = str(body.get("design_file_url") or "").strip()
    rows = body.get("rows")
    if not file_url:
        raise HTTPException(status_code=422, detail="Add a link to the design files")
    if not isinstance(rows, list) or not rows:
        raise HTTPException(status_code=422, detail="Add at least one completed design")
    previous_submissions = record.get("creative_submissions") or []
    delivered_before = sum(len(batch.get("rows") or []) for batch in previous_submissions)
    remaining = max(0, int(record.get("number_of_designs") or 0) - delivered_before)
    if len(rows) > remaining:
        raise HTTPException(status_code=422, detail=f"Only {remaining} design(s) remain")

    normalized_rows = []
    for offset, row in enumerate(rows):
        description = str(row.get("description") or "").strip()
        stock_number = str(row.get("stock_number") or "").strip()
        remarks = str(row.get("remarks") or "").strip()
        if not description:
            raise HTTPException(status_code=422, detail=f"D{delivered_before + offset + 1}: description is required")
        if not stock_number and not remarks:
            raise HTTPException(status_code=422, detail=f"D{delivered_before + offset + 1}: add a Shutterstock number or a remark")
        normalized_rows.append({
            "design_number": f"D{delivered_before + offset + 1}",
            "description": description,
            "stock_number": stock_number,
            "remarks": remarks,
        })

    batch = {
        "submitted_at": datetime.now(timezone.utc).isoformat(),
        "design_file_url": file_url,
        "rows": normalized_rows,
    }
    submissions = [*previous_submissions, batch]
    delivered = delivered_before + len(normalized_rows)
    updated = service.update(id, {
        "creative_submissions": submissions,
        "remaining_design_count": max(0, int(record.get("number_of_designs") or 0) - delivered),
        "marketing_decision": "awaiting_marketing_review",
        "status": "Awaiting Marketing Review",
    })
    linked_sample = sample_service.repo.get_by_sr_number(record.get("sr_number"))
    if linked_sample:
        sample_service.update(linked_sample.id, {"status": "Awaiting Marketing Review"})
    return updated


@router.post("/api/v1/design-requests/{id}/marketing-decision", summary="Accept design output or request remaining designs")
def marketing_design_decision(
    id: int,
    body: Dict[str, Any] = Body(...),
    service: DesignRequestService = Depends(get_design_request_service),
    sample_service: SampleRequestService = Depends(get_sample_request_service),
    current_user = Depends(get_optional_current_user),
):
    if not isinstance(body, dict):
        raise HTTPException(status_code=400, detail="Invalid JSON body")
    record = service.get_by_id(id)
    if not record:
        raise HTTPException(status_code=404, detail="Design request not found")
    if record.get("marketing_decision") == "accepted" or record.get("status") == "Approved / Closed":
        raise HTTPException(status_code=409, detail="This design request is already closed")
    if record.get("status") != "Awaiting Marketing Review":
        raise HTTPException(status_code=409, detail="Creative output must be submitted before review")

    decision = body.get("decision")
    remaining = max(0, int(record.get("number_of_designs") or 0) - sum(
        len(batch.get("rows") or []) for batch in (record.get("creative_submissions") or [])
    ))
    if decision == "accept":
        updates = {"marketing_decision": "accepted", "status": "Approved / Closed", "remaining_design_count": 0}
    elif decision == "request_remaining":
        if remaining == 0:
            raise HTTPException(status_code=409, detail="All requested designs have been delivered")
        updates = {"marketing_decision": "remaining_requested", "status": "Creative Remaining Requested", "remaining_design_count": remaining}
    else:
        raise HTTPException(status_code=422, detail="Decision must be accept or request_remaining")

    updated = service.update(id, updates)
    linked_sample = sample_service.repo.get_by_sr_number(record.get("sr_number"))
    if linked_sample:
        sample_service.update(linked_sample.id, {"status": updates["status"]})
    return updated


@router.post("/api/v1/design-requests", status_code=status.HTTP_201_CREATED, summary="Create design request")
def create_design_request(
    body: Dict[str, Any] = Body(default_factory=dict),
    service: DesignRequestService = Depends(get_design_request_service),
    current_user = Depends(get_optional_current_user),
):
    return service.create(body if isinstance(body, dict) else {})


@router.get("/api/v1/design-requests/{id}", response_model=Dict[str, Any], summary="Get design request")
def get_design_request(
    id: int,
    service: DesignRequestService = Depends(get_design_request_service),
):
    record = service.get_by_id(id)
    if not record:
        raise HTTPException(status_code=404, detail="Design request not found")
    return record


@router.patch("/api/v1/design-requests/{id}", summary="Update design request")
def update_design_request(
    id: int,
    body: Dict[str, Any] = Body(default_factory=dict),
    service: DesignRequestService = Depends(get_design_request_service),
    current_user = Depends(get_optional_current_user),
):
    record = service.update(id, body if isinstance(body, dict) else {})
    if not record:
        raise HTTPException(status_code=404, detail="Design request not found")
    return record


@router.delete("/api/v1/design-requests/{id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete design request")
def delete_design_request(
    id: int,
    service: DesignRequestService = Depends(get_design_request_service),
):
    service.delete(id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# ---------------------------------------------------------------------------
# Downstream Cross-Desk Persistent Operations
# ---------------------------------------------------------------------------

@router.get("/api/v1/creative/briefs", response_model=List[Dict[str, Any]], summary="List creative briefs")
def list_creative_briefs(service: DownstreamService = Depends(get_downstream_service)):
    return service.list_creative_briefs()


@router.patch("/api/v1/creative/briefs/{id}", summary="Update creative brief")
def update_creative_brief(
    id: str,
    body: Dict[str, Any] = Body(...),
    service: DownstreamService = Depends(get_downstream_service),
    current_user = Depends(get_optional_current_user),
):
    if not isinstance(body, dict):
        raise HTTPException(status_code=400, detail="Invalid JSON body")
    updated = service.update_creative_brief(id, body)
    if not updated:
        raise HTTPException(status_code=404, detail="Creative brief not found")
    return updated


@router.get("/api/v1/studio/dielines", response_model=List[Dict[str, Any]], summary="List studio dielines")
def list_studio_dielines(service: DownstreamService = Depends(get_downstream_service)):
    return service.list_studio_dielines()


@router.patch("/api/v1/studio/dielines/{id}", summary="Update studio dieline")
def update_studio_dieline(
    id: str,
    body: Dict[str, Any] = Body(...),
    service: DownstreamService = Depends(get_downstream_service),
    current_user = Depends(get_optional_current_user),
):
    if not isinstance(body, dict):
        raise HTTPException(status_code=400, detail="Invalid JSON body")
    updated = service.update_studio_dieline(id, body)
    if not updated:
        raise HTTPException(status_code=404, detail="Studio dieline not found")
    return updated


@router.get("/api/v1/costing/estimations", response_model=List[Dict[str, Any]], summary="List costing estimations")
def list_costing_estimations(service: DownstreamService = Depends(get_downstream_service)):
    return service.list_costing_estimations()


@router.patch("/api/v1/costing/estimations/{id}", summary="Update costing estimation")
def update_costing_estimation(
    id: str,
    body: Dict[str, Any] = Body(...),
    service: DownstreamService = Depends(get_downstream_service),
    current_user = Depends(get_optional_current_user),
):
    if not isinstance(body, dict):
        raise HTTPException(status_code=400, detail="Invalid JSON body")
    updated = service.update_costing_estimation(id, body)
    if not updated:
        raise HTTPException(status_code=404, detail="Costing estimation not found")
    return updated


# ---------------------------------------------------------------------------
# Product Characteristics (/api/v1/product-characteristics)
# ---------------------------------------------------------------------------

@router.get("/api/v1/product-characteristics", summary="List all active product characteristics")
def list_product_characteristics(service: SampleRequestService = Depends(get_sample_request_service)):
    return service.get_all_characteristics()


@router.get("/api/v1/product-characteristics/classes", summary="List product characteristic classes")
def list_characteristic_classes(service: SampleRequestService = Depends(get_sample_request_service)):
    return service.get_characteristic_classes()


@router.get("/api/v1/product-characteristics/details/{sample_request_id}", summary="Get product details for a sample request")
def get_product_details(
    sample_request_id: int,
    exclude_na: bool = False,
    service: SampleRequestService = Depends(get_sample_request_service),
):
    return service.get_product_details(sample_request_id)


@router.post("/api/v1/product-characteristics/details", summary="Save product details for a sample request")
def save_product_details(
    request: Request,
    body: Any = Body(...),
    service: SampleRequestService = Depends(get_sample_request_service),
    current_user = Depends(get_optional_current_user),
):
    sample_request_id = (
        request.query_params.get("sample_request_id")
        or (body.get("sample_request_id") if isinstance(body, dict) else None)
        or (body.get("sampleRequestId") if isinstance(body, dict) else None)
    )
    if isinstance(body, list):
        details = body
    elif isinstance(body, dict):
        details = body.get("details") or []
    else:
        details = []

    if not sample_request_id or not isinstance(details, list):
        raise HTTPException(status_code=422, detail="Missing sample_request_id or details list")

    success = service.save_product_details(int(sample_request_id), details)
    if not success:
        raise HTTPException(status_code=404, detail="Sample request not found")
    return {"success": True, "message": "Product details updated successfully"}



@router.get("/api/v1/product-characteristics/binding-hierarchy", summary="Get binding hierarchy")
def get_binding_hierarchy(db: Session = Depends(get_db)):
    characteristics = db.query(ProductCharacteristic).filter(ProductCharacteristic.is_active == True).all()
    b1_char = next((item for item in characteristics if _normalize_binding(item.characteristic_name) in {"bindingtype1", "binding1"}), None)
    b2_char = next((item for item in characteristics if _normalize_binding(item.characteristic_name) in {"bindingtype2", "binding2"}), None)
    b1_opts = b1_char.options if b1_char and b1_char.options else []
    b2_opts = b2_char.options if b2_char and b2_char.options else []
    binding_rows = db.query(
        ProductDetail.sample_request_id,
        ProductDetail.characteristic_name,
        ProductDetail.value,
    ).all()
    products_by_request: Dict[int, Dict[str, str]] = {}
    for request_id, characteristic_name, value in binding_rows:
        normalized = _normalize_binding(characteristic_name)
        if not value:
            continue
        product_bindings = products_by_request.setdefault(request_id, {})
        if normalized in {"BINDINGTYPE1", "BINDING1"}:
            product_bindings["binding1"] = str(value).strip()
        elif normalized in {"BINDINGTYPE2", "BINDING2"}:
            product_bindings["binding2"] = str(value).strip()

    b1_values = [bindings["binding1"] for bindings in products_by_request.values() if bindings.get("binding1")]
    b2_values = [bindings["binding2"] for bindings in products_by_request.values() if bindings.get("binding2")]
    b1_cleaned = sorted({str(value).strip() for value in [*b1_opts, *b1_values] if value and str(value).strip()})
    b2_cleaned = sorted({str(value).strip() for value in [*b2_opts, *b2_values] if value and str(value).strip()})

    hierarchy: Dict[str, List[str]] = {}
    for binding1 in b1_cleaned:
        matching_binding2 = {
            bindings["binding2"]
            for bindings in products_by_request.values()
            if _normalize_binding(bindings.get("binding1")) == _normalize_binding(binding1) and bindings.get("binding2")
        }
        hierarchy[binding1] = sorted(matching_binding2) or b2_cleaned

    return {
        "binding1_options": b1_cleaned,
        "binding2_options": b2_cleaned,
        "hierarchy": hierarchy,
    }


@router.get("/api/v1/product-characteristics/filter-by-binding", summary="Search saved products by binding")
def search_products_by_binding(
    b1: str,
    b2: Optional[str] = None,
    limit: Optional[int] = None,
    service: SampleRequestService = Depends(get_sample_request_service),
):
    if not b1.strip():
        raise HTTPException(status_code=422, detail="Binding 1 is required")
    return service.search_products_by_binding(b1, b2, limit)
