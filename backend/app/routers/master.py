"""Customer and manufacturing plant master-data endpoints."""
from typing import Optional

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.master import Customer, Plant
from app.schemas.master import CustomerCreate, CustomerOut, PlantCreate, PlantOut

router = APIRouter(tags=["Master Data"])


@router.get("/api/master/health", summary="Master data router health check")
def master_health():
    return {"status": "ok", "customers": "ready", "plants": "ready"}


@router.get("/api/v1/customers", response_model=list[CustomerOut], summary="List customers")
def list_customers(
    search: Optional[str] = Query(default=None),
    db: Session = Depends(get_db),
):
    query = db.query(Customer)
    if search and search.strip():
        query = query.filter(Customer.name.ilike(f"%{search.strip()}%"))
    return query.order_by(Customer.name.asc()).all()


@router.post(
    "/api/v1/customers",
    response_model=CustomerOut,
    status_code=status.HTTP_201_CREATED,
    summary="Create a customer",
)
def create_customer(payload: CustomerCreate, db: Session = Depends(get_db)):
    customer = Customer(name=payload.name.strip(), country=payload.country)
    db.add(customer)
    db.commit()
    db.refresh(customer)
    return customer


@router.get("/api/v1/plants", response_model=list[PlantOut], summary="List plants")
def list_plants(db: Session = Depends(get_db)):
    return db.query(Plant).order_by(Plant.id.asc()).all()


@router.post(
    "/api/v1/plants",
    response_model=PlantOut,
    status_code=status.HTTP_201_CREATED,
    summary="Create a plant",
)
def create_plant(payload: PlantCreate, db: Session = Depends(get_db)):
    plant = Plant(
        code=payload.code.strip(),
        name=payload.name.strip(),
        location=payload.location,
        is_active=payload.is_active if payload.is_active is not None else True,
        created_by=payload.created_by,
    )
    db.add(plant)
    db.commit()
    db.refresh(plant)
    return plant
