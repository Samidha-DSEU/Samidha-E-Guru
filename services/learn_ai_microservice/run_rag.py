import asyncio
from pymongo import MongoClient
import os
import json
from dotenv import load_dotenv
import httpx

load_dotenv()

from services.rag_service import RAGService
from services.pdf_service import PDFIngestionService
from api.v1.router import fetch_resource_details_async

async def run_full_pipeline():
    # Setup DB
    client = MongoClient(os.getenv("MONGO_URI"))
    db = client[os.getenv("MONGODB_DB_NAME", "samidha_ai_db")]

    resource_id = "348fe8aa-e980-4816-97e4-1cc9c077cdea"
    question = "What is this chapter about?"

    print(f"Step 1: Fetching resource details...")
    title, pdf_url = await fetch_resource_details_async(resource_id)
    print(f"Title: {title}\nURL: {pdf_url}")

    print(f"\nStep 2: Ingesting PDF into chunks (simulating /initialize)...")
    if pdf_url:
        pdf_bytes = await PDFIngestionService.download_pdf(pdf_url)
        await PDFIngestionService.ingest_resource_pdf(db, resource_id, pdf_url, pdf_bytes)
    
    print("\nStep 3: Executing RAG query with Groq...")
    try:
        result = RAGService.solve_doubt(db, resource_id, question)
        print("\nSUCCESS! Here is the JSON output from Groq:\n")
        print(json.dumps(result, indent=2))
    except Exception as e:
        print(f"\nERROR: {e}")

if __name__ == "__main__":
    asyncio.run(run_full_pipeline())
