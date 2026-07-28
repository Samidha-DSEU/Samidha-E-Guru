# ARCHITECTURE.md — System Architecture & Layering Specification

> **Status**: Frozen (Phase 0 Complete)  
> **Rule**: Layer boundaries are strict. No API route handler may bypass the Service layer to query the DB directly.

---

## 1. High-Level Architecture Diagram

```text
       ┌──────────────────────────────────────────────┐
       │   Next.js 15 Web Application (Frontend)       │
       │   App Router + Feature Modules + shadcn/ui    │
       └──────────────────────┬───────────────────────┘
                              │ HTTPS / REST JSON
                              ▼
       ┌──────────────────────────────────────────────┐
       │     FastAPI API Controllers (backend/app/api) │
       │     Pydantic Validation & RBAC Middleware    │
       └──────────────────────┬───────────────────────┘
                              │ Service Calls
                              ▼
       ┌──────────────────────────────────────────────┐
       │    Service Layer (backend/app/services)      │
       │    Business Logic, Authorization & Rules     │
       └──────────────────────┬───────────────────────┘
                              │ SQLAlchemy 2.0 ORM
                              ▼
       ┌──────────────────────────────────────────────┐
       │   PostgreSQL / Supabase Database Layer        │
       └──────────────────────────────────────────────┘
```

---

## 2. Monorepo Directory Organization

- `frontend/features/<feature_name>/`: Self-contained modules containing UI components, custom hooks, API service calls, Zod schemas, and TypeScript interfaces.
- `backend/app/services/`: Isolated business service classes handling transaction logic and validations.
- `backend/database/seeders/`: Automated initial database seeders.

---

## 3. Mandatory Architecture Freeze Rule

> After Phase 0 is completed, **Database Structure**, **Folder Structure**, **API Contracts**, **Documentation**, and **RBAC Matrix** become frozen.
> Any future structural change requires an explicit Architecture Review before implementation. No AI agent or developer may modify these without approval.
