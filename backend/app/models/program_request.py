"""Database models for Seasonal Program Planning and Material Specification Matrix."""

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class ProgramRequest(Base):
    """
    Seasonal Program Planning Request raised by Marketing for SAMP execution.
    Contains customer name, target plant, program campaign title, and program year.
    Does NOT contain target required date per operational specifications.
    """

    __tablename__ = "program_requests"

    id = Column(Integer, primary_key=True, index=True)
    request_code = Column(String(32), nullable=False, unique=True, index=True)
    sr_number = Column(String(32), nullable=False, unique=True, index=True)

    customer_name = Column(String(255), nullable=False, index=True)
    target_plant = Column(String(255), nullable=False)
    program_campaign_title = Column(String(255), nullable=False)
    program_year = Column(String(50), nullable=False, default="2026-2027", server_default="2026-2027")

    status = Column(String(64), nullable=False, default="Pending SAMP Review", server_default="Pending SAMP Review")
    created_by = Column(String(255), nullable=True)

    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())

    # Material Specification Matrix rows
    materials = relationship(
        "ProgramMaterialSpecification",
        back_populates="program_request",
        cascade="all, delete-orphan",
        order_by="ProgramMaterialSpecification.id",
    )


class ProgramMaterialSpecification(Base):
    """
    Individual row in the Material Specification Matrix for a Program Planning request.
    All fields are optional, allowing operators to enter any subset of fields.
    Includes `samp_remark` for SAMP lab team to add/update remarks in view mode.
    """

    __tablename__ = "program_material_specifications"

    id = Column(Integer, primary_key=True, index=True)
    program_request_id = Column(
        Integer,
        ForeignKey("program_requests.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    material_type = Column(String(255), nullable=True)
    supplier_name = Column(String(255), nullable=True)
    grade = Column(String(255), nullable=True)
    color_variant = Column(String(255), nullable=True)
    caliper_wt = Column(String(255), nullable=True)
    quantity = Column(String(100), nullable=True)
    unit = Column(String(50), nullable=True, default="pcs", server_default="pcs")
    remark = Column(Text, nullable=True)

    # SAMP team evaluation remark (populated during view mode review)
    samp_remark = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())

    program_request = relationship("ProgramRequest", back_populates="materials")
