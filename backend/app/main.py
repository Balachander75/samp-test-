"""
Navneet SAMP ERP — FastAPI Application Entry Point

Startup sequence:
1. Auto-create any new DB tables (SQLAlchemy DDL — idempotent)
2. Mount CORS middleware (strict allowlist)
3. Register all routers
"""
import logging
import re
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
from datetime import datetime, timezone

from app.config import settings
from app.database import engine, Base, ensure_design_workflow_columns
from app.routers import auth, feasibility, master, program_requests, sample_requests

logger = logging.getLogger("uvicorn.error")


# ---------------------------------------------------------------------------
# Application Lifespan
# ---------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Run startup tasks before serving requests."""
    # Auto-create any new DB tables (idempotent, safe to run on every restart)
    Base.metadata.create_all(bind=engine)
    ensure_design_workflow_columns()
    logger.info("[Startup] ✓ Database tables verified / created.")
    yield


# ---------------------------------------------------------------------------
# FastAPI App
# ---------------------------------------------------------------------------

app = FastAPI(
    title=settings.APP_NAME,
    description=(
        "Enterprise Packaging & Sampling Workflow API for Navneet Education Ltd. "
        "Authentication and reference master data are live. Operational modules are being rebuilt from scratch."
    ),
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)



# ---------------------------------------------------------------------------
# Global Exception Handler
# ---------------------------------------------------------------------------

@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    """Catch-all handler so unhandled errors always return structured JSON without leaking traces."""
    logger.error("Unhandled Exception on %s %s: %s", request.method, request.url.path, exc, exc_info=True)
    origin = request.headers.get("origin")
    cors_headers = {}
    if origin and (
        origin in settings.CORS_ORIGINS
        or re.fullmatch(r"https?://(localhost|127\.0\.0\.1)(:\d+)?", origin)
    ):
        # Unhandled exceptions are converted by Starlette's outer server-error
        # middleware, outside CORSMiddleware. Preserve CORS so clients can read
        # the structured 500 response instead of reporting a misleading fetch error.
        cors_headers = {
            "Access-Control-Allow-Origin": origin,
            "Access-Control-Allow-Credentials": "true",
            "Vary": "Origin",
        }
    return JSONResponse(
        status_code=500,
        headers=cors_headers,
        content={
            "success": False,
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": "An unexpected error occurred. Please try again or contact support.",
            },
        },
    )


# ---------------------------------------------------------------------------
# CORS Middleware
# ---------------------------------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS if settings.CORS_ORIGINS else ["http://localhost:5173"],
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(GZipMiddleware, minimum_size=1000)


# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------

app.include_router(auth.router)
app.include_router(master.router)
app.include_router(feasibility.router)
app.include_router(program_requests.router)
app.include_router(sample_requests.router)


# ---------------------------------------------------------------------------
# Health Endpoints
# ---------------------------------------------------------------------------

@app.get("/", tags=["Health"], summary="API root")
def root():
    return {
        "status": "online",
        "app": settings.APP_NAME,
        "version": "1.0.0",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "auth": "live",
        "other_modules": "rebuilding from scratch",
    }


@app.get("/health", tags=["Health"], summary="Lightweight health ping")
def health():
    return {"status": "healthy"}
