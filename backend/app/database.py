from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker
from app.config import settings

engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
    pool_size=25,
    max_overflow=35,
    pool_recycle=1800,
    pool_timeout=10,
    pool_use_lifo=True,
    connect_args={
        "connect_timeout": 5,
        "keepalives": 1,
        "keepalives_idle": 30,
        "keepalives_interval": 10,
        "keepalives_count": 5,
    },
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def ensure_user_team_columns():
    """Bring older users tables up to the team fields used by the current User model."""
    statements = (
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS sub_role VARCHAR(100)",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS team VARCHAR(100)",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS is_team_head BOOLEAN NOT NULL DEFAULT FALSE",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS plant_code VARCHAR(50)",
        "CREATE INDEX IF NOT EXISTS ix_users_team ON users (team)",
    )
    with engine.begin() as connection:
        for statement in statements:
            connection.execute(text(statement))

def ensure_design_requests_table():
    """Create the durable design request table and align its ID sequence."""
    from app.models.sample_request import DesignRequest

    DesignRequest.__table__.create(bind=engine, checkfirst=True)
    with engine.begin() as connection:
        connection.execute(text(
            """SELECT setval(
                pg_get_serial_sequence('design_requests', 'id'),
                GREATEST(COALESCE((SELECT MAX(id) FROM design_requests), 0), 1),
                COALESCE((SELECT MAX(id) FROM design_requests), 0) > 0
            )"""
        ))


def ensure_design_workflow_columns():
    """Add fields for Creative submissions and Marketing decisions to existing databases."""
    statements = (
        "ALTER TABLE design_requests ADD COLUMN IF NOT EXISTS design_remarks TEXT",
        "ALTER TABLE design_requests ADD COLUMN IF NOT EXISTS reference_images JSONB NOT NULL DEFAULT '[]'::jsonb",
        "ALTER TABLE design_requests ADD COLUMN IF NOT EXISTS reference_links JSONB NOT NULL DEFAULT '[]'::jsonb",
        "ALTER TABLE design_requests ADD COLUMN IF NOT EXISTS creative_submissions JSONB NOT NULL DEFAULT '[]'::jsonb",
        "ALTER TABLE design_requests ADD COLUMN IF NOT EXISTS marketing_decision VARCHAR(40)",
        "ALTER TABLE design_requests ADD COLUMN IF NOT EXISTS remaining_design_count INTEGER NOT NULL DEFAULT 0",
        "ALTER TABLE design_requests ADD COLUMN IF NOT EXISTS workflow_state JSONB NOT NULL DEFAULT '{}'::jsonb",
    )
    with engine.begin() as connection:
        for statement in statements:
            connection.execute(text(statement))


def ensure_program_review_columns():
    """Add columns for dual review (Sampling & Plant) to program_requests."""
    statements = (
        "ALTER TABLE program_requests ADD COLUMN IF NOT EXISTS sampling_seen_at TIMESTAMPTZ",
        "ALTER TABLE program_requests ADD COLUMN IF NOT EXISTS sampling_seen_by VARCHAR(255)",
        "ALTER TABLE program_requests ADD COLUMN IF NOT EXISTS sampling_verdict VARCHAR(64)",
        "ALTER TABLE program_requests ADD COLUMN IF NOT EXISTS sampling_remark TEXT",
        "ALTER TABLE program_requests ADD COLUMN IF NOT EXISTS sampling_signed_at TIMESTAMPTZ",
        "ALTER TABLE program_requests ADD COLUMN IF NOT EXISTS sampling_signed_by VARCHAR(255)",
        "ALTER TABLE program_requests ADD COLUMN IF NOT EXISTS plant_seen_at TIMESTAMPTZ",
        "ALTER TABLE program_requests ADD COLUMN IF NOT EXISTS plant_seen_by VARCHAR(255)",
        "ALTER TABLE program_requests ADD COLUMN IF NOT EXISTS plant_verdict VARCHAR(64)",
        "ALTER TABLE program_requests ADD COLUMN IF NOT EXISTS plant_remark TEXT",
        "ALTER TABLE program_requests ADD COLUMN IF NOT EXISTS plant_signed_at TIMESTAMPTZ",
        "ALTER TABLE program_requests ADD COLUMN IF NOT EXISTS plant_signed_by VARCHAR(255)",
    )
    with engine.begin() as connection:
        for statement in statements:
            connection.execute(text(statement))


def ensure_product_category_columns():
    """Add product merchandising category columns to create_sample_requests table."""
    statements = (
        "ALTER TABLE create_sample_requests ADD COLUMN IF NOT EXISTS product_category VARCHAR(150)",
        "ALTER TABLE create_sample_requests ADD COLUMN IF NOT EXISTS product_sub_category VARCHAR(150)",
        "ALTER TABLE create_sample_requests ADD COLUMN IF NOT EXISTS product_third_category VARCHAR(150)",
        "CREATE INDEX IF NOT EXISTS ix_create_sample_requests_product_category ON create_sample_requests (product_category)",
        "CREATE INDEX IF NOT EXISTS ix_create_sample_requests_product_sub_category ON create_sample_requests (product_sub_category)",
    )
    with engine.begin() as connection:
        for statement in statements:
            connection.execute(text(statement))


def ensure_costing_detail_columns():
    """Add costing pack quantity to existing sample request databases."""
    statements = (
        "ALTER TABLE create_sample_requests ADD COLUMN IF NOT EXISTS qty_per_pack VARCHAR(50)",
        "ALTER TABLE create_sample_requests ADD COLUMN IF NOT EXISTS costing_required_date VARCHAR(50)",
        "ALTER TABLE create_sample_requests ADD COLUMN IF NOT EXISTS costing_counter_date VARCHAR(50)",
        "ALTER TABLE create_sample_requests ADD COLUMN IF NOT EXISTS costing_output_path TEXT",
    )
    with engine.begin() as connection:
        for statement in statements:
            connection.execute(text(statement))


def ensure_sample_reference_columns():
    """Persist reference moodboards and links on sample request records."""
    statements = (
        "ALTER TABLE create_sample_requests ADD COLUMN IF NOT EXISTS reference_images JSONB NOT NULL DEFAULT '[]'::jsonb",
        "ALTER TABLE create_sample_requests ADD COLUMN IF NOT EXISTS reference_links JSONB NOT NULL DEFAULT '[]'::jsonb",
    )
    with engine.begin() as connection:
        for statement in statements:
            connection.execute(text(statement))


def ensure_mockup_workflow_columns():
    """Persist Creative → Studio → Marketing mockup handoffs on sample requests."""
    with engine.begin() as connection:
        connection.execute(text(
            "ALTER TABLE create_sample_requests ADD COLUMN IF NOT EXISTS mockup_workflow_state JSONB NOT NULL DEFAULT '{}'::jsonb"
        ))


def ensure_sample_request_types_default():
    """Ensure all sample requests have request_types defaulted to ['sample']."""
    statement = """
        UPDATE create_sample_requests
        SET request_types = '["sample"]'::jsonb
        WHERE request_types IS NULL
           OR request_types = '{}'::jsonb
           OR request_types = '[]'::jsonb
           OR jsonb_typeof(request_types) != 'array'
           OR jsonb_array_length(CASE WHEN jsonb_typeof(request_types) = 'array' THEN request_types ELSE '[]'::jsonb END) = 0
    """
    with engine.begin() as connection:
        connection.execute(text(statement))

