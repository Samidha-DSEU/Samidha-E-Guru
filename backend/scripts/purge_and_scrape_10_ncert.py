import os
import sys

# Add backend directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.session import SessionLocal
from app.models.resources import Resource
from app.models.education import ClassModel, Subject, Chapter
from app.services.ncert_ingestion_service import NCERTIngestionService


def main():
    db = SessionLocal()
    try:
        print("==================================================")
        print("1. WIPING ALL NCERT RESOURCES, CHAPTERS & SUBJECTS FROM DB...")
        print("==================================================")

        # 1. Purge NCERT resources and placeholder subjects
        del_count = db.query(Resource).filter(Resource.source_type == "ncert").delete(synchronize_session=False)
        db.query(Subject).filter(Subject.name.ilike("%select%")).delete(synchronize_session=False)
        db.commit()
        print(f"-> Successfully purged {del_count} existing NCERT resources from database.")

        print("\n==================================================")
        print("2. RUNNING SCRAPER TO FETCH & STORE STARTING 10 ENTRIES...")
        print("==================================================")
        
        sync_result = NCERTIngestionService.sync_ncert_metadata(db, max_resources_limit=10)
        print("Sync Summary:", sync_result)

        print("\n==================================================")
        print("3. VERIFYING CREATED NCERT RESOURCES & FOLDER STRUCTURE:")
        print("==================================================")

        new_resources = db.query(Resource).filter(Resource.source_type == "ncert").all()
        print(f"Total NCERT Resources in DB: {len(new_resources)}\n")

        for idx, res in enumerate(new_resources, 1):
            clean_title = res.title.encode('ascii', 'ignore').decode('ascii')
            clean_class = str(res.target_class).encode('ascii', 'ignore').decode('ascii')
            clean_subj = str(res.subject_name).encode('ascii', 'ignore').decode('ascii')
            print(f"[{idx}] {clean_title}")
            print(f"    Target Class   : {clean_class}")
            print(f"    Subject Name   : {clean_subj}")
            print(f"    Category       : {res.resource_category}")
            print(f"    External URL   : {res.external_url}")
            print("    " + "-"*50)

        print("\n--- CREATED CLASS FOLDERS ---")
        classes = db.query(ClassModel).all()
        for c in classes:
            print(f"  Folder -> Class: {c.name} (code: {c.code})")

        print("\n--- CREATED SUBJECT FOLDERS ---")
        subjects = db.query(Subject).all()
        for s in subjects:
            clean_sname = s.name.encode('ascii', 'ignore').decode('ascii')
            print(f"  Folder -> Subject: {clean_sname} (class_id: {s.class_id})")

        print("\n--- CREATED CHAPTERS ---")
        chapters = db.query(Chapter).limit(10).all()
        for ch in chapters:
            clean_cname = ch.name.encode('ascii', 'ignore').decode('ascii')
            print(f"  Chapter {ch.chapter_number}: {clean_cname}")

    finally:
        db.close()


if __name__ == "__main__":
    main()
