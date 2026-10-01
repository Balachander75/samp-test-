from datetime import datetime
from pydantic import BaseModel, ConfigDict
from typing import Optional

class CustomerBase(BaseModel):
    name: str
    country: Optional[str] = "India"

class CustomerCreate(CustomerBase):
    pass

class CustomerOut(CustomerBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class PlantBase(BaseModel):
    code: str
    name: str
    location: Optional[str] = None
    is_active: Optional[bool] = True
    created_by: Optional[str] = None

class PlantCreate(PlantBase):
    pass

class PlantOut(PlantBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class UserOut(BaseModel):
    id: int
    name: str
    userid: str
    email: str
    role: str
    sub_role: Optional[str] = None
    is_active: bool

    model_config = ConfigDict(from_attributes=True)
