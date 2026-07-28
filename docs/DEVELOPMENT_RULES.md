# DEVELOPMENT_RULES.md — Engineering Standards & Code Quality

## 1. Core Principles
- **SOLID**: Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, Dependency Inversion.
- **DRY (Don't Repeat Yourself)**: Extract common utility functions into `utils/`, schemas into `schemas/`, components into `components/`.
- **KISS (Keep It Simple, Stupid)**: Prefer explicit readability over clever micro-optimizations.

---

## 2. Naming Conventions

### Frontend
- **Components**: PascalCase (e.g., `ResourceCard.tsx`, `EventRegistrationModal.tsx`).
- **Hooks**: camelCase starting with `use` (e.g., `useResourceFilter.ts`).
- **Utilities & Services**: camelCase (e.g., `formatDate.ts`, `authService.ts`).
- **Types & Interfaces**: PascalCase (e.g., `UserPermissions.ts`).
- **Constants**: UPPER_CASE (e.g., `MAX_FILE_SIZE_MB`).

### Backend
- **Modules & Files**: snake_case (e.g., `resource_service.py`, `auth_middleware.py`).
- **Classes**: PascalCase (e.g., `ResourceService`, `UserSessionManager`).
- **Functions & Variables**: snake_case (e.g., `get_approved_resources`).
- **Constants**: UPPER_CASE (e.g., `DEFAULT_PAGE_LIMIT = 20`).

---

## 3. Layer Separation Rules
- **Routes (`api/v1/`)**: Pure controllers. Validate request payload using Pydantic, check authorization, call Service method, return JSON response. ZERO inline SQL or database querying allowed inside route handlers.
- **Services (`services/`)**: Enforce business rules, handle domain calculations, orchestrate database transactions.
- **DB (`db/session.py`)**: Manages SQLAlchemy engine connection pool and session lifecycle (`get_db`).

---

## 4. Code Quality Enforcement
- **No `console.log` in production**: Use structured logger.
- **No `any` in TypeScript**: Explicit interface / type definitions for all parameters and return values.
- **Pydantic v2 Strict Models**: Validate input payloads and serialize output responses cleanly.
