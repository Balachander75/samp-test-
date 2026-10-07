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


def ensure_design_workflow_columns():
    """Add fields for Creative submissions and Marketing decisions to existing databases."""
    statements = (
        "ALTER TABLE design_requests ADD COLUMN IF NOT EXISTS design_remarks TEXT",
        "ALTER TABLE design_requests ADD COLUMN IF NOT EXISTS reference_images JSONB NOT NULL DEFAULT '[]'::jsonb",
        "ALTER TABLE design_requests ADD COLUMN IF NOT EXISTS reference_links JSONB NOT NULL DEFAULT '[]'::jsonb",
        "ALTER TABLE design_requests ADD COLUMN IF NOT EXISTS creative_submissions JSONB NOT NULL DEFAULT '[]'::jsonb",
        "ALTER TABLE design_requests ADD COLUMN IF NOT EXISTS marketing_decision VARCHAR(40)",
        "ALTER TABLE design_requests ADD COLUMN IF NOT EXISTS remaining_design_count INTEGER NOT NULL DEFAULT 0",
    )
    with engine.begin() as connection:
        for statement in statements:
            connection.execute(text(statement))
