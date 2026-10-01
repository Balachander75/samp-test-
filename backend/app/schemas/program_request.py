"""Pydantic schemas for Seasonal Program Planning and Material Specification Matrix."""

from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


class ProgramMaterialBase(BaseModel):
    material_type: Optional[str] = None
    supplier_name: Optional[str] = None
    grade: Optional[str] = None
    color_variant: Optional[str] = None
    caliper_wt: Optional[str] = None
    quantity: Optional[str] = None
    unit: Optional[str] = None
    remark: Optional[str] = None
    samp_remark: Optional[str] = None


class ProgramMaterialCreate(ProgramMaterialBase):
    pass


class ProgramMaterialOut(ProgramMaterialBase):
    id: int
    program_request_id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


from app.utils.business_year import get_current_business_year


class ProgramRequestCreate(BaseModel):
    customer_name: str = Field(..., min_length=1, description="Customer account name")
    target_plant: str = Field(..., min_length=1, description="Target manufacturing plant")
    program_campaign_title: str = Field(..., min_length=1, description="Program campaign title")
    program_year: str = Field(default_factory=get_current_business_year, description="Fiscal / program year")
    created_by: Optional[str] = None
    materials: Optional[List[ProgramMaterialCreate]] = Field(
        default_factory=list,
        description="Material Specification Matrix rows (all fields optional)",
    )


class ProgramRequestUpdate(BaseModel):
    customer_name: Optional[str] = None
    target_plant: Optional[str] = None
    program_campaign_title: Optional[str] = None
    program_year: Optional[str] = None
    status: Optional[str] = None


class ProgramMaterialRemarkUpdate(BaseModel):
    material_id: int
    samp_remark: Optional[str] = None


class ProgramBatchSampRemarksUpdate(BaseModel):
    remarks: List[ProgramMaterialRemarkUpdate]


class SingleSampRemarkUpdate(BaseModel):
    samp_remark: Optional[str] = None


class ProgramRequestOut(BaseModel):
    id: int
    request_code: str
    sr_number: str
    customer_name: str
    target_plant: str
    program_campaign_title: str
    program_year: str
    status: str
    created_by: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    materials: List[ProgramMaterialOut] = []

    class Config:
        from_attributes = True
