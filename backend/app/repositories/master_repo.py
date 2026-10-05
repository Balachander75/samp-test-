"""
Master Data Repository.
Handles all database operations for `customers` and `plants`.
"""
from typing import Optional, List
from sqlalchemy.orm import Session
from app.repositories.base import BaseRepository
from app.models.master import Customer, Plant


class MasterRepository:
    """Repository dedicated to Customer and Plant reference master data."""

    def __init__(self, db: Session):
        self.db = db
        self.customers = BaseRepository(Customer, db)
        self.plants = BaseRepository(Plant, db)

    def list_customers(self, search: Optional[str] = None) -> List[Customer]:
        """Query customers with optional search substring."""
        query = self.db.query(Customer)
        if search and search.strip():
            query = query.filter(Customer.name.ilike(f"%{search.strip()}%"))
        return query.order_by(Customer.name.asc()).all()

    def get_customer_by_name(self, name: str) -> Optional[Customer]:
        """Fetch customer by exact or case-insensitive name."""
        return self.db.query(Customer).filter(Customer.name.ilike(name.strip())).first()

    def create_customer(self, name: str, country: Optional[str] = None) -> Customer:
        """Create and persist a new customer."""
        customer = Customer(name=name.strip(), country=country)
        return self.customers.create(customer)

    def list_plants(self) -> List[Plant]:
        """Query all plants."""
        return self.db.query(Plant).order_by(Plant.id.asc()).all()

    def get_plant_by_code(self, code: str) -> Optional[Plant]:
        """Fetch plant by code."""
        return self.db.query(Plant).filter(Plant.code == code.strip()).first()

    def create_plant(
        self,
        code: str,
        name: str,
        location: Optional[str] = None,
        is_active: bool = True,
        created_by: Optional[str] = None,
    ) -> Plant:
        """Create and persist a new plant."""
        plant = Plant(
            code=code.strip(),
            name=name.strip(),
            location=location,
            is_active=is_active,
            created_by=created_by,
        )
        return self.plants.create(plant)
