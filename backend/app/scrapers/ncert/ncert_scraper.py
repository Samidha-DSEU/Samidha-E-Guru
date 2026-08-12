import os
import re
import time
import json
import logging
from typing import List, Dict, Any, Optional
from urllib.parse import urljoin
import requests
from bs4 import BeautifulSoup
from app.scrapers.base.base_scraper import BaseMetadataScraper

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

class NCERTMetadataScraper(BaseMetadataScraper):
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
        class_num = str(class_code).replace("Class", "").strip()
        if class_num.isdigit():
            class_num = str(int(class_num))

        try:
            # Fetch Live Syllabus Structure
            import requests
            from requests.adapters import HTTPAdapter
            from urllib3.util.retry import Retry
            
            session = requests.Session()
            retry = Retry(connect=3, backoff_factor=0.5)
            adapter = HTTPAdapter(max_retries=retry)
            session.mount('http://', adapter)
            session.mount('https://', adapter)
            
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Connection': 'keep-alive',
            }
            response = session.get(LIVE_URL, headers=headers, timeout=15)
            response.raise_for_status()
            html = response.text
            
            # Remove comments to prevent matching commented-out books (like Marigold vs Mridang)
            html = re.sub(r'^\s*//.*', '', html, flags=re.MULTILINE)
            html = re.sub(r'/\*.*?\*/', '', html, flags=re.DOTALL)

            m_change1 = re.search(r'function change1\(sind\)(.*?)function', html, re.DOTALL)
            if not m_change1:
                logger.error("Could not find change1 function in NCERT HTML")
                return []
                
            change1_body = m_change1.group(1)
            
            class_subj_pattern = re.compile(r'if\s*\(\s*\(document\.test\.tclass\.value\s*==\s*(\d+)\)\s*&&\s*\(document\.test\.tsubject\.options\[sind\]\.text\s*==\s*["\']([^"\']+)["\']\)\s*\)\s*\{([^}]+)\}', re.DOTALL)
            matches = class_subj_pattern.findall(change1_body)
            
            book_pattern = re.compile(r'document\.test\.tbook\.options\[(\d+)\]\.text\s*=\s*["\']([^"\']+)["\'];.*?document\.test\.tbook\.options\[\1\]\.value\s*=\s*["\']textbook\.php\?([^=]+)=([^"\']+)["\']', re.DOTALL)
            
            records = []
            
            for class_str, subj_str, block in matches:
                # Filter by target class
                if class_num != "ALL" and class_str != class_num:
                    continue
                    
                book_matches = book_pattern.findall(block)
                for b_idx, b_name, b_prefix, b_range in book_matches:
                    # Some prefixes point to full books or have ps (prelims), we only care about standard chapter ranges for metadata
                    # Detect language medium and filter regional
                    lower_name = b_name.lower()
                    
                    # 1. Block regional languages explicitly
                    regional_langs = ['(urdu)', '(marathi)', '(gujarati)', '(punjabi)', '(telugu)', '(tamil)', '(kannada)', '(bengali)', '(odia)', '(sindhi)', '(assamese)', '(malayalam)', '(konkani)', '(maithili)', '(bodo)', '(oriya)', '(santhali)', '(manipuri)', '(nepali)', '(dogri)', '(kashmiri)', '(sanskrit)']
                    if any(lang in lower_name for lang in regional_langs):
                        continue
                        
                    # 2. Determine Medium (English vs Hindi)
                    detected_medium = None
                    if '(english)' in lower_name:
                        detected_medium = 'English'
                    elif '(hindi)' in lower_name:
                        detected_medium = 'Hindi'
                    else:
                        hindi_keywords = ['ganit', 'vigyan', 'samajik', 'bharat', 'jadu', 'aas pass', 'rimjhim', 'kshitij', 'sparsh', 'kritika', 'sanchayan', 'vasant', 'durva', 'ruchira', 'itihas', 'bhugol', 'rajniti', 'arthashastra', 'lekha', 'vyavsay']
                        if any(kw in lower_name for kw in hindi_keywords):
                            detected_medium = 'Hindi'
                        else:
                            detected_medium = 'English'

                    # 3. Create explicit subject folders for dual-medium subjects
                    dual_medium_subjects = ['Mathematics', 'Science', 'Environmental Studies', 'Social Science', 'Physics', 'Chemistry', 'Biology', 'History', 'Geography', 'Economics', 'Political Science', 'Sociology', 'Psychology', 'Accountancy', 'Business Studies', 'Computer Science', 'Information Practices']
                    
                    final_subj_str = subj_str
                    if subj_str in dual_medium_subjects:
                        final_subj_str = f"{subj_str} ({detected_medium})"
                        
                    # Extract chapter range (e.g. 0-9)
                    r_parts = b_range.split('-')
                    if len(r_parts) != 2:
                        continue
                    try:
                        start_ch = int(r_parts[0])
                        end_ch = int(r_parts[1])
                    except ValueError:
                        continue
                        
                    ch_list = []
                    actual_start = 1 if start_ch == 0 else start_ch
                    for ch_no in range(actual_start, end_ch + 1):
                        ch_code = str(ch_no).zfill(2)
                        ch_pdf_url = f"https://ncert.nic.in/textbook/pdf/{b_prefix}{ch_code}.pdf"
                        ch_list.append({
                            "chapter_no": ch_no,
                            "chapter_name": f"{b_name} - Chapter {ch_no}",
                            "pdf_url": ch_pdf_url
                        })
                    
                    full_book_url = f"https://ncert.nic.in/textbook/pdf/{b_prefix}ps.pdf"
                    records.append({
                        "title": f"Class {class_str} {final_subj_str}: {b_name}",
                        "description": f"Official NCERT textbook for Class {class_str} {final_subj_str}.",
                        "class": f"Class {class_str}",
                        "subject": final_subj_str,
                        "language": detected_medium,
                        "book_name": b_name,
                        "chapters": ch_list,
                        "pdf_url": full_book_url,
                        "source_name": "NCERT",
                        "resource_type_slug": "book"
                    })
                    
            return records

        except Exception as e:
            logger.error(f"Error scraping NCERT JS variables: {e}")
            return []

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
