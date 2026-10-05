"""
Sample Request Repository.
Handles all database operations for the `create_sample_requests` entity.
"""
from typing import Optional, List, Dict, Any, Tuple
from sqlalchemy.orm import Session, aliased
from sqlalchemy import func, or_, and_
from app.repositories.base import BaseRepository
from app.models.sample_request import CreateSampleRequest, ProductDetail


class SampleRequestRepository(BaseRepository[CreateSampleRequest]):
    """Repository dedicated to sample requests persistence."""

    def __init__(self, db: Session):
        super().__init__(CreateSampleRequest, db)

    def get_by_sr_number(self, sr_number: str) -> Optional[CreateSampleRequest]:
        """Fetch request by SR number."""
        return (
            self.db.query(CreateSampleRequest)
            .filter(CreateSampleRequest.sr_number == sr_number)
            .first()
        )

    def list_by_filters(
        self,
        year: Optional[str] = None,
        customer: Optional[str] = None,
        status: Optional[str] = None,
        skip: int = 0,
        limit: Optional[int] = None,
    ) -> List[CreateSampleRequest]:
        """Query sample requests with optional business year, customer, and status filters."""
        query = self.db.query(CreateSampleRequest)

        if year and year.strip().upper() != "ALL":
            clean_year = year.strip()
            if "-" in clean_year and len(clean_year) == 9:
                first_yr, second_yr = clean_year.split("-")
                query = query.filter(
                    or_(
                        CreateSampleRequest.year == clean_year,
                        and_(
                            CreateSampleRequest.year == second_yr,
                            CreateSampleRequest.date_request_created.like(f"{first_yr}%"),
                        ),
                    )
                )
            else:
                query = query.filter(CreateSampleRequest.year == clean_year)

        if customer and customer.strip():
            query = query.filter(CreateSampleRequest.customer.ilike(f"%{customer.strip()}%"))

        if status and status.strip():
            query = query.filter(CreateSampleRequest.status == status.strip())

        query = query.order_by(CreateSampleRequest.id.desc())

        if skip > 0:
            query = query.offset(skip)
        if limit is not None:
            query = query.limit(limit)

        return query.all()

    def get_business_year_counts(self) -> List[Tuple[Optional[str], int]]:
        """Return distinct years and aggregate counts from the database."""
        return (
            self.db.query(CreateSampleRequest.year, func.count(CreateSampleRequest.id))
            .group_by(CreateSampleRequest.year)
            .all()
        )

    def search_materials(self, code: Optional[str] = None, limit: int = 50) -> List[CreateSampleRequest]:
        """Search products by material code or description."""
        query = self.db.query(CreateSampleRequest)
        if code and code.strip():
            c = f"%{code.strip()}%"
            query = query.filter(
                or_(
                    CreateSampleRequest.material_code.ilike(c),
                    CreateSampleRequest.product_description.ilike(c),
                    CreateSampleRequest.customer.ilike(c),
                )
            )
        return query.order_by(CreateSampleRequest.id.desc()).limit(limit).all()

    def search_by_binding(
        self,
        binding1: str,
        binding2: Optional[str] = None,
        limit: int = 50,
    ) -> List[CreateSampleRequest]:
        """Find saved products whose EAV binding characteristics match the filters."""
        binding1_detail = aliased(ProductDetail)
        binding1_name = func.upper(
            func.replace(func.replace(func.replace(binding1_detail.characteristic_name, " ", ""), "_", ""), "-", "")
        )
        query = (
            self.db.query(CreateSampleRequest)
            .join(binding1_detail, binding1_detail.sample_request_id == CreateSampleRequest.id)
            .filter(binding1_name.in_(("BINDINGTYPE1", "BINDING1")))
            .filter(func.lower(func.trim(binding1_detail.value)) == binding1.strip().lower())
        )

        if binding2 and binding2.strip():
            binding2_detail = aliased(ProductDetail)
            binding2_name = func.upper(
                func.replace(func.replace(func.replace(binding2_detail.characteristic_name, " ", ""), "_", ""), "-", "")
            )
            query = (
                query.join(binding2_detail, binding2_detail.sample_request_id == CreateSampleRequest.id)
                .filter(binding2_name.in_(("BINDINGTYPE2", "BINDING2")))
                .filter(func.lower(func.trim(binding2_detail.value)) == binding2.strip().lower())
            )

        return (
            query.distinct()
            .order_by(CreateSampleRequest.id.desc())
            .limit(max(1, min(limit, 100)))
            .all()
        )

    def batch_update_status(self, ids: List[int], status: str) -> int:
        """Batch update status on multiple requests in a single transaction."""
        updated = (
            self.db.query(CreateSampleRequest)
            .filter(CreateSampleRequest.id.in_(ids))
            .update({CreateSampleRequest.status: status}, synchronize_session=False)
        )
        self.db.commit()
        return updated

    def total_count(self) -> int:
        """Return total count of sample requests."""
        return self.db.query(CreateSampleRequest).count()
