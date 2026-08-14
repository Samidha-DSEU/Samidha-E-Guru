import asyncio
from pymongo import MongoClient
import os
from dotenv import load_dotenv

load_dotenv("d:/CODING/SAMIDHA/Samidha-E-Guru/services/learn_ai_microservice/.env")
MONGO_URI = os.getenv("MONGO_URI", "mongodb+srv://samidha_user:samidha123@cluster0.mongodb.net/samidha_ai_db")

client = MongoClient(MONGO_URI)
db = client.get_database()

# Check ai_documents
docs = list(db.ai_documents.find().sort("_id", -1).limit(5))
print(f"--- Recent AI Documents ({len(docs)}) ---")
for d in docs:
    print(f"ID: {d.get('resource_id')}, Status: {d.get('status')}, Title: {d.get('title')}")

# Check ai_workspace_caches
caches = list(db.ai_workspace_caches.find().sort("_id", -1).limit(5))
print(f"\n--- Recent AI Workspace Caches ({len(caches)}) ---")
for c in caches:
    print(f"Resource: {c.get('resource_id')}, Title: {c.get('resource_title')}")
