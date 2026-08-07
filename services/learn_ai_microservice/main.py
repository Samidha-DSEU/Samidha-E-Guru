import os
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config import settings
from api.v1.router import router as learn_ai_router
from db.mongo import get_mongo_db

app = FastAPI(
    title="SAMIDHA Learn AI Microservice",
    description="Dedicated microservice for RAG PDF ingestion, MongoDB Atlas Vector Search, and LLM Workspace generation.",
    version="1.0.0"
)

# CORS Setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(learn_ai_router)

@app.get("/")
def root():
    return {
        "service": settings.SERVICE_NAME,
        "status": "online",
        "database": "MongoDB Atlas",
        "version": "1.0.0"
    }

@app.on_event("startup")
def startup_db_check():
    """Initialize MongoDB connection on microservice boot."""
    try:
        get_mongo_db()
    except Exception as e:
        print(f"MongoDB connection warning on startup: {e}")

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=settings.PORT, reload=True)
