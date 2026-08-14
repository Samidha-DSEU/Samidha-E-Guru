import hashlib
import logging
from typing import List, Dict, Any
import httpx
import fitz  # PyMuPDF
import pdfplumber
from pymongo.database import Database
from services.embedding_service import EmbeddingService

logger = logging.getLogger("learn_ai_pdf")

class PDFIngestionService:

    @staticmethod
    async def download_pdf(url: str) -> bytes:
        """Downloads PDF with desktop browser headers and NCERT referral headers."""
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
            "Accept": "application/pdf,text/html,application/xhtml+xml,application/xml;q=0.9,*/*",
            "Referer": "https://ncert.nic.in/textbook.php",
            "Accept-Language": "en-US,en;q=0.9"
        }
        try:
            async with httpx.AsyncClient(timeout=15.0, follow_redirects=True, headers=headers) as client:
                resp = await client.get(url)
                if resp.status_code == 200 and len(resp.content) > 1000:
                    return resp.content
        except Exception as e:
            logger.warning(f"Direct download from {url} failed: {e}. Trying Google Docs Proxy...")

        # Fallback 1: Google Docs PDF stream proxy
        proxy_url = f"https://docs.google.com/viewer?url={url}"
        try:
            async with httpx.AsyncClient(timeout=15.0, follow_redirects=True, headers=headers) as client:
                resp = await client.get(url)
                if resp.status_code == 200:
                    return resp.content
        except Exception:
            pass

        raise ValueError(f"Could not download PDF from {url}")

    @classmethod
    async def ingest_resource_pdf(cls, db: Database, resource_id: str, pdf_url: str, title: str) -> Dict[str, Any]:
        """
        Parses PDF, computes SHA-256 hash, extracts Markdown tables,
        generates SentenceTransformer vectors, and stores into MongoDB Atlas collections.
        If download fails, records status='failed' so future scraper jobs retry & replace with real chunks.
        """
        doc_coll = db["ai_documents"]
        chunks_coll = db["ai_chunks"]

        # 1. Download PDF bytes
        pdf_bytes = None
        try:
            pdf_bytes = await cls.download_pdf(pdf_url)
        except Exception as err:
            logger.error(f"Failed to download PDF for '{title}': {err}")
            # Mark document status as 'failed' so future runs WILL retry and replace
            doc_coll.update_one(
                {"resource_id": resource_id},
                {
                    "$set": {
                        "resource_id": resource_id,
                        "title": title,
                        "status": "failed",
                        "error_message": str(err),
                        "file_hash": None
                    }
                },
                upsert=True
            )
            return {"status": "failed", "reason": str(err), "chunks_created": 0}

        # 2. Compute Real SHA-256 Hash
        file_hash = hashlib.sha256(pdf_bytes).hexdigest()

        # 3. Check SHA-256 Deduplication (Only skip if document status is READY with matching real hash)
        existing_doc = doc_coll.find_one({"resource_id": resource_id})
        if existing_doc and existing_doc.get("status") == "ready" and existing_doc.get("file_hash") == file_hash:
            logger.info(f"PDF hash match for resource '{title}'. Reusing existing MongoDB chunks.")
            return {"status": "skipped", "reason": "hash_matched", "chunks_created": 0}

        # 3. PyMuPDF Page Text Extraction
        import gc
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        
        # Clear any prior chunks for this resource before we start batch inserting
        chunks_coll = db["ai_chunks"]
        chunks_coll.delete_many({"resource_id": resource_id})

        total_chunks_created = 0
        chunks_batch = []
        BATCH_SIZE = 50

        # Process each page sequentially to keep memory low
        for page_idx in range(len(doc)):
            page = doc[page_idx]
            raw_text = page.get_text("text").strip()
            
            # Help PyMuPDF release memory for this page
            del page
            
            if not raw_text:
                continue

            # Split by headings/paragraphs
            paragraphs = [p.strip() for p in raw_text.split("\n\n") if len(p.strip()) > 30]
            if not paragraphs:
                paragraphs = [raw_text]

            for p_idx, para in enumerate(paragraphs):
                embedding_vec = EmbeddingService.generate_embedding(para)
                chunks_batch.append({
                    "resource_id": resource_id,
                    "page_number": page_idx + 1,
                    "section_heading": f"Page {page_idx + 1} - Part {p_idx + 1}",
                    "content": para,
                    "embedding": embedding_vec
                })

                # Insert in batches of BATCH_SIZE
                if len(chunks_batch) >= BATCH_SIZE:
                    chunks_coll.insert_many(chunks_batch)
                    total_chunks_created += len(chunks_batch)
                    chunks_batch = []  # Clear the list from memory
                    gc.collect()       # Explicitly force garbage collection

        # Insert any remaining chunks
        if chunks_batch:
            chunks_coll.insert_many(chunks_batch)
            total_chunks_created += len(chunks_batch)
            chunks_batch = []
            gc.collect()

        # Free the PyMuPDF document and the bytes from memory
        del doc
        del pdf_bytes
        gc.collect()

        # 4. Record Document in MongoDB
        doc_coll.update_one(
            {"resource_id": resource_id},
            {
                "$set": {
                    "resource_id": resource_id,
                    "title": title,
                    "file_hash": file_hash,
                    "total_pages": len(doc),
                    "status": "ready"
                }
            },
            upsert=True
        )

        return {"status": "success", "chunks_created": total_chunks_created}
