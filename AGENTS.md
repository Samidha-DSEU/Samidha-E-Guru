# AGENTS.md — Universal AI Agent Guidelines & Engineering Protocol

> **Project**: SAMIDHA E-GURU (Production-Grade SaaS Educational Platform)  
> **Target Audience**: School & College Students, Volunteers, Alumni, Admins, Super Admins  
> **Philosophy**: Minimalist (Apple/Linear), Ultra-Fast, Highly Accessible, Zero Technical Debt  

---

## 🔒 MANDATORY ARCHITECTURE FREEZE

> After Phase 0 is completed, **Database Structure**, **Folder Structure**, **API Contracts**, **Documentation**, and **RBAC Matrix** become frozen.
> Any future structural change requires an explicit Architecture Review before implementation. No AI agent or developer may alter these without explicit approval.

---

## 🛑 STRICT AI CONSTRAINTS (FORBIDDEN ACTIONS)

The AI Coding Assistant MUST NEVER:
1. **Change Database Schema**: Do not alter table definitions, add columns, or drop constraints without explicit architectural approval and Alembic migration.
2. **Rename Directories or APIs**: Do not rename folders, endpoint paths, or established database contracts.
3. **Bypass Architecture Layers**: Do not access database sessions directly inside API route handlers. Always pass through `Routes -> Services -> DB Session`.
4. **Use Dummy / Placeholder Code**: No `// TODO`, fake mock APIs, empty fallback returns, or commented-out logic pretending to be complete.
5. **Use `any` or Ignore Type Safety**: Strict TypeScript (`noImplicitAny`, zero `any`) on frontend; Pydantic v2 validation on backend.
6. **Hardcode Configuration**: No hardcoded URLs, localhost strings, API keys, or secret tokens. Always consume `.env` variables.
7. **Skip UI States**: Every page & component must explicitly implement **Loading State**, **Error State**, **Empty State**, and **Retry State**.
8. **Duplicate Components or APIs**: Audit existing utilities and components before writing new ones.

---

## ⚡ FEATURE DEVELOPMENT PROTOCOL (11-STEP SEQUENCE)

Every feature implementation MUST strictly follow this exact 11-step protocol:

```text
1. Understand Requirement  --> Read specifications & verify exact scope
2. Verify DB Tables        --> Inspect models, schema definitions, and constraints
3. Verify API Contract     --> Check endpoint parameters, schemas, and response formats
4. Design UI               --> Plan responsive, accessible, Apple-style layout & states
5. Implement Backend       --> Build Pydantic schemas, Service methods, & FastAPI routes
6. Implement Frontend      --> Build features, hooks, components & TanStack Query hooks
7. Integrate               --> Connect frontend API client with backend endpoints
8. Test                    --> Run backend pytest & frontend TypeScript build checks
9. Optimize                --> Remove redundant renders, optimize DB queries & bundle size
10. Document               --> Update API_SPEC.md or feature documentation
11. Mark Completed         --> Verify production readiness & report to user
```

---

## 📁 SYSTEM ARCHITECTURE & LAYERS

### Backend Architecture
```text
FastAPI Endpoint (api/v1/)
       │
       ▼
Request Middleware & RBAC Guard
       │
       ▼
Service Layer (services/) ──► Business Logic & Validation
       │
       ▼
SQLAlchemy Session (db/session.py) ──► PostgreSQL / Supabase
```

### Feature-Based Frontend Architecture
```text
Next.js 15 App Router (app/)
       │
       ▼
Feature Modules (features/<feature_name>/)
       ├── components/    --> UI components
       ├── hooks/         --> React / TanStack Query hooks
       ├── services/      --> Axios / Fetch API calls
       ├── schemas/       --> Zod form validation
       └── types/         --> Feature TypeScript interfaces
```

---

## 🔐 PERMISSIONS MATRIX (RBAC SUMMARY)

| Role | Access Level | Key Capabilities |
| :--- | :--- | :--- |
| **Student** | Public & Learner | Browse resources, bookmark, track progress, community posts, register for events |
| **Volunteer** | Contributor | Student capabilities + upload resources (pending review), organize events, announcements |
| **Alumni** | Mentor | Student capabilities + career posts, mentoring guidance, participate in events |
| **Admin** | Manager | User management, approve/reject pending resources, manage posts, events, reports, scrapers |
| **Super Admin** | Full Access | Complete platform management, assign admin roles, view system logs & activity traces |

---

## 🌿 GIT CONVENTIONS

- **Branches**: `main`, `develop`, `feature/<name>`, `fix/<name>`
- **Commit Prefixes**: `feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `perf:`, `style:`, `chore:`

---

## 📊 QUALITY CHECKLIST BEFORE MARKING COMPLETION

Before declaring any feature complete, verify:
- [ ] 100% Type-Safe (TypeScript zero warnings / Pydantic schemas validated)
- [ ] Responsive across Mobile, Tablet, Laptop, and Desktop
- [ ] Keyboard accessible & screen-reader friendly (WCAG compliant)
- [ ] Proper HTTP status codes (200, 201, 400, 401, 403, 404, 500)
- [ ] Unified API response format (`success`, `message`, `data`, `meta`, `errors`)
- [ ] Zero secret leaks or unhandled exception tracebacks exposed to client
