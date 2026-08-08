import os
import re
import time
import json
import logging
from typing import List, Dict, Any, Optional
from urllib.parse import urljoin
import requests
from bs4 import BeautifulSoup

logger = logging.getLogger("samidha.scrapers.ncert")

BASE_URL = "https://ncert.nic.in"
LIVE_URL = f"{BASE_URL}/textbook.php"
CLASS_CODES = [str(i).zfill(2) for i in range(1, 13)]

HEADERS = {
    "User-Agent": "Mozilla/5.0 (compatible; NCERTScraper/1.0)",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9,hi;q=0.8",
    "Referer": LIVE_URL,
}

MAX_RETRIES = 4
RETRY_BACKOFF_SEC = 2.0
TIMEOUT_SEC = 30.0

class NCERTMetadataScraper:
    def __init__(self, session: Optional[requests.Session] = None):
        self.session = session or requests.Session()
        self.session.headers.update(HEADERS)

    def _fetch_with_retry(self, url: str, method: str = "GET", data: Optional[Dict[str, Any]] = None) -> Optional[str]:
        delay = RETRY_BACKOFF_SEC
        for attempt in range(1, MAX_RETRIES + 1):
            try:
                if method.upper() == "POST":
                    resp = self.session.post(url, data=data, timeout=TIMEOUT_SEC)
                else:
                    resp = self.session.get(url, params=data, timeout=TIMEOUT_SEC)
                resp.raise_for_status()
                return resp.text
            except Exception as err:
                logger.warning(f"[warn] {url} — attempt {attempt}/{MAX_RETRIES}: {err}")
                if attempt < MAX_RETRIES:
                    time.sleep(delay)
                    delay *= 2
        logger.error(f"[fail] permanent failure for {url}")
        return None

    def _parse_options(self, html: str, select_name: str) -> List[Dict[str, str]]:
        soup = BeautifulSoup(html, "html.parser")
        select = soup.find("select", attrs={"name": select_name}) or soup.find("select", id=select_name)
        if not select:
            return []
        options = []
        for option in select.find_all("option"):
            value = (option.get("value") or "").strip()
            text = option.get_text().strip()
            if value and value.lower() not in ["0", "select", ""]:
                options.append({"value": value, "text": text})
        return options

    def _detect_language(self, text: str, book_code: str = "") -> str:
        if re.search(r"\bHindi\b", text, re.IGNORECASE):
            return "Hindi"
        if re.search(r"\bUrdu\b", text, re.IGNORECASE):
            return "Urdu"
        if re.search(r"\bSanskrit\b", text, re.IGNORECASE):
            return "Sanskrit"
        c = book_code.lower()
        if c.endswith("h"):
            return "Hindi"
        if c.endswith("u"):
            return "Urdu"
        if c.endswith("s"):
            return "Sanskrit"
        return "English"

    def _parse_chapter_no(self, text: str, href: str, fallback: int) -> str:
        m = re.search(r"(?:chapter|ch\.?)\s*(\d+)", text, re.IGNORECASE)
        if m:
            return str(int(m.group(1)))
        m = re.match(r"^(\d+)[\.\s\-]", text.strip())
        if m:
            return str(int(m.group(1)))
        stem = os.path.splitext(os.path.basename((href or "").split("?")[0]))[0]
        m = re.search(r"(\d{2})$", stem)
        if m:
            return str(int(m.group(1)))
        return str(fallback)

    def _clean_chapter_name(self, text: str) -> str:
        text = re.sub(r"^(?:chapter|ch\.?)\s*\d+\s*[–\-:.]\s*", "", text, flags=re.IGNORECASE)
        text = re.sub(r"^\d+\s*[.\-–]\s*", "", text)
        return text.strip() or "Untitled Chapter"

    def _extract_chapters(self, html: str) -> List[Dict[str, str]]:
        soup = BeautifulSoup(html, "html.parser")
        chapters = []
        seen = set()
        counter = 0

        for a in soup.find_all("a", href=True):
            href = (a.get("href") or "").strip()
            raw_text = re.sub(r"\s+", " ", a.get_text()).strip()

            if not href.lower().endswith(".pdf") and "/textbook/" not in href.lower():
                continue
            if re.search(r"entire|full book|complete book|whole book", raw_text, re.IGNORECASE):
                continue

            full_url = urljoin(BASE_URL, href)
            if full_url in seen:
                continue
            seen.add(full_url)

            counter += 1
            chapters.append({
                "chapter_no": self._parse_chapter_no(raw_text, href, counter),
                "chapter_name": self._clean_chapter_name(raw_text),
                "pdf_url": full_url,
            })
        return chapters

    def _extract_book_pdf(self, html: str) -> Optional[str]:
        soup = BeautifulSoup(html, "html.parser")
        for a in soup.find_all("a", href=True):
            href = (a.get("href") or "").strip()
            text = a.get_text().lower()
            if href.lower().endswith(".pdf") and re.search(r"entire|full book|complete|whole", text):
                return urljoin(BASE_URL, href)
        return None

    def _extract_book_name(self, html: str) -> str:
        soup = BeautifulSoup(html, "html.parser")
        for tag in ["h1", "h2", "h3"]:
            h = soup.find(tag)
            if h and h.get_text().strip():
                return h.get_text().strip()
        return ""

    def scrape_class(self, class_code: str) -> List[Dict[str, Any]]:
        html = self._fetch_with_retry(LIVE_URL, method="GET", data={"tclass": class_code})
        if not html:
            return []

        subjects = self._parse_options(html, "subject")
        if not subjects:
            return []

        records = []
        for subj in subjects:
            subj_html = self._fetch_with_retry(LIVE_URL, method="POST", data={"tclass": class_code, "subject": subj["value"]})
            if not subj_html:
                continue

            books = self._parse_options(subj_html, "book")
            for book in books:
                book_html = self._fetch_with_retry(LIVE_URL, method="POST", data={"tclass": class_code, "subject": subj["value"], "book": book["value"]})
                if not book_html:
                    continue

                book_name = self._extract_book_name(book_html) or book["text"]
                book_pdf = self._extract_book_pdf(book_html)
                chapters = self._extract_chapters(book_html)
                language = self._detect_language(f"{book_name} {subj['text']}", book["value"])

                records.append({
                    "title": f"Class {int(class_code)} {subj['text']}: {book_name}",
                    "description": f"Official NCERT textbook for Class {int(class_code)} {subj['text']} ({language} Medium).",
                    "class": str(int(class_code)),
                    "subject": subj["text"],
                    "language": language,
                    "book_name": book_name,
                    "book_code": book["value"],
                    "external_url": book_pdf or f"{LIVE_URL}?tclass={class_code}&subject={subj['value']}&book={book['value']}",
                    "source_name": "NCERT",
                    "resource_type_slug": "book",
                    "chapters": chapters,
                })
                time.sleep(0.3)
            time.sleep(0.5)
        return records

    def fetch_metadata(self) -> List[Dict[str, Any]]:
        """Fetch all official NCERT metadata records across Class 1 to 12."""
        all_materials = []
        for code in CLASS_CODES:
            records = self.scrape_class(code)
            all_materials.extend(records)
        return all_materials

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    scraper = NCERTMetadataScraper()
    print("Running NCERT Metadata Scraper test sample for Class 10...")
    class10_results = scraper.scrape_class("10")
    print(f"Scraped {len(class10_results)} books for Class 10:")
    print(json.dumps(class10_results[:2], indent=2))
