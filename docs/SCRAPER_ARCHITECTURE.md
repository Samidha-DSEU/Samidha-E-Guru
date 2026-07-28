# SCRAPER_ARCHITECTURE.md — Legitimate Metadata Scraper Pipeline

The scraper module aggregates educational metadata (NCERT, DIKSHA, SWAYAM, NPTEL, YouTube) while upholding intellectual property rights: it collects titles, thumbnails, canonical links, and descriptions without illegally serving raw copyrighted PDFs or video files.

---

## Scraper Execution Workflow

```text
Scheduler Trigger (Cron / Admin Manual)
           │
           ▼
Target Source Crawler (backend/app/scrapers/)
           │
           ▼
HTML / JSON API Parser
           │
           ▼
Data Validator (Pydantic Schema Check)
           │
           ▼
Duplicate Checker (Title Hash & Canonical URL match)
           │
           ▼
Insert into `resources` (verification_status = 'pending')
           │
           ▼
Admin Review Dashboard (Approve -> Public Resource)
```

---

## Duplicate Prevention Logic
1. **Canonical URL Match**: `LOWER(TRIM(external_url))` unique comparison.
2. **Title Hash**: SHA-256 hash of normalized title (`LOWER(REGEXP_REPLACE(title, '[^a-z0-9]', ''))`).
3. **Source Verification**: Check against existing `resource_sources` database records.
