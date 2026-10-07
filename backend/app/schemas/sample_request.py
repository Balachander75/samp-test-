from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field
from app.utils.business_year import get_current_business_year, get_business_year_start

class SampleRequestBase(BaseModel):
    sr_number: Optional[str] = None
    material_code: Optional[str] = None
    barcode: Optional[str] = None
    source_sample_code: Optional[str] = None
    customer_product_code: Optional[str] = None
    product_description: str
    product_type: Optional[str] = "Stationery Sample"
    product_type_navneet: Optional[str] = None
    product_type_new_customer: Optional[str] = None
    brand_name: Optional[str] = None
    customer: str
    target_plant: Optional[str] = None
    year: Optional[str] = Field(default_factory=get_current_business_year)
    program_year: Optional[str] = Field(default_factory=lambda: str(get_business_year_start()))
    program_name: Optional[str] = None
    date_request_created: Optional[str] = None
    sample_required_date: Optional[str] = None
    created_by: Optional[str] = "Marketing Team (Corporate)"
    unit_pc_pack: Optional[str] = "1"
    qty_for_sampling: Optional[str] = "1"
    qty_design_costing: Optional[str] = "0"
    mockup_required: Optional[str] = "No"
    designs_customer_creative: Optional[str] = None
    product_artwork_nos: Optional[str] = None
    target_artwork_date_creative: Optional[str] = None
    target_artwork_date_studio: Optional[str] = None
    creation_mode: Optional[str] = "feasibility_check"
    request_types: Optional[List[str]] = Field(default_factory=lambda: ["sample"])
    product_image_path: Optional[str] = None
    reference_images: Optional[List[str]] = Field(default_factory=list)
    reference_links: Optional[List[str]] = Field(default_factory=list)
    plant_feasibility_response: Optional[str] = None
    plant_feasibility_remark: Optional[str] = None
    sampling_feasibility_response: Optional[str] = None
    sampling_feasibility_remark: Optional[str] = None
    feasibility_closed_at: Optional[str] = None
    feasibility_closed_by: Optional[str] = None
    status: Optional[str] = "Pending Feasibility"

class SampleRequestCreate(SampleRequestBase):
    pass

class SampleRequestUpdate(BaseModel):
    material_code: Optional[str] = None
    product_description: Optional[str] = None
    customer: Optional[str] = None
    program_name: Optional[str] = None
    program_year: Optional[str] = None
    target_plant: Optional[str] = None
    barcode: Optional[str] = None
    customer_product_code: Optional[str] = None
    sample_required_date: Optional[str] = None
    brand_name: Optional[str] = None
    product_type: Optional[str] = None
    unit_pc_pack: Optional[str] = None
    qty_for_sampling: Optional[str] = None
    qty_design_costing: Optional[str] = None
    mockup_required: Optional[str] = None
    designs_customer_creative: Optional[str] = None
    product_artwork_nos: Optional[str] = None
    product_image_path: Optional[str] = None
    creation_mode: Optional[str] = None
    request_types: Optional[List[str]] = None
    source_sample_code: Optional[str] = None
    status: Optional[str] = None
    plant_feasibility_response: Optional[str] = None
    plant_feasibility_remark: Optional[str] = None
    sampling_feasibility_response: Optional[str] = None
    sampling_feasibility_remark: Optional[str] = None
    feasibility_closed_at: Optional[str] = None
    feasibility_closed_by: Optional[str] = None

class SampleRequestTypeAuditBase(BaseModel):
    design: bool = False
    mockup: bool = False
    sample: bool = False
    costing: bool = False
    design_selected_at: Optional[datetime] = None
    mockup_selected_at: Optional[datetime] = None
    sample_selected_at: Optional[datetime] = None
    costing_selected_at: Optional[datetime] = None


class SampleRequestTypeAuditOut(SampleRequestTypeAuditBase):
    id: int
    sample_request_id: int

    class Config:
        from_attributes = True


class SampleRequestOut(SampleRequestBase):
    id: int
    request_type_audit: Optional[SampleRequestTypeAuditOut] = None

    class Config:
        from_attributes = True


class BatchStatusUpdatePayload(BaseModel):
    sample_request_ids: List[int]
    status: str


class StagedProductItemPayload(BaseModel):
    material_code: Optional[str] = None
    product_description: Optional[str] = None
    source_sample_request_id: Optional[int] = None
    source_sample_code: Optional[str] = None
    creation_mode: Optional[str] = "material_code"
    custom_binding_1: Optional[str] = None
    custom_binding_2: Optional[str] = None
    custom_details: Optional[List[Dict[str, Any]]] = None
    request_types: Optional[List[str]] = Field(default_factory=list)
    request_type_timestamps: Optional[Dict[str, Optional[str]]] = None
    target_plant: Optional[str] = None
    unit_pc_pack: Optional[str] = None
    qty_for_sampling: Optional[str] = None
    qty_design_costing: Optional[str] = None
    customer_product_code: Optional[str] = None
    barcode: Optional[str] = None
    brand_name: Optional[str] = None
    product_type: Optional[str] = None
    sample_required_date: Optional[str] = None


class BatchCreateSampleRequestsPayload(BaseModel):
    customer: str
    program_name: Optional[str] = None
    program_year: Optional[str] = None
    year: Optional[str] = None
    target_plant: Optional[str] = None
    created_by: Optional[str] = "Marketing"
    date_request_created: Optional[str] = None
    sample_required_date: Optional[str] = None
    items: Optional[List[StagedProductItemPayload]] = None
    requests: Optional[List[Dict[str, Any]]] = None
