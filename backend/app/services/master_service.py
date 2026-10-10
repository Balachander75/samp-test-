"""
Master Data Service.
Encapsulates business operations for Customer, Plant, and User master data.
"""
from typing import Optional, List, Dict, Any
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.repositories.master_repo import MasterRepository
from app.models.master import Customer, Plant, User
from app.schemas.master import CustomerCreate, PlantCreate, PlantUpdate, UserCreate, UserUpdate
from app.auth.security import hash_password


class MasterService:
    """Application service for master data management."""

    def __init__(self, db: Session):
        self.repo = MasterRepository(db)

    # ---------------------------------------------------------
    # Customers
    # ---------------------------------------------------------
    def list_customers(self, search: Optional[str] = None) -> List[Customer]:
        """Fetch all or filtered customers."""
        return self.repo.list_customers(search)

    def create_customer(self, payload: CustomerCreate) -> Customer:
        """Create a new customer master entry."""
        return self.repo.create_customer(name=payload.name, country=payload.country)

    # ---------------------------------------------------------
    # Plants
    # ---------------------------------------------------------
    def list_plants(self) -> List[Plant]:
        """Fetch all manufacturing plants."""
        return self.repo.list_plants()

    def create_plant(self, payload: PlantCreate) -> Plant:
        """Create a new manufacturing plant master entry."""
        existing = self.repo.get_plant_by_code(payload.code)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Plant with code '{payload.code}' already exists.",
            )
        is_active = payload.is_active if payload.is_active is not None else True
        return self.repo.create_plant(
            code=payload.code,
            name=payload.name,
            location=payload.location,
            is_active=is_active,
            created_by=payload.created_by,
        )

    def update_plant(self, plant_id: int, payload: PlantUpdate) -> Plant:
        """Update an existing plant."""
        plant = self.repo.get_plant_by_id(plant_id)
        if not plant:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Plant not found.")
        updates: Dict[str, Any] = {}
        if payload.code is not None:
            updates["code"] = payload.code.strip()
        if payload.name is not None:
            updates["name"] = payload.name.strip()
        if payload.location is not None:
            updates["location"] = payload.location.strip()
        if payload.is_active is not None:
            updates["is_active"] = payload.is_active
        return self.repo.update_plant(plant, updates)

    def delete_plant(self, plant_id: int) -> bool:
        """Delete a plant."""
        plant = self.repo.get_plant_by_id(plant_id)
        if not plant:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Plant not found.")
        return self.repo.delete_plant(plant_id)

    # ---------------------------------------------------------
    # Users & Team Hierarchy
    # ---------------------------------------------------------
    def list_users(self, team: Optional[str] = None) -> List[User]:
        """List enterprise users, optionally filtered by team."""
        return self.repo.list_users(team)

    def create_user(self, payload: UserCreate) -> User:
        """Create a new user with unique username and email validation."""
        if self.repo.get_user_by_userid(payload.userid):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Username '{payload.userid}' is already in use.",
            )
        if self.repo.get_user_by_email(payload.email):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Email '{payload.email}' is already registered.",
            )
        password_hash = hash_password(payload.password)
        is_active = payload.is_active if payload.is_active is not None else True
        is_head = payload.is_team_head if payload.is_team_head is not None else False

        return self.repo.create_user(
            name=payload.name,
            userid=payload.userid,
            email=payload.email,
            password_hash=password_hash,
            role=payload.role,
            sub_role=payload.sub_role,
            team=payload.team,
            is_team_head=is_head,
            plant_code=payload.plant_code,
            is_active=is_active,
        )

    def update_user(self, user_id: int, payload: UserUpdate) -> User:
        """Update existing user record."""
        user = self.repo.get_user_by_id(user_id)
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

        updates: Dict[str, Any] = {}
        if payload.name is not None:
            updates["name"] = payload.name.strip()
        if payload.userid is not None:
            clean_uid = payload.userid.strip()
            existing_uid = self.repo.get_user_by_userid(clean_uid)
            if existing_uid and existing_uid.id != user_id:
                raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Username already in use.")
            updates["userid"] = clean_uid
        if payload.email is not None:
            clean_email = payload.email.strip().lower()
            existing_email = self.repo.get_user_by_email(clean_email)
            if existing_email and existing_email.id != user_id:
                raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered.")
            updates["email"] = clean_email
        if payload.password is not None and payload.password.strip():
            updates["password_hash"] = hash_password(payload.password.strip())
        if payload.role is not None:
            updates["role"] = payload.role
        if payload.sub_role is not None:
            updates["sub_role"] = payload.sub_role
        if payload.team is not None:
            updates["team"] = payload.team
        if payload.is_team_head is not None:
            updates["is_team_head"] = payload.is_team_head
        if payload.plant_code is not None:
            updates["plant_code"] = payload.plant_code
        if payload.is_active is not None:
            updates["is_active"] = payload.is_active

        return self.repo.update_user(user, updates)

    def delete_user(self, user_id: int) -> bool:
        """Delete user account."""
        user = self.repo.get_user_by_id(user_id)
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")
        return self.repo.delete_user(user_id)

    # ---------------------------------------------------------
    # Product Categories Merchandising Taxonomy
    # ---------------------------------------------------------
    def get_product_categories(self) -> Dict[str, Any]:
        """Return structured product category, sub-category, and third-category taxonomy hierarchy."""
        from app.models.sample_request import CreateSampleRequest
        rows = (
            self.repo.db.query(
                CreateSampleRequest.product_category,
                CreateSampleRequest.product_sub_category,
                CreateSampleRequest.product_third_category,
            )
            .filter(CreateSampleRequest.product_category.isnot(None))
            .distinct()
            .order_by(
                CreateSampleRequest.product_category.asc(),
                CreateSampleRequest.product_sub_category.asc(),
                CreateSampleRequest.product_third_category.asc(),
            )
            .all()
        )

        categories_map: Dict[str, Dict[str, set]] = {}
        for cat, sub, third in rows:
            c = (cat or "").strip()
            if not c:
                continue
            if c not in categories_map:
                categories_map[c] = {}
            s = (sub or "").strip()
            if s:
                if s not in categories_map[c]:
                    categories_map[c][s] = set()
                t = (third or "").strip()
                if t:
                    categories_map[c][s].add(t)

        result_categories = []
        for cat_name, sub_dict in categories_map.items():
            subs = []
            for sub_name, thirds_set in sub_dict.items():
                subs.append({
                    "name": sub_name,
                    "third_categories": sorted(list(thirds_set)),
                })
            result_categories.append({
                "name": cat_name,
                "subcategories": sorted(subs, key=lambda x: x["name"]),
            })

        return {
            "categories": sorted(result_categories, key=lambda x: x["name"]),
            "flat_categories": sorted(list(categories_map.keys())),
        }

