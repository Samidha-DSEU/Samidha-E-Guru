import json
import logging
import subprocess
import os
from datetime import datetime, timezone
from typing import Dict, Any

from sqlalchemy.orm import Session
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.sql import func
from app.models.resources import Resource

logger = logging.getLogger("samidha.scrapers")

class KVSIngestionService:

    @staticmethod
    def sync_kvs_metadata(db: Session) -> Dict[str, Any]:
        """
        Executes the Node.js KV scraper, captures stdout JSON, and upserts into the DB.
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

        # Execute Node script and capture stdout
        # Assuming we are running this from backend/app/services or the root directory.
        # Let's resolve the path to the JS scraper dynamically
        current_dir = os.path.dirname(os.path.abspath(__file__))
        scraper_script = os.path.join(current_dir, "..", "scrapers", "kvs", "kvs_scraper.js")
        
        try:
            logger.info("🚀 Starting Kendriya Vidyalaya (KVS) Knowledge Hub Scraper...")
            process = subprocess.run(
                ["node", scraper_script, "--live", "--stdout"],
                capture_output=True,
                text=True,
                check=False
            )
            
            if process.returncode != 0:
                logger.error(f"❌ KVS Scraper Node process failed with exit code {process.returncode}")
                logger.error(f"Stderr: {process.stderr}")
                raise RuntimeError(f"KVS Node Scraper Failed: {process.stderr}")
                
            # Node process succeeded, parse stdout
            raw_output = process.stdout
            
            # Since the script might also log warnings to stderr/stdout (like the ES module warning),
            # we need to find the actual JSON array. We can try to find '[' and ']' wrapping the JSON.
            try:
                start_idx = raw_output.find('[')
                end_idx = raw_output.rfind(']') + 1
                if start_idx == -1 or end_idx == 0:
                    raise ValueError("No JSON array found in stdout.")
                
                json_str = raw_output[start_idx:end_idx]
                items = json.loads(json_str)
            except Exception as e:
                logger.error(f"❌ Failed to parse KVS JSON from stdout. Error: {e}")
                logger.debug(f"Raw Output: {raw_output[:500]}...")
                raise RuntimeError(f"Invalid JSON output from KVS Scraper: {e}")
            
            if not isinstance(items, list):
                raise ValueError("Parsed JSON is not a list.")
                
            telemetry["total_processed"] = len(items)
            logger.info(f"✅ KVS Scraper completed in {(datetime.now() - start_time).total_seconds():.2f}s. Fetched {len(items)} resources.")

            if len(items) == 0:
                logger.warning("⚠️ No KVS resources found. Exiting.")
                return {"telemetry": telemetry, "scraped_sheet": []}

            # Prepare upsert data
            scraped_sheet = []
            
            for item in items:
                # Basic validation
                if not item.get("title") or not item.get("link"):
                    telemetry["skipped"] += 1
                    continue

                class_list = item.get("classes", [])
                target_class_str = f"Class {class_list[0]}" if class_list else None
                
                # SQLAlchemy ON CONFLICT DO UPDATE upsert for PostgreSQL
                stmt = insert(Resource).values(
                    title=item["title"],
                    description=item.get("description", "Kendriya Vidyalaya Knowledge Hub Material"),
                    external_url=item["link"],
                    target_class=target_class_str,
                    subject_name=item.get("subject", "General"),
                    resource_category="Textbook" if item.get("type") == "pdf" else "Video" if item.get("type") == "youtube" else "Notes",
                    source_type="kvs",
                    verification_status="approved",
                    rating_sum=5,
                    rating_count=1,
                    rating_avg=5.0
                )
                
                # On conflict, update existing metadata
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
                    # Checking if it was an insert or update is complex with SQLAlchemy without returning system columns (xmax).
                    # We will increment 'imported' simplistically, although some may be updates.
                    telemetry["imported"] += 1
                    
                    scraped_sheet.append({
                        "class": target_class_str or "General",
                        "subject": item.get("subject", "General"),
                        "chapter_name": item["title"],
                        "pdf_url": item["link"],
                        "status": "SUCCESS",
                        "message": "Upserted"
                    })
                except Exception as e:
                    telemetry["failed"] += 1
                    logger.error(f"Database upsert failed for item '{item['title']}': {e}")
            
            db.commit()
            
            end_time = datetime.now()
            telemetry["duration_seconds"] = (end_time - start_time).total_seconds()
            
            logger.info(f"📊 KVS Sync Complete: {telemetry['imported']} upserted, {telemetry['skipped']} skipped, {telemetry['failed']} failed.")
            
            return {
                "telemetry": telemetry,
                "scraped_sheet": scraped_sheet
            }

        except Exception as e:
            end_time = datetime.now()
            telemetry["duration_seconds"] = (end_time - start_time).total_seconds()
            logger.error(f"🚨 KVS Sync Error: {e}", exc_info=True)
            raise e
