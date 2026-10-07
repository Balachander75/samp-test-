"""
Sample Request Repository.
Handles all database operations for the `create_sample_requests` entity.
"""
from typing import Optional, List, Dict, Any, Tuple
import re
from sqlalchemy.orm import Session, aliased, selectinload
from sqlalchemy import func, or_, and_
from app.repositories.base import BaseRepository
from app.models.sample_request import CreateSampleRequest, ProductDetail


class SampleRequestRepository(BaseRepository[CreateSampleRequest]):
    """Repository dedicated to sample requests persistence."""

    def __init__(self, db: Session):
        super().__init__(CreateSampleRequest, db)

    @staticmethod
    def _eager_options():
        """Eagerly load relationships in batch to completely eliminate N+1 round trips."""
        return (
            selectinload(CreateSampleRequest.request_type_audit),
            selectinload(CreateSampleRequest.product_details),
        )

    def get_by_id(self, id: Any) -> Optional[CreateSampleRequest]:
        """Fetch request by primary key with eager-loaded relationships."""
        return (
            self.db.query(CreateSampleRequest)
            .options(*self._eager_options())
            .filter(CreateSampleRequest.id == id)
            .first()
        )

    def get_by_sr_number(self, sr_number: str) -> Optional[CreateSampleRequest]:
        """Fetch request by SR number."""
        return (
            self.db.query(CreateSampleRequest)
            .options(*self._eager_options())
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
        query = self.db.query(CreateSampleRequest).options(*self._eager_options())

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
        query = self.db.query(CreateSampleRequest).options(*self._eager_options())
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
        limit: Optional[int] = None,
    ) -> List[CreateSampleRequest]:
        """Find saved products whose EAV binding characteristics match the filters."""
        def normalized_sql(column):
            return func.regexp_replace(
                func.lower(func.coalesce(column, "")),
                "[^a-z0-9]+",
                "",
                "g",
            )

        def normalized_value(value: str) -> str:
            return re.sub(r"[^a-z0-9]+", "", str(value or "").casefold())

        normalized_binding1 = normalized_value(binding1)
        if not normalized_binding1:
            return []

        binding1_detail = aliased(ProductDetail)
        binding1_name = normalized_sql(binding1_detail.characteristic_name)
        binding1_detail_match = and_(
            binding1_name.in_(("bindingtype1", "binding1")),
            normalized_sql(binding1_detail.value) == normalized_binding1,
        )
        # Existing catalog records predate the normalized ProductDetail binding
        # rows. Their binding is often present in the product description instead.
        legacy_description_match = normalized_sql(
            CreateSampleRequest.product_description
        ).like(f"%{normalized_binding1}%")
        query = (
            self.db.query(CreateSampleRequest)
            .outerjoin(binding1_detail, binding1_detail.sample_request_id == CreateSampleRequest.id)
            .filter(or_(binding1_detail_match, legacy_description_match))
        )

        if binding2 and binding2.strip():
            normalized_binding2 = normalized_value(binding2)
            binding2_detail = aliased(ProductDetail)
            binding2_name = normalized_sql(binding2_detail.characteristic_name)
            query = (
                query.join(binding2_detail, binding2_detail.sample_request_id == CreateSampleRequest.id)
                .filter(binding2_name.in_(("bindingtype2", "binding2")))
                .filter(normalized_sql(binding2_detail.value) == normalized_binding2)
            )

        query = query.distinct().order_by(CreateSampleRequest.id.desc())
        if limit is not None:
            query = query.limit(max(1, min(limit, 1000)))
        return query.all()

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
