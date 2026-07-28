# DEPLOYMENT.md — Production Deployment Guide

## Architecture Deployment Blueprint
- **Frontend**: Vercel (Next.js 15 App Router deployment with automatic edge routing & static optimization).
- **Backend API**: Railway / Render (FastAPI Python container with Uvicorn worker process).
- **Database**: Supabase PostgreSQL (Managed cloud PostgreSQL with automated backups).
- **Storage**: Supabase Storage Buckets (`samidha-storage` for public resource images and PDF attachments).

---

## Production Environment Variables Checklist

### Frontend (Vercel)
```ini
NEXT_PUBLIC_API_URL=https://api.samidha-eguru.org/api/v1
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### Backend (Railway / Render)
```ini
DATABASE_URL=postgresql://user:password@db.supabase.co:5432/postgres
JWT_SECRET=production-secret-min-32-chars
JWT_REFRESH_SECRET=production-refresh-secret-min-32-chars
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ENVIRONMENT=production
```
