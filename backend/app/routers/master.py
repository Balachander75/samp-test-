"""Customer and manufacturing plant master-data endpoints."""
from typing import Optional, List
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.master import CustomerCreate, CustomerOut, PlantCreate, PlantOut
from app.services.master_service import MasterService

router = APIRouter(tags=["Master Data"])


def get_master_service(db: Session = Depends(get_db)) -> MasterService:
    return MasterService(db)


@router.get("/api/master/health", summary="Master data router health check")
def master_health():
    return {"status": "ok", "customers": "ready", "plants": "ready"}


@router.get("/api/v1/customers", response_model=List[CustomerOut], summary="List customers")
def list_customers(
    search: Optional[str] = Query(default=None),
    service: MasterService = Depends(get_master_service),
):
    return service.list_customers(search)


@router.post(
    "/api/v1/customers",
    response_model=CustomerOut,
    status_code=status.HTTP_201_CREATED,
    summary="Create a customer",
)
def create_customer(
    payload: CustomerCreate,
    service: MasterService = Depends(get_master_service),
):
    return service.create_customer(payload)


@router.get("/api/v1/plants", response_model=List[PlantOut], summary="List plants")
def list_plants(service: MasterService = Depends(get_master_service)):
    return service.list_plants()


@router.post(
    "/api/v1/plants",
    response_model=PlantOut,
    status_code=status.HTTP_201_CREATED,
    summary="Create a plant",
)
def create_plant(
    payload: PlantCreate,
    service: MasterService = Depends(get_master_service),
):
    return service.create_plant(payload)
