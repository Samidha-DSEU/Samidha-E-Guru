import hashlib
import re
from abc import ABC, abstractmethod
from typing import List, Dict, Any

class BaseMetadataScraper(ABC):

    @abstractmethod
    def fetch_metadata(self) -> List[Dict[str, Any]]:
        """Fetch educational resource metadata without hosting copyrighted files."""
        pass

    @staticmethod
    def generate_title_hash(title: str) -> str:
        """Normalized SHA-256 hash for duplicate detection."""
        normalized = re.sub(r"[^a-z0-9]", "", title.lower())
        return hashlib.sha256(normalized.encode("utf-8")).hexdigest()

    @staticmethod
    def sanitize_canonical_url(url: str) -> str:
        """Sanitize and trim canonical external resource URL."""
        return url.strip().lower()
