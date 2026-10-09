"""Reference and identity data models for the Navneet SAMP ERP."""
from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.sql import func
from app.database import Base


class User(Base):
    """
    Enterprise User Account.

    Columns:
        id            - Auto-increment primary key
        name          - Full display name (e.g. "Parin D")
        userid        - Unique login handle / username (e.g. "Admin")
        email         - Unique corporate email
        password_hash - Bcrypt-hashed password (never plaintext)
        role          - Top-level role: "admin" | "user" | "manager"
        sub_role      - Department-level role label (e.g. "Sampling Lead")
        is_active     - Soft-delete / account enabled flag
        created_at    - UTC timestamp of account creation
        updated_at    - UTC timestamp of last modification
    """
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    userid = Column(String(100), nullable=False, unique=True, index=True)
    email = Column(String(255), nullable=False, unique=True, index=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(50), default="user", nullable=False)
    sub_role = Column(String(100), nullable=True)
    team = Column(String(100), nullable=True, index=True)
    is_team_head = Column(Boolean, default=False, nullable=False)
    plant_code = Column(String(50), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class Customer(Base):
    """Customer master copied from the legacy samp_eco_db database."""

    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    country = Column(String(100), nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())


class Plant(Base):
    """Manufacturing plant master used by request intake and routing."""

    __tablename__ = "plants"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), nullable=False, unique=True, index=True)
    name = Column(String(255), nullable=False)
    location = Column(String(255), nullable=True)
    is_active = Column(Boolean, nullable=False, default=True, server_default="true")
    created_by = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())


class RefreshToken(Base):
    """
    Persisted refresh tokens for session rotation and instantaneous revocation.
    """
    __tablename__ = "refresh_tokens"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True, nullable=False)
    token_hash = Column(String(255), unique=True, index=True, nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    is_revoked = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class LoginAuditLog(Base):
    """
    Security Telemetry: records all authentication events (success/failure/blocked)
    for enterprise auditability and compliance.
    """
    __tablename__ = "login_audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=True, index=True)
    identifier = Column(String(255), nullable=False, index=True)
    ip_address = Column(String(100), nullable=True)
    user_agent = Column(String(500), nullable=True)
    status = Column(String(50), nullable=False, index=True)  # SUCCESS, FAILED_CREDENTIALS, FAILED_RATE_LIMITED, FAILED_DEACTIVATED
    failure_reason = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

