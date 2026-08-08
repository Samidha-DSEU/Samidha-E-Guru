import time
import logging
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.scrapers.ncert.ncert_scraper import NCERTMetadataScraper
from app.models.education import ClassModel, Subject, Chapter
from app.models.resources import Resource

logger = logging.getLogger("samidha.services.ncert_ingestion")


class NCERTIngestionService:

    @staticmethod
    def sync_ncert_metadata(db: Session, target_class_filter: Optional[str] = None, max_resources_limit: Optional[int] = None) -> Dict[str, Any]:
        """
        Runs NCERT Scraper, creates relational database structures (Class -> Subject -> Chapter),
        and populates NCERT textbook PDF resources in the SAMIDHA Resources Hub with telemetry tracking.
        """
        start_time = time.time()
        scraper = NCERTMetadataScraper()
        
        # Extract numeric class ID from input e.g. "Class 1" -> "1", "class-1" -> "1", "1" -> "1"
        target_num = None
        if target_class_filter and target_class_filter.upper() != "ALL":
            digits = "".join([c for c in str(target_class_filter) if c.isdigit()])
            if digits:
                target_num = digits

        if target_num:
            target_codes = [target_num.zfill(2)]
        else:
            target_codes = [str(i).zfill(2) for i in range(1, 13)]
        
        total_scraped_books = 0
        total_subjects_found = 0
        total_chapters_found = 0
        scraped_success_count = 0
        scraped_failed_count = 0
        resources_added = 0
        resources_updated = 0
        
        scraped_sheet: List[Dict[str, Any]] = []
        unscraped_classes: List[str] = []
        subjects_seen = set()

        for code in target_codes:
            if max_resources_limit and resources_added >= max_resources_limit:
                break
            class_num = str(int(code))
            class_title = f"Class {class_num}"
            class_code_slug = f"class-{class_num}"

            logger.info(f"[NCERT Scraper] Launching Metadata Crawl for {class_title}...")
            print(f"\n[NCERT Scraper Engine] Launching Metadata Crawl for {class_title}...", flush=True)

            # Ensure ClassModel exists in DB
            db_class = db.query(ClassModel).filter(ClassModel.code == class_code_slug).first()
            if not db_class:
                db_class = ClassModel(
                    name=class_title,
                    code=class_code_slug,
                    display_order=int(class_num)
                )
                db.add(db_class)
                db.flush()

            try:
                records = scraper.scrape_class(code)
            except Exception as err:
                logger.error(f"[Error] Failed scraping {class_title}: {err}")
                print(f"[Error] Failed scraping {class_title}: {err}", flush=True)
                unscraped_classes.append(class_title)
                continue

            if not records:
                logger.warning(f"[Warning] No records found for {class_title}")
                print(f"[Warning] No records found for {class_title}", flush=True)
                unscraped_classes.append(class_title)
                continue

            total_scraped_books += len(records)

            for rec in records:
                subj_name = rec["subject"].strip()
                subj_code_slug = f"{subj_name.lower().replace(' ', '-')}-{class_num}"
                chapters_list = rec.get("chapters", [])
                
                logger.info(f"  [Book Scraped] {class_title} {subj_name}: '{rec['book_name']}' ({len(chapters_list)} Chapters)")
                print(f"  [Book Scraped] {class_title} {subj_name}: '{rec['book_name']}' ({len(chapters_list)} Chapters)", flush=True)

                if subj_name not in subjects_seen:
                    subjects_seen.add(subj_name)
                    total_subjects_found += 1

                # Ensure Subject exists in DB
                db_subject = db.query(Subject).filter(Subject.class_id == db_class.id, Subject.name == subj_name).first()
                if not db_subject:
                    db_subject = Subject(
                        class_id=db_class.id,
                        name=subj_name,
                        code=subj_code_slug
                    )
                    db.add(db_subject)
                    db.flush()

                # Ingest Chapter-level PDFs
                for ch in chapters_list:
                    if max_resources_limit and resources_added >= max_resources_limit:
                        break
                    total_chapters_found += 1
                    ch_no_str = str(ch.get("chapter_no", "1"))
                    ch_no_int = int(ch_no_str) if ch_no_str.isdigit() else 1
                    ch_name = ch.get("chapter_name", "Untitled Chapter")
                    pdf_url = ch.get("pdf_url")

                    if not pdf_url:
                        scraped_failed_count += 1
                        scraped_sheet.append({
                            "class": class_title,
                            "subject": subj_name,
                            "chapter_no": ch_no_str,
                            "chapter_name": ch_name,
                            "pdf_url": "N/A",
                            "status": "FAILED",
                            "message": "Missing PDF URL"
                        })
                        continue

                    # Ensure Chapter exists in DB
                    db_chapter = db.query(Chapter).filter(Chapter.subject_id == db_subject.id, Chapter.chapter_number == ch_no_int).first()
                    if not db_chapter:
                        db_chapter = Chapter(
                            subject_id=db_subject.id,
                            name=ch_name,
                            chapter_number=ch_no_int,
                            description=f"Official NCERT Chapter {ch_no_str} for {class_title} {subj_name}"
                        )
                        db.add(db_chapter)
                        db.flush()

                    # Create or Update Resource in DB
                    res_title = f"{class_title} {subj_name} Chapter {ch_no_str}: {ch_name}"
                    existing_res = db.query(Resource).filter(Resource.external_url == pdf_url).first()

                    if existing_res:
                        existing_res.title = res_title
                        existing_res.target_class = class_title
                        existing_res.subject_name = subj_name
                        existing_res.source_type = "ncert"
                        existing_res.verification_status = "approved"
                        resources_updated += 1
                        logger.info(f"    [Updated] {res_title}")
                        print(f"    [Updated] {res_title}", flush=True)
                    else:
                        new_res = Resource(
                            title=res_title,
                            description=f"Official NCERT textbook chapter covering {ch_name} for {class_title} {subj_name} ({rec['language']} Medium).",
                            external_url=pdf_url,
                            target_class=class_title,
                            subject_name=subj_name,
                            resource_category="Notes",
                            source_type="ncert",
                            verification_status="approved",
                            rating_sum=5,
                            rating_count=1
                        )
                        db.add(new_res)
                        resources_added += 1
                        logger.info(f"    [Ingested PDF] {res_title}")
                        print(f"    [Ingested PDF] {res_title}", flush=True)

                    scraped_success_count += 1
                    scraped_sheet.append({
                        "class": class_title,
                        "subject": subj_name,
                        "chapter_no": ch_no_str,
                        "chapter_name": ch_name,
                        "pdf_url": pdf_url,
                        "status": "SUCCESS",
                        "message": "Imported"
                    })

                # Ingest Entire Book PDF if available
                if rec.get("pdf_url") and (not max_resources_limit or resources_added < max_resources_limit):
                    book_pdf_url = rec["pdf_url"]
                    book_title = f"{class_title} {subj_name}: {rec['book_name']} (Full Book PDF)"
                    existing_book_res = db.query(Resource).filter(Resource.external_url == book_pdf_url).first()
                    if existing_book_res:
                        existing_book_res.title = book_title
                        existing_book_res.target_class = class_title
                        existing_book_res.subject_name = subj_name
                        existing_book_res.source_type = "ncert"
                        existing_book_res.verification_status = "approved"
                        resources_updated += 1
                    else:
                        new_book_res = Resource(
                            title=book_title,
                            description=f"Complete NCERT Textbook for {class_title} {subj_name} ({rec['language']} Medium).",
                            external_url=book_pdf_url,
                            target_class=class_title,
                            subject_name=subj_name,
                            resource_category="Notes",
                            source_type="ncert",
                            verification_status="approved",
                            rating_sum=5,
                            rating_count=1
                        )
                        db.add(new_book_res)
                        resources_added += 1

                if max_resources_limit and resources_added >= max_resources_limit:
                    break

            db.commit()

        end_time = time.time()
        duration_seconds = round(end_time - start_time, 2)

        telemetry = {
            "status": "COMPLETED",
            "duration_seconds": duration_seconds,
            "target_class": target_class_filter or "ALL",
            "total_scraped_books": total_scraped_books,
            "total_subjects_found": total_subjects_found,
            "total_chapters_found": total_chapters_found,
            "scraped_success_count": scraped_success_count,
            "scraped_failed_count": scraped_failed_count,
            "resources_added": resources_added,
            "resources_updated": resources_updated,
            "unscraped_classes": unscraped_classes
        }

        logger.info(f"NCERT Sync Completed in {duration_seconds}s: {resources_added} added, {resources_updated} updated.")
        return {
            "telemetry": telemetry,
            "scraped_sheet": scraped_sheet
        }
