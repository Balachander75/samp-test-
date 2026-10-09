"""
Master Data Repository.
Handles all database operations for `customers`, `plants`, and enterprise `users`.
"""
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from app.repositories.base import BaseRepository
from app.models.master import Customer, Plant, User


class MasterRepository:
    """Repository dedicated to Customer, Plant, and User reference master data."""

    def __init__(self, db: Session):
        self.db = db
        self.customers = BaseRepository(Customer, db)
        self.plants = BaseRepository(Plant, db)
        self.users = BaseRepository(User, db)

    # ---------------------------------------------------------
    # Customers
    # ---------------------------------------------------------
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

    # ---------------------------------------------------------
    # Plants
    # ---------------------------------------------------------
    def list_plants(self) -> List[Plant]:
        """Query all plants."""
        return self.db.query(Plant).order_by(Plant.id.asc()).all()

    def get_plant_by_id(self, id: int) -> Optional[Plant]:
        """Fetch plant by ID."""
        return self.plants.get_by_id(id)

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

    def update_plant(self, plant: Plant, fields: Dict[str, Any]) -> Plant:
        """Update existing plant attributes."""
        return self.plants.update(plant, fields)

    def delete_plant(self, id: int) -> bool:
        """Delete plant by ID."""
        return self.plants.delete(id)

    # ---------------------------------------------------------
    # Users & Teams
    # ---------------------------------------------------------
    def list_users(self, team: Optional[str] = None) -> List[User]:
        """Query users with optional team filter, ordered by team head first then name."""
        query = self.db.query(User)
        if team and team.strip() and team.upper() != "ALL":
            query = query.filter(User.team.ilike(team.strip()))
        return query.order_by(User.is_team_head.desc(), User.name.asc()).all()

    def get_user_by_id(self, id: int) -> Optional[User]:
        """Fetch user by primary key."""
        return self.users.get_by_id(id)

    def get_user_by_userid(self, userid: str) -> Optional[User]:
        """Fetch user by unique handle."""
        return self.db.query(User).filter(User.userid.ilike(userid.strip())).first()

    def get_user_by_email(self, email: str) -> Optional[User]:
        """Fetch user by unique email."""
        return self.db.query(User).filter(User.email.ilike(email.strip())).first()

    def create_user(
        self,
        name: str,
        userid: str,
        email: str,
        password_hash: str,
        role: str = "user",
        sub_role: Optional[str] = None,
        team: Optional[str] = None,
        is_team_head: bool = False,
        plant_code: Optional[str] = None,
        is_active: bool = True,
    ) -> User:
        """Create and persist a new user."""
        user = User(
            name=name.strip(),
            userid=userid.strip(),
            email=email.strip().lower(),
            password_hash=password_hash,
            role=role,
            sub_role=sub_role,
            team=team,
            is_team_head=is_team_head,
            plant_code=plant_code,
            is_active=is_active,
        )
        return self.users.create(user)

    def update_user(self, user: User, fields: Dict[str, Any]) -> User:
        """Update user record."""
        return self.users.update(user, fields)

    def delete_user(self, id: int) -> bool:
        """Delete user record."""
        return self.users.delete(id)
