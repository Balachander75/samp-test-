"""Customer, manufacturing plant, and enterprise user master-data endpoints."""
from typing import Optional, List
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.master import (
    CustomerCreate,
    CustomerOut,
    PlantCreate,
    PlantOut,
    PlantUpdate,
    UserCreate,
    UserOut,
    UserUpdate,
)
from app.services.master_service import MasterService

router = APIRouter(tags=["Master Data"])


def get_master_service(db: Session = Depends(get_db)) -> MasterService:
    return MasterService(db)


@router.get("/api/master/health", summary="Master data router health check")
def master_health():
    return {"status": "ok", "customers": "ready", "plants": "ready", "users": "ready"}


# ---------------------------------------------------------------------------
# Customers
# ---------------------------------------------------------------------------
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


# ---------------------------------------------------------------------------
# Manufacturing Plants
# ---------------------------------------------------------------------------
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


@router.patch(
    "/api/v1/plants/{id}",
    response_model=PlantOut,
    summary="Update a plant",
)
def update_plant(
    id: int,
    payload: PlantUpdate,
    service: MasterService = Depends(get_master_service),
):
    return service.update_plant(id, payload)


@router.delete(
    "/api/v1/plants/{id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a plant",
)
def delete_plant(
    id: int,
    service: MasterService = Depends(get_master_service),
):
    service.delete_plant(id)
    return None


# ---------------------------------------------------------------------------
# Users & Team Hierarchy
# ---------------------------------------------------------------------------
@router.get("/api/v1/users", response_model=List[UserOut], summary="List enterprise users")
def list_users(
    team: Optional[str] = Query(default=None, description="Filter by team department"),
    service: MasterService = Depends(get_master_service),
):
    return service.list_users(team)


@router.post(
    "/api/v1/users",
    response_model=UserOut,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new user with team and role",
)
def create_user(
    payload: UserCreate,
    service: MasterService = Depends(get_master_service),
):
    return service.create_user(payload)


@router.patch(
    "/api/v1/users/{id}",
    response_model=UserOut,
    summary="Update a user",
)
def update_user(
    id: int,
    payload: UserUpdate,
    service: MasterService = Depends(get_master_service),
):
    return service.update_user(id, payload)


@router.delete(
    "/api/v1/users/{id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a user",
)
def delete_user(
    id: int,
    service: MasterService = Depends(get_master_service),
):
    service.delete_user(id)
    return None
