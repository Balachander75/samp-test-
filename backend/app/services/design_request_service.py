"""
Creative Design Request Service.
Encapsulates business operations for Creative Design Requests, artwork variant counts,
and workflow status transitions.
"""
from typing import Any, Dict, List, Optional
from sqlalchemy.orm import Session
from app.repositories.design_request_repo import DesignRequestRepository


class DesignRequestService:
    """Application service for Creative Design Requests."""

    def __init__(self, db: Session):
        self.db = db
        self.repo = DesignRequestRepository(db)

    def list_all(self) -> List[Dict[str, Any]]:
        """List all design requests."""
        return self.repo.list_all_records()

    def get_by_id(self, item_id: int) -> Optional[Dict[str, Any]]:
        """Fetch design request by ID."""
        return self.repo.get_record_by_id(item_id)

    def create(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new creative design request."""
        return self.repo.create_record(data)

    def update(self, item_id: int, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Update creative design request fields."""
        return self.repo.update_record(item_id, updates)

    def delete(self, item_id: int) -> bool:
        """Delete creative design request."""
        return self.repo.delete_record(item_id)

    def sync_sample_request(self, sample_req: Dict[str, Any], is_delete: bool = False):
        """Sync design request from sample request creation/deletion."""
        self.repo.sync_sample_request_design(sample_req, is_delete=is_delete)
