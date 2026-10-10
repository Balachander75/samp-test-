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
        created_by: Optional[str] = None,
        skip: int = 0,
        limit: Optional[int] = None,
    ) -> List[CreateSampleRequest]:
        """Query sample requests with optional business year, customer, status, and created_by filters."""
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

        if created_by and created_by.strip():
            query = query.filter(CreateSampleRequest.created_by.ilike(f"%{created_by.strip()}%"))

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
        binding1: Optional[str] = None,
        binding2: Optional[str] = None,
        category: Optional[str] = None,
        sub_category: Optional[str] = None,
        third_category: Optional[str] = None,
        limit: Optional[int] = None,
    ) -> List[CreateSampleRequest]:
        """Find saved products filtered by category taxonomy and/or binding characteristics."""
        def normalized_sql(column):
            return func.regexp_replace(
                func.lower(func.coalesce(column, "")),
                "[^a-z0-9]+",
                "",
                "g",
            )

        def normalized_value(value: str) -> str:
            return re.sub(r"[^a-z0-9]+", "", str(value or "").casefold())

        query = self.db.query(CreateSampleRequest).options(*self._eager_options())

        # Taxonomy filters
        if category and category.strip():
            query = query.filter(normalized_sql(CreateSampleRequest.product_category) == normalized_value(category))
        if sub_category and sub_category.strip():
            query = query.filter(normalized_sql(CreateSampleRequest.product_sub_category) == normalized_value(sub_category))
        if third_category and third_category.strip():
            query = query.filter(normalized_sql(CreateSampleRequest.product_third_category) == normalized_value(third_category))

        # Binding 1 filter
        if binding1 and binding1.strip():
            normalized_binding1 = normalized_value(binding1)
            binding1_detail = aliased(ProductDetail)
            binding1_name = normalized_sql(binding1_detail.characteristic_name)
            binding1_detail_match = and_(
                normalized_sql(binding1_detail.class_name) == "nbbinding",
                binding1_name.in_(("bindingtype1", "binding1")),
                normalized_sql(binding1_detail.value) == normalized_binding1,
            )
            query = query.join(
                binding1_detail, binding1_detail.sample_request_id == CreateSampleRequest.id
            ).filter(binding1_detail_match)

        # Binding 2 filter
        if binding2 and binding2.strip():
            normalized_binding2 = normalized_value(binding2)
            binding2_detail = aliased(ProductDetail)
            binding2_name = normalized_sql(binding2_detail.characteristic_name)
            binding2_detail_match = and_(
                normalized_sql(binding2_detail.class_name) == "nbbinding",
                binding2_name.in_(("bindingtype2", "binding2")),
                normalized_sql(binding2_detail.value) == normalized_binding2,
            )
            query = query.join(
                binding2_detail, binding2_detail.sample_request_id == CreateSampleRequest.id
            ).filter(binding2_detail_match)

        # If no filter at all provided, return empty list
        if not (
            (binding1 and binding1.strip())
            or (binding2 and binding2.strip())
            or (category and category.strip())
            or (sub_category and sub_category.strip())
            or (third_category and third_category.strip())
        ):
            return []

        query = query.distinct().order_by(CreateSampleRequest.id.desc())
        if limit is not None and limit > 0:
            query = query.limit(limit)
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
