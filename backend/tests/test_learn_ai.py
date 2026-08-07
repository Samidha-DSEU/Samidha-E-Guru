import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_get_ai_workspace_endpoint():
    response = client.get("/api/v1/learn-ai/workspace/a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "data" in data
    assert "summaries" in data["data"]
    assert "mind_map" in data["data"]
    assert "flashcards" in data["data"]
    assert "study_tools" in data["data"]

def test_solve_chapter_doubt_endpoint():
    payload = {
        "resource_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
        "question": "What is Euclid's Division Lemma?"
    }
    response = client.post("/api/v1/learn-ai/query", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "answer" in data["data"]
    assert "sources" in data["data"]

def test_submit_quiz_endpoint():
    payload = {
        "resource_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
        "answers": {"q1": "A"}
    }
    response = client.post("/api/v1/learn-ai/quiz/submit", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "score" in data["data"]

def test_trigger_ingestion_endpoint():
    response = client.post("/api/v1/learn-ai/ingest/a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["data"]["status"] == "processing"
