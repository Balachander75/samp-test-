"""
Master Data Service.
Encapsulates business operations for Customer and Plant master data.
"""
from typing import Optional, List
from sqlalchemy.orm import Session
from app.repositories.master_repo import MasterRepository
from app.models.master import Customer, Plant
from app.schemas.master import CustomerCreate, PlantCreate


class MasterService:
    """Application service for master data management."""

    def __init__(self, db: Session):
        self.repo = MasterRepository(db)

    def list_customers(self, search: Optional[str] = None) -> List[Customer]:
        """Fetch all or filtered customers."""
        return self.repo.list_customers(search)

    def create_customer(self, payload: CustomerCreate) -> Customer:
        """Create a new customer master entry."""
        return self.repo.create_customer(name=payload.name, country=payload.country)

    def list_plants(self) -> List[Plant]:
        """Fetch all manufacturing plants."""
        return self.repo.list_plants()

    def create_plant(self, payload: PlantCreate) -> Plant:
        """Create a new manufacturing plant master entry."""
        is_active = payload.is_active if payload.is_active is not None else True
        return self.repo.create_plant(
            code=payload.code,
            name=payload.name,
            location=payload.location,
            is_active=is_active,
            created_by=payload.created_by,
        )
