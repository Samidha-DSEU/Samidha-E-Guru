# SAMIDHA E-GURU 🎓

A production-grade SaaS educational platform built for the **SAMIDHA** initiative to provide free educational resources, mentoring, community engagement, and academic opportunities to students, volunteers, and alumni.

---

## 📌 Table of Contents
- [Project Overview](#-project-overview)
- [Key Features](#-key-features)
- [Tech Stack](#-tech-stack)
- [System Architecture](#-system-architecture)
- [Folder Structure](#-folder-structure)
- [Installation & Setup](#-installation--setup)
- [Environment Variables](#-environment-variables)
- [Database & Storage Buckets](#-database--storage-buckets)
- [Running Locally](#-running-locally)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [Architecture Freeze](#-architecture-freeze)
- [License](#-license)

---

## 🎯 Project Overview
SAMIDHA E-GURU organizes educational resources into a clean hierarchy (`Class -> Subject -> Chapter -> Resource`), connects students with alumni mentors, enables volunteers to manage events and upload verified resources, and runs metadata scrapers for official sources (NCERT, DIKSHA, SWAYAM, NPTEL) with zero illegal media hosting.

---

## ⚡ Key Features
- **Resource Management**: Browse, search, filter, bookmark, and track learning progress.
- **Role-Based Access Control (RBAC)**: 5 distinct roles (`Student`, `Volunteer`, `Alumni`, `Admin`, `Super Admin`).
- **Community & Mentorship**: Text/image posts, nested comment trees, likes, and alumni career guidance tags.
- **Event & Announcement Engine**: Workshops, bootcamps, mentoring sessions, and notification delivery.
- **Legitimate Metadata Scraper**: Automated metadata crawler with title-hashing duplicate detection.
- **Admin Control Panel**: Approval queues, user role management, activity audit logs, and system metrics.

---

## 🛠️ Tech Stack
- **Frontend**: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS v4, shadcn/ui, Framer Motion, TanStack Query.
- **Backend**: FastAPI (Python), SQLAlchemy 2.0, Pydantic v2, Alembic.
- **Database**: PostgreSQL 16 (Docker for local development, Supabase PostgreSQL for production).
- **Authentication**: JWT Access & Refresh Tokens, Google OAuth2.
- **Storage**: Supabase Storage Buckets.

---

## 🏛️ System Architecture

```text
Client (Next.js 15 App Router)
          │
          ▼  REST API (/api/v1/)
FastAPI Controller Routes
          │
          ▼  Pydantic Validation & RBAC Middleware
Service Layer (Business Logic)
          │
          ▼  SQLAlchemy 2.0 Session
PostgreSQL / Supabase Database
```

---

## 📂 Folder Structure

```text
SAMIDHA-E-GURU/
├── frontend/                     # Next.js 15 App Router Frontend
│   ├── app/                      # Page Routes
│   ├── components/               # ui, common, layout, providers
│   ├── features/                 # Isolated Feature Modules (auth, resources, community, etc.)
│   ├── services/                 # API Clients
│   └── hooks/ lib/ utils/ types/ constants/ styles/ public/
├── backend/                      # FastAPI Backend REST API
│   ├── app/                      # api, core, db, models, schemas, services, scrapers, jobs
│   ├── database/                 # migrations, seeders, fixtures
│   └── tests/                    # Pytest test suite
├── docs/                         # Documentation Hub (12 Documents)
├── AGENTS.md                     # Universal AI guidelines & 11-step protocol
├── docker-compose.yml            # Docker environment (PostgreSQL + roadmap services)
├── README.md
└── .env.example
```

---

## 🚀 Installation & Setup

### Prerequisites
- Node.js 20+ & npm
- Python 3.12+ & venv
- Docker & Docker Compose

### 1. Clone & Configure
```bash
cp .env.example .env
```

### 2. Start PostgreSQL Database
```bash
docker-compose up -d
```

### 3. Setup Backend
```bash
cd backend
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
alembic upgrade head
python -m database.seeders.run_all
uvicorn app.main:app --reload --port 8000
```

### 4. Setup Frontend
```bash
cd frontend
npm install
npm run dev
```

---

## 🔑 Environment Variables
See [.env.example](file:///c:/Users/lenovo/OneDrive/Desktop/SAMIDHA%20E-GURU/.env.example) for required variables.

---

## 🗄️ Database & Storage Buckets

### Supabase Storage Buckets
- `avatars/` — User avatars (`5MB`)
- `resources/` — Verified PDFs & worksheets (`25MB`)
- `posts/` — Community post attachments (`5MB`)
- `events/` — Event posters (`5MB`)
- `thumbnails/` — Resource thumbnails (`2MB`)

---

## 🔒 Architecture Freeze

> After Phase 0 is completed, **Database Structure**, **Folder Structure**, **API Contracts**, **Documentation**, and **RBAC Matrix** become frozen.
> Any future structural change requires an explicit Architecture Review before implementation.

---

## 📄 License
MIT License — SAMIDHA Social Initiative.
