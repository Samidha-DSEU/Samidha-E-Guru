# API_SPEC.md — REST API Specification (`/api/v1/`)

All APIs are versioned under `/api/v1/` and strictly return standard JSON responses.

---

## Standard Unified Response Format

### Success Response (200 OK / 201 Created)
```json
{
  "success": true,
  "message": "Resource fetched successfully.",
  "data": {},
  "meta": {
    "page": 1,
    "limit": 20,
    "total_items": 120,
    "total_pages": 6
  },
  "errors": null
}
```

### Error Response (400 / 401 / 403 / 404 / 422 / 500)
```json
{
  "success": false,
  "message": "Validation failed.",
  "data": null,
  "meta": null,
  "errors": [
    {
      "field": "email",
      "message": "Email already exists."
    }
  ]
}
```

---

## Standard Pagination Schema
Query parameters: `?page=1&limit=20&search=keyword&sort_by=created_at&sort_order=desc`

---

## Key Endpoints Overview

### 1. Authentication (`/api/v1/auth`)
- `POST /api/v1/auth/google` — Authenticate with Google ID token
- `POST /api/v1/auth/refresh` — Refresh access token using HTTP-only secure refresh token
- `POST /api/v1/auth/logout` — Revoke current session
- `POST /api/v1/auth/logout-all` — Revoke all user sessions across devices
- `GET /api/v1/auth/me` — Retrieve current authenticated user profile & role

### 2. Education Hierarchy (`/api/v1/education`)
- `GET /api/v1/education/classes` — List all classes
- `GET /api/v1/education/classes/{class_id}/subjects` — List subjects for a class
- `GET /api/v1/education/subjects/{subject_id}/chapters` — List chapters for a subject

### 3. Resources (`/api/v1/resources`)
- `GET /api/v1/resources` — Search and filter approved resources (`?class_id=&subject_id=&chapter_id=&resource_type_id=&search=`)
- `GET /api/v1/resources/{id}` — Get single resource details
- `POST /api/v1/resources` — Upload resource (Volunteer/Admin, status: pending)
- `POST /api/v1/resources/{id}/bookmark` — Toggle bookmark
- `POST /api/v1/resources/{id}/progress` — Update learning progress
- `POST /api/v1/resources/{id}/report` — Submit resource report

### 4. Community (`/api/v1/community`)
- `GET /api/v1/community/posts` — Search & list posts
- `POST /api/v1/community/posts` — Create post
- `GET /api/v1/community/posts/{id}` — Get post details & comments
- `POST /api/v1/community/posts/{id}/comments` — Add comment / reply
- `POST /api/v1/community/posts/{id}/like` — Toggle like

### 5. Events (`/api/v1/events`)
- `GET /api/v1/events` — List upcoming & past events
- `POST /api/v1/events` — Create event (Volunteer/Admin)
- `POST /api/v1/events/{id}/register` — Register for event

### 6. Announcements & Notifications (`/api/v1/communications`)
- `GET /api/v1/communications/announcements` — List active announcements
- `GET /api/v1/communications/notifications` — List user notifications
- `PATCH /api/v1/communications/notifications/{id}/read` — Mark notification read

### 7. Administration (`/api/v1/admin`)
- `GET /api/v1/admin/dashboard` — Platform statistics & health metrics
- `GET /api/v1/admin/pending-resources` — List pending uploads
- `PATCH /api/v1/admin/pending-resources/{id}/approve` — Approve resource
- `PATCH /api/v1/admin/pending-resources/{id}/reject` — Reject resource
- `GET /api/v1/admin/users` — User role management
- `PATCH /api/v1/admin/users/{id}/role` — Update user role (Super Admin only)
- `GET /api/v1/admin/scrapers` — Scraper job status & manual trigger
- `GET /api/v1/admin/activity-logs` — Audit log reader
