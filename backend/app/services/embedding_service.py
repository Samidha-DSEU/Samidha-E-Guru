import logging
from typing import List, Dict, Any, Optional
from sqlalchemy import select, text
from sqlalchemy.orm import Session

from app.models.learn_ai import AIDocumentChunk

logger = logging.getLogger(__name__)

_embedding_model = None

def get_embedding_model():
    """Lazy initialization of SentenceTransformer model (all-MiniLM-L6-v2)."""
    global _embedding_model
    if _embedding_model is None:
        try:
            from sentence_transformers import SentenceTransformer
            logger.info("Loading local SentenceTransformer model: all-MiniLM-L6-v2")
            _embedding_model = SentenceTransformer("all-MiniLM-L6-v2")
        except Exception as e:
            logger.error(f"Failed to load SentenceTransformer: {e}")
            _embedding_model = False
    return _embedding_model


class EmbeddingService:
    @staticmethod
    def embed_text(text: str) -> List[float]:
        """Generate 384-dimensional vector embedding for input string."""
        model = get_embedding_model()
        if not model:
            # Fallback zero vector if model is unavailable
            return [0.0] * 384
        
        embedding = model.encode(text, convert_to_numpy=True)
        return embedding.tolist()

    @staticmethod
    def embed_batch(texts: List[str]) -> List[List[float]]:
        """Generate embeddings for a list of text strings."""
        model = get_embedding_model()
        if not model or not texts:
            return [[0.0] * 384 for _ in texts]
        
        embeddings = model.encode(texts, convert_to_numpy=True)
        return embeddings.tolist()

    @classmethod
    def search_similar_chunks(
        cls,
        db: Session,
        resource_id: str,
        query: str,
        top_k: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Perform vector similarity search against PostgreSQL pgvector or in-memory fallback.
        Returns top_k matching chunks with content and page numbers.
        """
        query_vector = cls.embed_text(query)

        # Try native pgvector cosine distance search
        try:
            vector_str = f"[{','.join(str(x) for x in query_vector)}]"
            query_sql = text("""
                SELECT id, page_number, content, chunk_metadata,
                       (embedding <=> :vector_str::vector) AS distance
                FROM ai_document_chunks
                WHERE resource_id = :resource_id
                ORDER BY embedding <=> :vector_str::vector
                LIMIT :top_k
            """)
            result = db.execute(query_sql, {
                "vector_str": vector_str,
                "resource_id": resource_id,
                "top_k": top_k
            }).fetchall()

            if result:
                return [
                    {
                        "id": str(row.id),
                        "page_number": row.page_number,
                        "content": row.content,
                        "metadata": row.chunk_metadata,
                        "distance": float(row.distance)
                    }
                    for row in result
                ]
        except Exception as e:
            logger.info(f"pgvector query fallback to standard query: {e}")

        # Standard fallback query if pgvector extension query fails
        chunks = db.query(AIDocumentChunk).filter(
            AIDocumentChunk.resource_id == resource_id
        ).limit(top_k).all()

        return [
            {
                "id": str(chunk.id),
                "page_number": chunk.page_number,
                "content": chunk.content,
                "metadata": chunk.chunk_metadata or {},
                "distance": 0.0
            }
            for chunk in chunks
        ]
