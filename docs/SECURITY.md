# SECURITY.md — Security Guidelines & Hardening Checklist

## 1. Authentication & Session Security
- **OAuth2 Token Flow**: Verification of Google ID token on backend.
- **JWT Storage**: Short-lived Access Token (30 mins) sent via Authorization header; Refresh Token (7 days) stored in HttpOnly, SameSite=Strict, Secure cookies.
- **Session Revocation**: User sessions tracked in `user_sessions` table for remote session termination.

## 2. Injection & XSS Defenses
- **SQL Injection**: All database operations must use SQLAlchemy 2.0 ORM expressions or parameterized text queries. No raw string interpolation in SQL.
- **XSS Protection**: React automatically escapes rendered strings. Any user-submitted HTML/Markdown (in community posts) must pass through DOMPurify sanitization.

## 3. CORS & Security Headers
- **CORS Setup**: Restricted to explicit frontend domain (`NEXT_PUBLIC_APP_URL`).
- **HTTP Headers**:
  - `Content-Security-Policy`: Standard strict CSP.
  - `X-Frame-Options`: DENY.
  - `X-Content-Type-Options`: nosniff.
  - `Referrer-Policy`: strict-origin-when-cross-origin.
