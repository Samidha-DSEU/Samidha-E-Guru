import logging
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, RedirectResponse

from app.core.config import settings
from app.api.v1.router import api_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
from app.db.session import engine, ensure_schema_migrations
import app.models
from app.db.session import Base

logger = logging.getLogger("samidha")

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Backend API for SAMIDHA E-GURU SaaS Educational Platform",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

@app.on_event("startup")
def startup_db_migrations():
    logger.info("Running database schema creation & auto-migrations...")
    ensure_schema_migrations(engine)
    Base.metadata.create_all(bind=engine)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Root endpoint redirects to interactive Swagger API documentation
@app.get("/", include_in_schema=False)
def root():
    return RedirectResponse(url="/docs")

# Health Check Endpoint
@app.get("/health", tags=["System"])
def health_check():
    return {
        "success": True,
        "message": "SAMIDHA E-GURU Backend Service is healthy",
        "data": {
            "status": "healthy",
            "environment": settings.ENVIRONMENT,
            "version": "1.0.0"
        }
    }

# Include API V1 Routers
app.include_router(api_router, prefix="/api/v1")

# Global Exception Handlers
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception on {request.url}: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "message": "An unexpected internal server error occurred.",
            "data": None,
            "meta": None,
            "errors": [{"code": "INTERNAL_SERVER_ERROR", "detail": str(exc)}]
        }
    )
