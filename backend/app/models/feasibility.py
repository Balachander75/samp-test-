"""Database model for marketing feasibility-check requests and activity logs."""

from sqlalchemy import Boolean, Column, Date, DateTime, ForeignKey, Integer, JSON, LargeBinary, String, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class FeasibilityRequest(Base):
    """A feasibility request raised by Marketing for SAMP review."""

    __tablename__ = "feasibility_requests"

    id = Column(Integer, primary_key=True, index=True)
    request_code = Column(String(32), nullable=False, unique=True, index=True)
    sr_number = Column(String(32), nullable=False, unique=True, index=True)

    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False, index=True)

    feasibility_type = Column(String(64), nullable=False)
    custom_feasibility_type = Column(String(255), nullable=True)
    description_notes = Column(Text, nullable=False)
    required_date = Column(Date, nullable=False)
    marketing_remarks = Column(Text, nullable=True)

    reference_images = Column(JSON, nullable=False, default=list, server_default="[]")
    reference_links = Column(JSON, nullable=False, default=list, server_default="[]")

    status = Column(String(64), nullable=False, default="Pending Feasibility", server_default="Pending Feasibility")
    created_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_by = Column(String(255), nullable=True)
    request_created_by = Column(String(255), nullable=True)
    request_raised_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())

    # Sampling Lab response fields
    taken_by_samp = Column(String(255), nullable=True)
    taken_at_samp = Column(DateTime(timezone=True), nullable=True)
    sampling_feasibility_response = Column(String(32), nullable=True)
    sampling_feasibility_remark = Column(Text, nullable=True)
    sampling_feasibility_approved_by = Column(String(255), nullable=True)
    feasibility_closed_at = Column(DateTime(timezone=True), nullable=True)
    feasibility_closed_by = Column(String(32), nullable=True)
    is_responded_on_time = Column(Boolean, nullable=True)

    # Marketing final decision fields
    marketing_decision = Column(String(32), nullable=True)  # "Accepted" | "Rejected"
    marketing_decision_by = Column(String(255), nullable=True)
    marketing_decision_at = Column(DateTime(timezone=True), nullable=True)
    marketing_decision_remark = Column(Text, nullable=True)

    # Sampling request conversion fields
    converted_sample_request_id = Column(Integer, nullable=True)
    converted_sr_number = Column(String(50), nullable=True)
    converted_at = Column(DateTime(timezone=True), nullable=True)
    converted_by = Column(String(255), nullable=True)

    customer = relationship("Customer")
    activities = relationship(
        "FeasibilityActivityLog",
        back_populates="feasibility_request",
        cascade="all, delete-orphan",
        order_by="FeasibilityActivityLog.id.asc()",
    )
    reference_image_records = relationship(
        "FeasibilityReferenceImage",
        back_populates="feasibility_request",
        cascade="all, delete-orphan",
        order_by="FeasibilityReferenceImage.sort_order.asc()",
    )


class FeasibilityActivityLog(Base):
    """Immutable audit trail for feasibility request events and communications."""

    __tablename__ = "feasibility_activity_logs"

    id = Column(Integer, primary_key=True, index=True)
    feasibility_request_id = Column(
        Integer,
        ForeignKey("feasibility_requests.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    actor_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    actor_name = Column(String(255), nullable=False)
    actor_department = Column(String(100), nullable=False)  # "Marketing", "SAMP Lab", "System"
    action = Column(String(64), nullable=False)  # "CREATED", "VIEWED", "SAMP_EVALUATED", "MARKETING_DECIDED"
    payload = Column(JSON, nullable=False, default=dict, server_default="{}")
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    feasibility_request = relationship("FeasibilityRequest", back_populates="activities")


class FeasibilityReferenceImage(Base):
    """Compressed reference image bytes stored in the database."""

    __tablename__ = "feasibility_reference_images"

    id = Column(Integer, primary_key=True, index=True)
    feasibility_request_id = Column(
        Integer,
        ForeignKey("feasibility_requests.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    original_name = Column(String(255), nullable=False, default="Reference image")
    content_type = Column(String(64), nullable=False)
    image_data = Column(LargeBinary, nullable=False)
    sort_order = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    feasibility_request = relationship(
        "FeasibilityRequest", back_populates="reference_image_records"
    )
