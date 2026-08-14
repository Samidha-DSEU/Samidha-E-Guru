import json
import logging
import subprocess
import os
from datetime import datetime, timezone
from typing import Dict, Any

from sqlalchemy.orm import Session
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.sql import func
from bs4 import BeautifulSoup
import requests
import re
from app.models.resources import Resource

logger = logging.getLogger("samidha.scrapers")

class KVSIngestionService:

    @staticmethod
    def sync_kvs_metadata(db: Session, target_class_filter: str = "ALL") -> Dict[str, Any]:
        """
        Fetches KVS Knowledge Hub HTML, parses with BeautifulSoup, and upserts into DB.
        Filters by target_class_filter if provided (e.g. "10", "ALL").
        Returns telemetry data.
        """
        telemetry = {
            "total_processed": 0,
            "imported": 0,
            "updated": 0,
            "skipped": 0,
            "failed": 0,
            "duration_seconds": 0.0
        }

        start_time = datetime.now()

        try:
            logger.info("🚀 Starting Kendriya Vidyalaya (KVS) Knowledge Hub Scraper (Python Edition)...")
            
            LIVE_URL = "https://kvsangathan.nic.in/en/knowledge-hub/"
            headers = {"User-Agent": "Mozilla/5.0 (compatible; KVSSupportMaterialScraper/1.0)"}
            resp = requests.get(LIVE_URL, headers=headers, timeout=30)
            resp.raise_for_status()
            html = resp.text
            
            soup = BeautifulSoup(html, "html.parser")
            table = soup.find("table", class_="data-table-1") or soup.find("table")
            if not table:
                raise ValueError("No data table found on the KVS page.")

            COLUMN_CLASS_MAP = {
                2: {"group": "General", "classes": []},
                3: {"group": "IX/X", "classes": ["9", "10"]},
                4: {"group": "XI/XII", "classes": ["11", "12"]},
            }

            def detect_language(title: str):
                t = title.lower()
                if "sanskrit" in t: return "Sanskrit"
                if "hindi" in t: return "Hindi"
                if "english" in t or "(eng" in t or "eng)" in t: return "English"
                return None

            def clean_subject(title: str):
                s = re.sub(r'(?i)class\s*\d{1,2}', '', title)
                s = re.sub(r'(?i)\(\s*(english|eng|hindi|sanskrit)\s*\)?', '', s)
                s = re.sub(r'(?i)\b(english|hindi|sanskrit|eng)\b', '', s)
                s = re.sub(r'\s{2,}', ' ', s)
                s = s.strip(" -–—()")
                if s.strip(): return s.strip()
                return detect_language(title) or title.strip()

            items = []
            tbody = table.find("tbody") or table
            for tr in tbody.find_all("tr"):
                cells = tr.find_all("td")
                if len(cells) < 5: continue

                title = cells[1].get_text(separator=" ", strip=True)
                title = re.sub(r'\s{2,}', ' ', title)
                if not title: continue

                url = None
                group = None
                default_classes = []
                
                for idx in [2, 3, 4]:
                    a_tag = cells[idx].find("a", href=True)
                    if a_tag:
                        url = a_tag["href"].strip()
                        group = COLUMN_CLASS_MAP[idx]["group"]
                        default_classes = COLUMN_CLASS_MAP[idx]["classes"]
                        break
                
                if not url: continue
                
                title_classes = re.findall(r'(?i)class\s*(\d{1,2})', title)
                classes = title_classes if title_classes else default_classes
                
                # Apply class-wise filter
                if target_class_filter and target_class_filter != "ALL":
                    if target_class_filter not in classes:
                        continue # Skip if this resource doesn't match the requested class
                
                resource_type = "web"
                u = url.lower()
                if u.endswith(".pdf") or ".pdf" in u: resource_type = "pdf"
                elif "youtube.com" in u or "youtu.be" in u: resource_type = "youtube"
                elif "drive.google.com" in u: resource_type = "google_drive"
                elif "fliphtml5" in u or "flipbook" in u: resource_type = "flipbook"
                
                items.append({
                    "title": title,
                    "subject": clean_subject(title),
                    "classes": classes,
                    "language": detect_language(title) or "English",
                    "resource_type": resource_type,
                    "url": url
                })

            telemetry["total_processed"] = len(items)
            logger.info(f"✅ KVS Scraper completed in {(datetime.now() - start_time).total_seconds():.2f}s. Fetched {len(items)} matching resources.")

            scraped_sheet = []
            for item in items:
                class_list = item.get("classes", [])
                target_class_str = f"Class {class_list[0]}" if class_list else None
                
                stmt = insert(Resource).values(
                    title=item["title"],
                    description="Kendriya Vidyalaya Knowledge Hub Material",
                    external_url=item["url"],
                    target_class=target_class_str,
                    subject_name=item.get("subject", "General"),
                    resource_category="Textbook" if item["resource_type"] == "pdf" else "Video" if item["resource_type"] == "youtube" else "Notes",
                    source_type="kvs",
                    verification_status="approved",
                    rating_sum=5,
                    rating_count=1,
                    rating_avg=5.0
                )
                
                upsert_stmt = stmt.on_conflict_do_update(
                    index_elements=['source_type', 'external_url'],
                    set_={
                        'title': stmt.excluded.title,
                        'description': stmt.excluded.description,
                        'target_class': stmt.excluded.target_class,
                        'subject_name': stmt.excluded.subject_name,
                        'resource_category': stmt.excluded.resource_category,
                        'updated_at': func.now()
                    }
                )
                
                try:
                    res = db.execute(upsert_stmt)
                    telemetry["imported"] += 1
                    
                    scraped_sheet.append({
                        "class": target_class_str or "General",
                        "subject": item.get("subject", "General"),
                        "chapter_name": item["title"],
                        "pdf_url": item["url"],
                        "status": "SUCCESS",
                        "message": "Upserted"
                    })
                except Exception as e:
                    telemetry["failed"] += 1
                    logger.error(f"Database upsert failed for item '{item['title']}': {e}")
            
            db.commit()
            
            end_time = datetime.now()
            telemetry["duration_seconds"] = (end_time - start_time).total_seconds()
            
            logger.info(f"📊 KVS Sync Complete: {telemetry['imported']} upserted, {telemetry['failed']} failed.")
            
            return {
                "telemetry": telemetry,
                "scraped_sheet": scraped_sheet
            }

        except Exception as e:
            end_time = datetime.now()
            telemetry["duration_seconds"] = (end_time - start_time).total_seconds()
            logger.error(f"🚨 KVS Sync Error: {e}", exc_info=True)
            raise e
