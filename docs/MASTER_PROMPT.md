# SAMIDHA E-GURU — Master Prompt Specification

## Project Overview
SAMIDHA E-GURU is a production-ready educational platform created for the social initiative "SAMIDHA". Its primary mission is to provide free educational resources, mentorship, career guidance, and academic opportunities to school students, college learners, and underprivileged students.

---

## Core Objectives
1. **Free Educational Resource Hub**: Aggregate, organize, and serve high-quality educational materials (NCERT, DIKSHA, SWAYAM, NPTEL, YouTube, SAMIDHA custom notes).
2. **Academic Community**: Enable interactive learning, peer discussions, and alumni mentorship.
3. **Structured Hierarchy**: Organize resources by `Class -> Subject -> Chapter -> Resource Type -> Source`.
4. **Volunteer & Alumni Empowerment**: Enable verified volunteers to upload resources and organize events, and alumni to guide students.
5. **Legitimate Metadata Scrapers**: Automated scrapers collecting official metadata, thumbnails, and canonical links without hosting copyrighted binaries illegally.
6. **Robust Admin Management**: Full control panel for content approval, user role management, activity audit logs, and reports.

---

## Technical Stack Summary
- **Frontend**: Next.js 15 App Router, React 19, TypeScript, Tailwind CSS v4, shadcn/ui, Framer Motion, TanStack Query.
- **Backend**: FastAPI, Python 3.12+, SQLAlchemy 2.0, Pydantic v2, Alembic.
- **Database**: PostgreSQL (Docker local / Supabase production).
- **Authentication**: JWT Access & Refresh Tokens, Google OAuth2.
- **Storage**: Supabase Storage for images and PDF documents.

---

## System User Personas
1. **Student / Learner**: School & college students accessing resources, tracking progress, bookmarking, and registering for events.
2. **Volunteer**: Active SAMIDHA members uploading educational resources (pending admin verification), creating events, and posting announcements.
3. **Alumni**: Graduated members offering career mentorship, publishing educational articles, and participating in workshops.
4. **Admin**: Responsible for resource review & approval, content moderation, user management, and report resolution.
5. **Super Admin**: Unrestricted authority over platform settings, admin creation, role assignments, and system audit logs.
