import logging
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.scrapers.ncert.ncert_scraper import NCERTMetadataScraper
from app.models.education import ClassModel, Subject, Chapter
from app.models.resources import Resource

logger = logging.getLogger("samidha.services.ncert_ingestion")


class NCERTIngestionService:

    @staticmethod
    def sync_ncert_metadata(db: Session, target_class_filter: Optional[str] = None) -> Dict[str, Any]:
        """
        Runs NCERT Scraper, creates relational database structures (Class -> Subject -> Chapter),
        and populates NCERT textbook PDF resources in the SAMIDHA Resources Hub.
        """
        scraper = NCERTMetadataScraper()
        
        class_codes = [target_class_filter.zfill(2)] if target_class_filter and target_class_filter.isdigit() else [str(i).zfill(2) for i in range(1, 13)]
        
        total_scraped_books = 0
        total_chapters_scraped = 0
        resources_added = 0
        resources_updated = 0
        
        for code in class_codes:
            class_num = str(int(code))
            class_title = f"Class {class_num}"
            class_code_slug = f"class-{class_num}"

            # 1. Ensure ClassModel exists in DB
            db_class = db.query(ClassModel).filter(ClassModel.code == class_code_slug).first()
            if not db_class:
                db_class = ClassModel(
                    name=class_title,
                    code=class_code_slug,
                    display_order=int(class_num)
                )
                db.add(db_class)
                db.flush()

            records = scraper.scrape_class(code)
            total_scraped_books += len(records)

            for rec in records:
                subj_name = rec["subject"].strip()
                subj_code_slug = f"{subj_name.lower().replace(' ', '-')}-{class_num}"

                # 2. Ensure Subject exists in DB
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
                for ch in rec.get("chapters", []):
                    total_chapters_scraped += 1
                    ch_no_str = str(ch.get("chapter_no", "1"))
                    ch_no_int = int(ch_no_str) if ch_no_str.isdigit() else 1
                    ch_name = ch.get("chapter_name", "Untitled Chapter")
                    pdf_url = ch.get("pdf_url")

                    if not pdf_url:
                        continue

                    # 3. Ensure Chapter exists in DB
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

                    # 4. Create or Update Resource in DB
                    res_title = f"{class_title} {subj_name} Chapter {ch_no_str}: {ch_name}"
                    existing_res = db.query(Resource).filter(Resource.external_url == pdf_url).first()

                    if existing_res:
                        existing_res.title = res_title
                        existing_res.target_class = class_title
                        existing_res.subject_name = subj_name
                        existing_res.source_type = "ncert"
                        resources_updated += 1
                    else:
                        new_res = Resource(
                            title=res_title,
                            description=f"Official NCERT textbook chapter covering {ch_name} for {class_title} {subj_name} ({rec['language']} Medium).",
                            external_url=pdf_url,
                            target_class=class_title,
                            subject_name=subj_name,
                            resource_category="Notes",
                            source_type="ncert",
                            rating_sum=5,
                            rating_count=1
                        )
                        db.add(new_res)
                        resources_added += 1

                # Ingest Entire Book PDF if available
                if rec.get("pdf_url"):
                    book_pdf_url = rec["pdf_url"]
                    book_title = f"{class_title} {subj_name}: {rec['book_name']} (Full Book PDF)"
                    existing_book_res = db.query(Resource).filter(Resource.external_url == book_pdf_url).first()
                    if existing_book_res:
                        existing_book_res.title = book_title
                        existing_book_res.target_class = class_title
                        existing_book_res.subject_name = subj_name
                        existing_book_res.source_type = "ncert"
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
                            rating_sum=5,
                            rating_count=1
                        )
                        db.add(new_book_res)
                        resources_added += 1

            db.commit()

        logger.info(f"NCERT Sync Completed: {resources_added} resources added, {resources_updated} updated.")
        return {
            "status": "COMPLETED",
            "total_scraped_books": total_scraped_books,
            "total_chapters_scraped": total_chapters_scraped,
            "resources_added": resources_added,
            "resources_updated": resources_updated
        }
