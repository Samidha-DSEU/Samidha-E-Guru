from fastapi import APIRouter
from app.api.v1 import auth, education, resources, community, events, communications, admin

api_v1_router = APIRouter()

api_v1_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_v1_router.include_router(education.router, prefix="/education", tags=["Education Hierarchy"])
api_v1_router.include_router(resources.router, prefix="/resources", tags=["Resources"])
api_v1_router.include_router(community.router, prefix="/community", tags=["Community & Mentorship"])
api_v1_router.include_router(events.router, prefix="/events", tags=["Events"])
api_v1_router.include_router(communications.router, prefix="/communications", tags=["Communications"])
api_v1_router.include_router(admin.router, prefix="/admin", tags=["Administration"])
