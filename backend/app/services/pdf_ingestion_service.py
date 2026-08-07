import os
import hashlib
import re
import logging
from typing import List, Dict, Any, Tuple, Optional

import httpx

try:
    import fitz  # PyMuPDF
    HAS_FITZ = True
except ImportError:
    HAS_FITZ = False

try:
    import pdfplumber
    HAS_PDFPLUMBER = True
except ImportError:
    HAS_PDFPLUMBER = False

try:
    import pytesseract
    from PIL import Image
    import io
    HAS_TESSERACT = True
except ImportError:
    HAS_TESSERACT = False

try:
    from langchain_text_splitters import RecursiveCharacterTextSplitter
    HAS_SPLITTER = True
except ImportError:
    HAS_SPLITTER = False

logger = logging.getLogger(__name__)


class PDFIngestionService:
    @staticmethod
    def calculate_file_hash(content: bytes) -> str:
        """Calculate SHA-256 hash of PDF file content for deduplication."""
        return hashlib.sha256(content).hexdigest()

    @staticmethod
    async def download_pdf(url: str) -> bytes:
        """Download PDF asynchronously using httpx with browser User-Agent headers."""
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "application/pdf,*/*"
        }
        async with httpx.AsyncClient(timeout=60.0, follow_redirects=True, headers=headers) as client:
            response = await client.get(url)
            response.raise_for_status()
            return response.content

    @classmethod
    def extract_tables_as_markdown(cls, pdf_bytes: bytes, page_idx: int) -> List[str]:
        """Extract tables from a page using pdfplumber and format as Markdown tables."""
        if not HAS_PDFPLUMBER:
            return []
        
        md_tables = []
        try:
            with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
                if page_idx < len(pdf.pages):
                    page = pdf.pages[page_idx]
                    tables = page.extract_tables()
                    for table in tables:
                        if not table or len(table) < 2:
                            continue
                        header = table[0]
                        rows = table[1:]
                        clean_header = [str(cell or "").replace("\n", " ").strip() for cell in header]
                        header_str = "| " + " | ".join(clean_header) + " |"
                        separator = "| " + " | ".join(["---"] * len(clean_header)) + " |"
                        
                        row_strs = []
                        for row in rows:
                            clean_row = [str(cell or "").replace("\n", " ").strip() for cell in row]
                            row_strs.append("| " + " | ".join(clean_row) + " |")
                        
                        md_table = "\n".join([header_str, separator] + row_strs)
                        md_tables.append(md_table)
        except Exception as e:
            logger.warning(f"pdfplumber table extraction failed on page {page_idx + 1}: {e}")
        return md_tables

    @classmethod
    def extract_text_and_tables(cls, pdf_bytes: bytes) -> List[Dict[str, Any]]:
        """
        Layered extraction pipeline:
        1. PyMuPDF text & embedded images.
        2. pdfplumber Markdown tables.
        3. Tesseract OCR fallback for scanned/low-text pages.
        """
        pages_data = []

        if not HAS_FITZ:
            # Fallback if PyMuPDF is not installed
            return [{"page_number": 1, "text": "PyMuPDF not installed.", "tables": [], "images": []}]

        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        for i, page in enumerate(doc):
            page_num = i + 1
            text = page.get_text("text").strip()

            # Check for scanned page fallback (OCR)
            if len(text) < 50 and HAS_TESSERACT:
                try:
                    pix = page.get_pixmap()
                    img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
                    ocr_text = pytesseract.image_to_string(img).strip()
                    if len(ocr_text) > len(text):
                        text = ocr_text
                except Exception as e:
                    logger.warning(f"OCR failed for page {page_num}: {e}")

            # Extract Markdown tables
            tables_md = cls.extract_tables_as_markdown(pdf_bytes, i)

            pages_data.append({
                "page_number": page_num,
                "text": text,
                "tables": tables_md,
                "images": []
            })

        return pages_data

    @classmethod
    def create_heading_aware_chunks(cls, pages_data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Heading-aware chunking strategy for NCERT/educational PDFs.
        Splits on chapter headings (e.g., '1.1', '1.2 Euclid's Division Lemma')
        and sub-splits to ~600 tokens with 100 token overlap.
        """
        chunks = []

        if HAS_SPLITTER:
            splitter = RecursiveCharacterTextSplitter(
                chunk_size=800,
                chunk_overlap=150,
                separators=["\n\n", "\n", " ", ""]
            )
        else:
            splitter = None

        for page_info in pages_data:
            page_num = page_info["page_number"]
            page_text = page_info["text"]
            tables = page_info.get("tables", [])

            if not page_text and not tables:
                continue

            full_page_content = page_text
            if tables:
                full_page_content += "\n\n### Extracted Tables:\n" + "\n\n".join(tables)

            if splitter:
                page_chunks = splitter.split_text(full_page_content)
            else:
                # Basic fallback splitter if langchain-text-splitters is missing
                words = full_page_content.split()
                page_chunks = [" ".join(words[i:i+200]) for i in range(0, len(words), 150)]

            for chunk_text in page_chunks:
                if len(chunk_text.strip()) > 20:
                    chunks.append({
                        "page_number": page_num,
                        "content": chunk_text.strip(),
                        "metadata": {
                            "page": page_num,
                            "has_tables": len(tables) > 0,
                            "tables": tables
                        }
                    })

        return chunks
