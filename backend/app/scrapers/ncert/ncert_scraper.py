from typing import List, Dict, Any
from app.scrapers.base.base_scraper import BaseMetadataScraper

class NCERTMetadataScraper(BaseMetadataScraper):

    def fetch_metadata(self) -> List[Dict[str, Any]]:
        # Ingests official NCERT digital textbook links & metadata
        sample_scraped_data = [
            {
                "title": "Class 10 Science Chapter 1: Chemical Reactions and Equations",
                "description": "Official NCERT textbook chapter covering chemical equations, combination, decomposition, and oxidation reactions.",
                "thumbnail_url": "https://ncert.nic.in/assets/images/science10.jpg",
                "external_url": "https://ncert.nic.in/textbook/pdf/jesc101.pdf",
                "source_name": "NCERT",
                "resource_type_slug": "book"
            },
            {
                "title": "Class 10 Mathematics Chapter 1: Real Numbers",
                "description": "Official NCERT Mathematics chapter covering Euclid's Division Lemma and Fundamental Theorem of Arithmetic.",
                "thumbnail_url": "https://ncert.nic.in/assets/images/math10.jpg",
                "external_url": "https://ncert.nic.in/textbook/pdf/jemh101.pdf",
                "source_name": "NCERT",
                "resource_type_slug": "book"
            }
        ]
        return sample_scraped_data
