import logging
import math
import hashlib
from typing import List, Dict, Any
from pymongo.database import Database

logger = logging.getLogger("learn_ai_embeddings")

class EmbeddingService:
    _model = None

    @classmethod
    def get_model(cls):
        """Lazy loads SentenceTransformers 384-d model only when invoked."""
        if cls._model is None:
            try:
                logger.info("Lazy loading sentence-transformers/all-MiniLM-L6-v2 (384-d)...")
                from sentence_transformers import SentenceTransformer
                cls._model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
            except Exception as e:
                logger.warning(f"Could not load SentenceTransformers ({e}). Using lightweight hash vectorizer fallback.")
                cls._model = False
        return cls._model

    @classmethod
    def generate_embedding(cls, text: str) -> List[float]:
        """
        Generates 384-dimensional vector embedding.
        Uses SentenceTransformer if available, or lightweight hashed feature vector (384-d).
        """
        model = cls.get_model()
        if model:
            try:
                return model.encode(text, convert_to_numpy=True).tolist()
            except Exception as e:
                logger.warning(f"SentenceTransformer encoding error ({e}). Using fallback vectorizer.")

        # Ultra-lightweight 384-d Hashed Feature Vector (RAM Usage: < 1MB)
        return cls._generate_lightweight_vector(text, dims=384)

    @staticmethod
    def _generate_lightweight_vector(text: str, dims: int = 384) -> List[float]:
        """Generates normalized 384-dimensional deterministic feature vector from text tokens."""
        vector = [0.0] * dims
        words = text.lower().split()
        if not words:
            return vector

        for word in words:
            # Hash word into dimension index
            hash_val = int(hashlib.md5(word.encode("utf-8")).hexdigest(), 16)
            idx = hash_val % dims
            val = (hash_val % 100) / 100.0
            vector[idx] += val

        # Normalize vector to unit norm
        norm = math.sqrt(sum(x * x for x in vector))
        if norm > 0:
            vector = [x / norm for x in vector]

        return vector

    @classmethod
    def search_similar_chunks(cls, db: Database, resource_id: str, query: str, top_k: int = 5) -> List[Dict[str, Any]]:
        """
        Performs vector similarity search over MongoDB `ai_chunks` collection.
        Uses MongoDB Atlas `$vectorSearch` pipeline if available, or cosine similarity fallback.
        """
        query_vector = cls.generate_embedding(query)
        chunks_coll = db["ai_chunks"]

        # 1. Try MongoDB Atlas $vectorSearch aggregation pipeline
        try:
            pipeline = [
                {
                    "$vectorSearch": {
                        "index": "vector_index",
                        "path": "embedding",
                        "queryVector": query_vector,
                        "numCandidates": 50,
                        "limit": top_k,
                        "filter": {"resource_id": resource_id}
                    }
                },
                {
                    "$project": {
                        "page_number": 1,
                        "section_heading": 1,
                        "content": 1,
                        "score": {"$meta": "vectorSearchScore"}
                    }
                }
            ]
            results = list(chunks_coll.aggregate(pipeline))
            if results:
                return results
        except Exception:
            # Fallback to standard query + local cosine similarity computation if vector index is building
            pass

        # 2. Fallback: Query all chunks for resource_id and compute cosine similarity
        chunks = list(chunks_coll.find({"resource_id": resource_id}))
        if not chunks:
            # If no chunks match resource_id, return top matches across DB
            chunks = list(chunks_coll.find().limit(20))

        scored_chunks = []
        for chunk in chunks:
            emb = chunk.get("embedding", [])
            if emb and len(emb) == len(query_vector):
                score = cls._cosine_similarity(query_vector, emb)
                scored_chunks.append({
                    "page_number": chunk.get("page_number", 1),
                    "section_heading": chunk.get("section_heading", "General"),
                    "content": chunk.get("content", ""),
                    "score": score
                })

        scored_chunks.sort(key=lambda x: x["score"], reverse=True)
        return scored_chunks[:top_k]

    @staticmethod
    def _cosine_similarity(vec_a: List[float], vec_b: List[float]) -> float:
        """Calculates cosine similarity dot product between two vector arrays."""
        dot_product = sum(a * b for a, b in zip(vec_a, vec_b))
        norm_a = math.sqrt(sum(a * a for a in vec_a))
        norm_b = math.sqrt(sum(b * b for b in vec_b))
        if norm_a == 0 or norm_b == 0:
            return 0.0
        return dot_product / (norm_a * norm_b)
