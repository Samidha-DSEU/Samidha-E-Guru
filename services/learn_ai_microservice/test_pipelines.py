import asyncio
import os
import json
import httpx
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

from services.chatpdf_service import ChatPdfService
from services.pdf_service import PDFIngestionService
from services.rag_service import RAGService

async def main():
    pdf_url = "https://drive.google.com/file/d/1ZYnlqymRcUEgaZGbm9PQOSP6jkmQiA6A/view?usp=sharing"
    question = "What is the main mathematical topic discussed in this chapter? Explain it simply."
    resource_id = "test-class9-maths"
    
    print("========================================")
    print("========================================")
    print("PIPELINE 1: TESTING CHATPDF API")
    print("========================================")
    
    chatpdf = ChatPdfService(os.getenv("CHATPDF_API_KEY"))
    source_id = "src_d3pWBi9orkHZR5M8njmGO"
    
    print(f"Using existing ChatPDF Source ID: {source_id}")
    print(f"Asking ChatPDF: '{question}'...")
    
    # chatpdf_response = await chatpdf.query_document(source_id, question)
    # print("\nCHATPDF RESPONSE:")
    # print(json.dumps(chatpdf_response, indent=2))

    print("\n\n========================================")
    print("PIPELINE 2: TESTING MONGODB RAG FALLBACK")
    print("========================================")
    
    client = MongoClient(os.getenv("MONGO_URI"))
    db = client[os.getenv("MONGODB_DB_NAME", "samidha_ai_db")]
    
    print(f"Downloading & Chunking Google Drive PDF for MongoDB...")
    pdf_bytes = await PDFIngestionService.download_pdf(pdf_url)
    
    print(f"Ingesting into Vector Store (This may take ~30s locally for embeddings)...")
    await PDFIngestionService.ingest_resource_pdf(db, resource_id, pdf_url, pdf_bytes)
    print("Ingestion complete!")
    
    print(f"Asking MongoDB RAG (Groq LLM): '{question}'...")
    try:
        rag_response = RAGService.solve_doubt(db, resource_id, question)
        print("\nMONGODB RAG RESPONSE:")
        print(json.dumps(rag_response, indent=2))
    except Exception as e:
        print(f"RAG Error: {e}")

if __name__ == "__main__":
    asyncio.run(main())
