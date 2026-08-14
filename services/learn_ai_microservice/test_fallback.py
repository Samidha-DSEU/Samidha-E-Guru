import sys
import os
sys.path.append(os.path.abspath("."))
from services.embedding_service import EmbeddingService
import math

class MockCursor:
    def __init__(self, data):
        self.data = data
    def __iter__(self):
        return iter(self.data)
    
class MockCollection:
    def __init__(self, data):
        self.data = data
    def find(self, query=None):
        return MockCursor(self.data)
    def count_documents(self, query=None):
        return len(self.data)

class MockDB:
    def __init__(self):
        # Create dummy chunks with known vectors
        self.data = [
            {"resource_id": "123", "page_number": 1, "section_heading": "Intro", "content": "Hello World", "embedding": [0.1] * 384},
            {"resource_id": "123", "page_number": 2, "section_heading": "Body", "content": "MongoDB Test", "embedding": [0.5] * 384},
            {"resource_id": "123", "page_number": 3, "section_heading": "Outro", "content": "Goodbye", "embedding": [0.9] * 384},
        ]
        self.coll = MockCollection(self.data)
        
    def __getitem__(self, item):
        return self.coll

def mock_generate_embedding(text):
    return [0.5] * 384

EmbeddingService.generate_embedding = classmethod(lambda cls, text: mock_generate_embedding(text))

def test_fallback():
    print("Testing MongoDB RAG Fallback Memory Optimization...")
    db = MockDB()
    try:
        results = EmbeddingService.search_similar_chunks(db, "123", "Test query", top_k=2)
        print("Success! Top 2 results:")
        for r in results:
            print(f"- [Score: {r['score']:.4f}] Page {r['page_number']}: {r['content']}")
    except Exception as e:
        print(f"FAILED: {e}")

if __name__ == "__main__":
    test_fallback()
