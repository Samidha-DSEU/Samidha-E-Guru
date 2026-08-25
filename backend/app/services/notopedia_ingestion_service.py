import logging
import base64
from datetime import datetime, timezone
from typing import Dict, Any, List
import urllib.parse
import re
import time

from sqlalchemy.orm import Session
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.sql import func
from bs4 import BeautifulSoup
import requests

from app.models.resources import Resource

logger = logging.getLogger("samidha.scrapers")

CLASS_MAP = {
    "6": ("20", "Class-6", "Class 6"),
    "7": ("21", "Class-7", "Class 7"),
    "8": ("22", "Class-8", "Class 8"),
    "9": ("23", "Class-9", "Class 9"),
    "10": ("24", "Class-10", "Class 10"),
    "11": ("25", "Class-11", "Class 11"),
    "12": ("26", "Class-12", "Class 12"),
}

def safe_base64_decode(s: str) -> str:
    try:
        # Standardize padding
        missing_padding = len(s) % 4
        if missing_padding:
            s += '=' * (4 - missing_padding)
        return base64.b64decode(s).decode("utf-8", errors="ignore")
    except Exception:
        return ""

class NotopediaIngestionService:

    @staticmethod
    def sync_notopedia_metadata(db: Session, target_class_filter: str = "ALL") -> Dict[str, Any]:
        """
        Scrapes Notopedia educational resources and populates the Samidha Shiksha Library (source_type = "samidha").
        """
        telemetry = {
            "total_subjects_found": 0,
            "total_chapters_found": 0,
            "scraped_success_count": 0,
            "scraped_failed_count": 0,
            "resources_found": 0,
            "resources_added": 0,
            "duration_seconds": 0.0
        }

        start_time = time.time()
        logger.info("🚀 Starting Notopedia Study Resources Scraper...")

        # Parse target classes
        classes_to_scrape = []
        class_clean = target_class_filter.lower().replace("class", "").strip()

        if class_clean == "all":
            classes_to_scrape = list(CLASS_MAP.keys())
        elif class_clean in CLASS_MAP:
            classes_to_scrape = [class_clean]
        else:
            logger.warning(f"⚠️ Unsupported class code: {target_class_filter}. Skipping.")
            return {"telemetry": telemetry, "scraped_sheet": []}

        scraped_sheet = []
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        }

        try:
            # 1. Fetch main school categories to pull subjects dynamically
            nav_url = "https://www.notopedia.com/school-class/CBSE/1/2"
            logger.info(f"Fetching class selection options from {nav_url}...")
            resp = requests.get(nav_url, headers=headers, timeout=25)
            resp.raise_for_status()
            soup_nav = BeautifulSoup(resp.text, "html.parser")

            for cls_code in classes_to_scrape:
                noto_id, noto_slug, class_display = CLASS_MAP[cls_code]
                logger.info(f"📂 Scraping {class_display} (Notopedia ID: {noto_id})...")

                # Extract subject select dropdown options for this class
                select_el = soup_nav.find("select", id=f"sel_board_{noto_id}")
                subjects = []
                if select_el:
                    for opt in select_el.find_all("option"):
                        val = opt.get("value")
                        name = opt.get_text(strip=True)
                        if val and name and "Select Subject" not in name:
                            subjects.append({"id": val, "name": name})

                telemetry["total_subjects_found"] += len(subjects)
                logger.info(f"Found {len(subjects)} subjects for {class_display}.")

                # 2. Iterate subjects
                for subj in subjects:
                    subj_id = subj["id"]
                    subj_name = subj["name"]

                    # Clean subject name to match Notopedia URL structure
                    subj_slug = subj_name.replace(" ", "-").replace("&", "-").replace("--", "-").replace("---", "-").lower()
                    subject_page_url = f"https://www.notopedia.com/school/2/{noto_id}/{subj_id}/cbse-{noto_slug.lower()}-{subj_slug}"
                    
                    logger.info(f"  📖 Fetching subject details from {subject_page_url}...")
                    try:
                        resp_subj = requests.get(subject_page_url, headers=headers, timeout=25)
                        if resp_subj.status_code != 200:
                            logger.warning(f"  ❌ Subject page returned status {resp_subj.status_code}. Skipping.")
                            continue
                        
                        soup_subj = BeautifulSoup(resp_subj.text, "html.parser")

                        # Collect all reader URLs
                        item_links = []
                        
                        # Type A: Direct solution/chapter reader links in HTML
                        for a in soup_subj.find_all("a", href=True):
                            href = a["href"]
                            if "/read/" in href:
                                if href.startswith("/"):
                                    href = "https://www.notopedia.com" + href
                                item_links.append(href)

                        # Type B: Papers and PYQs fetched via AJAX popup endpoint
                        ajax_url = "https://www.notopedia.com/includes/ajax/ajax-paper-popup.php"
                        ajax_data = {
                            "mcid_info": "1", # CBSE
                            "ctid_info": "2", # School/Class Exam
                            "cthid_info": noto_id,
                            "cfid_info": subj_id,
                            "exam": "2"
                        }
                        try:
                            resp_ajax = requests.post(ajax_url, data=ajax_data, headers=headers, timeout=20)
                            if resp_ajax.status_code == 200 and resp_ajax.text.strip():
                                soup_ajax = BeautifulSoup(resp_ajax.text, "html.parser")
                                for a in soup_ajax.find_all("a", href=True):
                                    href = a["href"]
                                    if href.startswith("/"):
                                        href = "https://www.notopedia.com" + href
                                    elif not href.startswith("http"):
                                        href = "https://www.notopedia.com/" + href
                                    item_links.append(href)
                        except Exception as e:
                            logger.error(f"  ⚠️ Failed fetching papers popup AJAX: {e}")

                        # Clean and unique links list
                        item_links = list(set(item_links))
                        logger.info(f"  Found {len(item_links)} resource links for {subj_name}.")

                        # 3. Process each document link
                        for link in item_links:
                            telemetry["total_chapters_found"] += 1
                            try:
                                base64_title = ""
                                base64_filename = ""

                                # Parse metadata from URL
                                if "/read/" in link:
                                    parts = link.split("/")
                                    read_idx = parts.index("read")
                                    if len(parts) > read_idx + 3:
                                        base64_title = parts[read_idx + 2]
                                        base64_filename = parts[read_idx + 3]
                                else:
                                    parsed_url = urllib.parse.urlparse(link)
                                    params = urllib.parse.parse_qs(parsed_url.query)
                                    base64_title = params.get("ttl", [""])[0]
                                    base64_filename = params.get("fn", [""])[0]

                                if not base64_title or not base64_filename:
                                    telemetry["scraped_failed_count"] += 1
                                    continue

                                doc_title = safe_base64_decode(base64_title) or "Notopedia Document"
                                filename = safe_base64_decode(base64_filename)

                                if not filename:
                                    telemetry["scraped_failed_count"] += 1
                                    continue

                                # Map category
                                title_lower = doc_title.lower()
                                if "pyq" in title_lower or "previous year" in title_lower or "question paper" in title_lower:
                                    category = "Question Paper / PYQ"
                                    desc_type = "Question Paper / Previous Year Paper"
                                elif "sample" in title_lower:
                                    category = "Sample Paper"
                                    desc_type = "Sample Paper"
                                elif "worksheet" in title_lower:
                                    category = "Worksheet"
                                    desc_type = "Worksheet"
                                else:
                                    category = "Notes"
                                    desc_type = "Notes & Textbook Solution"

                                # Upsert resource to PostgreSQL with source_type="samidha"
                                stmt = insert(Resource).values(
                                    title=doc_title,
                                    description=f"Free {desc_type} for {class_display} {subj_name} sourced from Notopedia.",
                                    external_url=link,
                                    target_class=class_display,
                                    subject_name=subj_name.title(),
                                    resource_category=category,
                                    source_type="samidha",
                                    verification_status="approved",
                                    rating_sum=5,
                                    rating_count=1,
                                    rating_avg=5.0
                                )

                                upsert_stmt = stmt.on_conflict_do_update(
                                    index_elements=["source_type", "external_url"],
                                    set_={
                                        "title": stmt.excluded.title,
                                        "description": stmt.excluded.description,
                                        "target_class": stmt.excluded.target_class,
                                        "subject_name": stmt.excluded.subject_name,
                                        "resource_category": stmt.excluded.resource_category,
                                        "updated_at": func.now()
                                    }
                                )

                                db.execute(upsert_stmt)
                                telemetry["resources_added"] += 1
                                telemetry["scraped_success_count"] += 1

                                scraped_sheet.append({
                                    "class": class_display,
                                    "subject": subj_name,
                                    "chapter_name": doc_title,
                                    "pdf_url": link,
                                    "status": "SUCCESS",
                                    "message": f"Ingested under {category}"
                                })

                            except Exception as e:
                                telemetry["scraped_failed_count"] += 1
                                logger.error(f"  ❌ Error parsing link '{link}': {e}")
                                scraped_sheet.append({
                                    "class": class_display,
                                    "subject": subj_name,
                                    "chapter_name": "Parsing Failed",
                                    "pdf_url": link,
                                    "status": "FAILED",
                                    "message": str(e)
                                })

                        db.commit()

                    except Exception as e:
                        logger.error(f"  ⚠️ Error fetching page for {subj_name}: {e}")

            telemetry["resources_found"] = telemetry["total_chapters_found"]
            logger.info("✅ Notopedia Study Resources Scraper Completed Successfully!")

        except Exception as e:
            logger.error(f"🚨 Notopedia Scraper Failed: {e}", exc_info=True)
            raise e

        end_time = time.time()
        telemetry["duration_seconds"] = round(end_time - start_time, 2)

        return {
            "telemetry": telemetry,
            "scraped_sheet": scraped_sheet
        }
