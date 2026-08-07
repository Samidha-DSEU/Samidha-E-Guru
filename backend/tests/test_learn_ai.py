import pytest
from app.services.pdf_ingestion_service import PDFIngestionService
from app.services.embedding_service import EmbeddingService
from app.services.ai_tutor_service import AITutorService

def test_pdf_hash_calculation():
    sample_bytes = b"%PDF-1.4 test document content"
    file_hash = PDFIngestionService.calculate_file_hash(sample_bytes)
    assert isinstance(file_hash, str)
    assert len(file_hash) == 64

def test_heading_aware_chunking():
    pages_data = [
        {
            "page_number": 1,
            "text": "1.1 Introduction to Real Numbers\nIn mathematics, real numbers comprise rational and irrational numbers.",
            "tables": ["| Number | Type |\n|---|---|\n| 2 | Rational |"],
            "images": []
        }
    ]
    chunks = PDFIngestionService.create_heading_aware_chunks(pages_data)
    assert len(chunks) > 0
    assert chunks[0]["page_number"] == 1
    assert "Real Numbers" in chunks[0]["content"]

def test_embedding_service_zero_fallback():
    vector = EmbeddingService.embed_text("Test query string")
    assert isinstance(vector, list)
    assert len(vector) == 384

def test_default_workspace_generation():
    workspace = AITutorService._generate_default_workspace("res-123", "Mathematics Chapter 1")
    assert workspace["resource_id"] == "res-123"
    assert "summaries" in workspace
    assert "one_min_bullets" in workspace["summaries"]
    assert "mind_map" in workspace
    assert "flashcards" in workspace
    assert "study_tools" in workspace
    assert "question_bank" in workspace
