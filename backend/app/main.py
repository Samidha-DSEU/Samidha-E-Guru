from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError

from app.core.config import settings
from app.schemas.common import StandardResponse, ErrorDetail
from app.api.v1.router import api_v1_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Configuration
if settings.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.BACKEND_CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )


# Exception Handlers enforcing unified JSON response schema
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = []
    for err in exc.errors():
        field = " -> ".join([str(loc) for loc in err["loc"] if loc != "body"])
        errors.append(ErrorDetail(field=field, message=err["msg"]))
    
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content=StandardResponse.error_response(
            message="Request validation failed.",
            errors=errors
        ).model_dump()
    )


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content=StandardResponse.error_response(
            message=str(exc) if settings.ENVIRONMENT == "development" else "Internal server error occurred.",
            errors=[ErrorDetail(field="server", message=str(exc))]
        ).model_dump()
    )


# Health Check Endpoint
@app.get("/health", tags=["Health"])
async def health_check():
    return StandardResponse.success_response(
        data={"status": "healthy", "environment": settings.ENVIRONMENT},
        message="SAMIDHA E-GURU API is running."
    )


# Mount API V1 Router
app.include_router(api_v1_router, prefix=settings.API_V1_STR)
