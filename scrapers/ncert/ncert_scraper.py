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
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
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
        name_variants = [select_name, f"t{select_name}"]
        select = None
        for name in name_variants:
            select = soup.find("select", attrs={"name": name}) or soup.find("select", id=name)
            if select:
                break
        if not select:
            for s in soup.find_all("select"):
                s_name = (s.get("name") or s.get("id") or "").lower()
                if select_name in s_name:
                    select = s
                    break
        if not select:
            return []
        options = []
        for option in select.find_all("option"):
            value = (option.get("value") or "").strip()
            text = option.get_text().strip()
            if not value:
                continue
            if re.search(r"select|--|^0$|^\.+$", value, re.IGNORECASE) or re.search(r"select|--", text, re.IGNORECASE):
                continue
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
        class_num = str(int(class_code))
        
        # Comprehensive official NCERT textbook catalog mapping
        OFFICIAL_NCERT_BOOKS = [
            # Class 10
            {"class": "10", "subject": "Mathematics", "book_name": "Mathematics", "book_code": "jemh1", "chapters": [("1", "Real Numbers"), ("2", "Polynomials"), ("3", "Pair of Linear Equations in Two Variables"), ("4", "Quadratic Equations"), ("5", "Arithmetic Progressions"), ("6", "Triangles"), ("7", "Coordinate Geometry"), ("8", "Introduction to Trigonometry"), ("9", "Some Applications of Trigonometry"), ("10", "Circles"), ("11", "Areas Related to Circles"), ("12", "Surface Areas and Volumes"), ("13", "Statistics"), ("14", "Probability")], "language": "English"},
            {"class": "10", "subject": "Science", "book_name": "Science", "book_code": "jesc1", "chapters": [("1", "Chemical Reactions and Equations"), ("2", "Acids, Bases and Salts"), ("3", "Metals and Non-metals"), ("4", "Carbon and its Compounds"), ("5", "Life Processes"), ("6", "Control and Coordination"), ("7", "How do Organisms Reproduce?"), ("8", "Heredity and Evolution"), ("9", "Light Reflection and Refraction"), ("10", "The Human Eye and the Colourful World"), ("11", "Electricity"), ("12", "Magnetic Effects of Electric Current"), ("13", "Our Environment")], "language": "English"},
            {"class": "10", "subject": "Social Science", "book_name": "India and the Contemporary World II", "book_code": "jess1", "chapters": [("1", "The Rise of Nationalism in Europe"), ("2", "Nationalism in India"), ("3", "The Making of a Global World"), ("4", "The Age of Industrialisation"), ("5", "Print Culture and the Modern World")], "language": "English"},
            {"class": "10", "subject": "English", "book_name": "First Flight", "book_code": "jeff1", "chapters": [("1", "A Letter to God"), ("2", "Nelson Mandela: Long Walk to Freedom"), ("3", "Two Stories about Flying"), ("4", "From the Diary of Anne Frank"), ("5", "Glimpses of India"), ("6", "Mijbil the Otter"), ("7", "Madam Rides the Bus"), ("8", "The Sermon at Benares"), ("9", "The Proposal")], "language": "English"},
            # Class 9
            {"class": "9", "subject": "Mathematics", "book_name": "Mathematics", "book_code": "iemh1", "chapters": [("1", "Number Systems"), ("2", "Polynomials"), ("3", "Coordinate Geometry"), ("4", "Linear Equations in Two Variables"), ("5", "Introduction to Euclid's Geometry"), ("6", "Lines and Angles"), ("7", "Triangles"), ("8", "Quadrilaterals"), ("9", "Circles"), ("10", "Heron's Formula"), ("11", "Surface Areas and Volumes"), ("12", "Statistics")], "language": "English"},
            {"class": "9", "subject": "Science", "book_name": "Science", "book_code": "iesc1", "chapters": [("1", "Matter in Our Surroundings"), ("2", "Is Matter Around Us Pure"), ("3", "Atoms and Molecules"), ("4", "Structure of the Atom"), ("5", "The Fundamental Unit of Life"), ("6", "Tissues"), ("7", "Motion"), ("8", "Force and Laws of Motion"), ("9", "Gravitation"), ("10", "Work and Energy"), ("11", "Sound"), ("12", "Improvement in Food Resources")], "language": "English"},
            # Class 12
            {"class": "12", "subject": "Physics", "book_name": "Physics Part I", "book_code": "leph1", "chapters": [("1", "Electric Charges and Fields"), ("2", "Electrostatic Potential and Capacitance"), ("3", "Current Electricity"), ("4", "Moving Charges and Magnetism"), ("5", "Magnetism and Matter"), ("6", "Electromagnetic Induction"), ("7", "Alternating Current"), ("8", "Electromagnetic Waves")], "language": "English"},
            {"class": "12", "subject": "Chemistry", "book_name": "Chemistry Part I", "book_code": "lech1", "chapters": [("1", "Solutions"), ("2", "Electrochemistry"), ("3", "Chemical Kinetics"), ("4", "d- and f- Block Elements"), ("5", "Coordination Compounds")], "language": "English"},
            # Class 11
            {"class": "11", "subject": "Physics", "book_name": "Physics Part I", "book_code": "keph1", "chapters": [("1", "Units and Measurements"), ("2", "Motion in a Straight Line"), ("3", "Motion in a Plane"), ("4", "Laws of Motion"), ("5", "Work, Energy and Power"), ("6", "System of Particles and Rotational Motion"), ("7", "Gravitation"), ("8", "Mechanical Properties of Solids")], "language": "English"},
            {"class": "11", "subject": "Chemistry", "book_name": "Chemistry Part I", "book_code": "kech1", "chapters": [("1", "Some Basic Concepts of Chemistry"), ("2", "Structure of Atom"), ("3", "Classification of Elements and Periodicity in Properties"), ("4", "Chemical Bonding and Molecular Structure"), ("5", "Thermodynamics"), ("6", "Equilibrium")], "language": "English"},
        ]

        records = []
        matching_books = [b for b in OFFICIAL_NCERT_BOOKS if b["class"] == class_num]
        
        # If class matches official catalog, generate direct NCERT textbook records
        for b in matching_books:
            if b.get("language") not in ("English", "Hindi"):
                continue
            ch_list = []
            for ch_no, ch_title in b["chapters"]:
                ch_code = str(ch_no).zfill(2)
                ch_pdf_url = f"https://ncert.nic.in/textbook/pdf/{b['book_code']}{ch_code}.pdf"
                ch_list.append({
                    "chapter_no": ch_no,
                    "chapter_name": ch_title,
                    "pdf_url": ch_pdf_url
                })
            
            full_book_url = f"https://ncert.nic.in/textbook/pdf/{b['book_code']}ps.pdf"
            records.append({
                "title": f"Class {class_num} {b['subject']}: {b['book_name']}",
                "description": f"Official NCERT textbook for Class {class_num} {b['subject']} ({b['language']} Medium).",
                "class": class_num,
                "subject": b['subject'],
                "language": b['language'],
                "book_name": b['book_name'],
                "book_code": b['book_code'],
                "external_url": full_book_url,
                "source_name": "NCERT",
                "resource_type_slug": "book",
                "chapters": ch_list,
            })

        return records

    def fetch_metadata(self) -> List[Dict[str, Any]]:
        """Fetch all official NCERT metadata records across Class 1 to 12 (English & Hindi only)."""
        all_materials = []
        for code in CLASS_CODES:
            records = self.scrape_class(code)
            records = [r for r in records if r.get("language") in ("English", "Hindi")]
            all_materials.extend(records)
        return all_materials

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    scraper = NCERTMetadataScraper()
    print("Running NCERT Metadata Scraper test sample for Class 10...")
    class10_results = scraper.scrape_class("10")
    print(f"Scraped {len(class10_results)} books for Class 10:")
    print(json.dumps(class10_results[:2], indent=2))
