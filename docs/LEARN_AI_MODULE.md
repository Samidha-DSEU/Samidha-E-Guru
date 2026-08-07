# 🧠 SAMIDHA E-GURU — Learn with AI Module Architecture & Engineering Documentation

> **Module Name**: `Learn with AI Workspace & RAG Tutor Engine`  
> **Target Audience**: Students, Volunteers, Educators, System Architects  
> **Tech Stack**: Next.js 15 (React 19), FastAPI, PyMuPDF, pdfplumber, SentenceTransformers (384-d), Groq LLM (`llama-3.3-70b-versatile`), MongoDB Atlas (`samidha_ai_db`)  

---

## 📌 1. System Overview

The **Learn with AI** module is an interactive, multi-modal educational workspace embedded within SAMIDHA E-GURU. It transforms static NCERT textbook PDFs and study notes into an intelligent, active-learning study environment.

Instead of passively reading PDF files, students interact with:
1. **📄 NCERT PDF Document Previewer**: Integrated document viewer with Google Docs fallback, fullscreen mode, and direct downloads.
2. **💬 AI Chapter Doubt Solver (RAG Chatbot)**: Instant textbook doubt resolution with cited page numbers (`[Page 3]`).
3. **📝 Revision Summaries**: 1-Minute Bullet Points, 5-Minute Overview Paragraph, and Core Revision Rules.
4. **🧠 4-Level Visual Mind Map**: Collapsible concept hierarchy covering definitions, proofs, applications, and pitfalls.
5. **🎴 3D Adaptive Flashcards**: Interactive 3D flip cards with right-side-up orientation, tag filtering, and mastery tracking.
6. **🛠️ Study Tools Suite**: Textbook definitions, rendered LaTeX formulas, memory mnemonics, common exam traps, and video scripts.
7. **✍️ Bloom's Taxonomy Practice Quiz**: 6-level cognitive practice engine (Remembering to Creating) with instant scoring and weak topic tracking.

---

## 🏗️ 2. Microservice Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                 Next.js 15 Frontend (Vercel)                │
│             https://samidha-e-guru.vercel.app               │
│ - PDF Previewer Component                                   │
│ - Learn AI Workspace Tabbed UI                              │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTP / JSON REST API
                               ▼
┌─────────────────────────────────────────────────────────────┐
│            Main FastAPI Gateway (Render Service 1)          │
│            https://samidha-e-guru.onrender.com             │
│ - Authentication & RBAC Middleware                          │
│ - Core Relational DB (Users, Roles, Resources)              │
│ - Thin HTTP Proxy forwarding to Learn AI Service            │
└──────────────────────────────┬──────────────────────────────┘
                               │ Internal HTTP (JWT Secure)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│          Learn AI Microservice (Render Service 2)           │
│          https://samidha-learn-ai-service.onrender.com      │
│ - PyMuPDF & pdfplumber PDF Extraction Engine                │
│ - SentenceTransformers (384-d Vector Generator)             │
│ - Groq LLM Inference (llama-3.3-70b-versatile)              │
│ - PyMongo Client with TLS CA Bundle                         │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│             MongoDB Atlas Database (samidha_ai_db)          │
│ - ai_documents (File Metadata & SHA-256 Hashes)             │
│ - ai_chunks (Text Content + 384-d Vector Embeddings)        │
│ - ai_workspace_caches (Sub-15ms Pre-indexed Workspaces)    │
│ - student_progress (Quiz Performance & Analytics)           │
└─────────────────────────────────────────────────────────────┘
```

---

## 🗄️ 3. Database Schema & Data Models (MongoDB Atlas)

### Collection 1: `ai_documents`
Stores master metadata for ingested textbook PDFs.
```json
{
  "_id": "ObjectId('65c123456789abcdef012345')",
  "resource_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
  "title": "NCERT Class 10 Mathematics: Chapter 1 - Real Numbers",
  "file_hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  "total_pages": 18,
  "status": "ready",
  "created_at": "2026-08-07T22:30:00Z"
}
```

### Collection 2: `ai_chunks` (Vector Store)
Stores text paragraphs, Markdown tables, and 384-dimensional dense vector embeddings.
```json
{
  "_id": "ObjectId('65c123456789abcdef012346')",
  "resource_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
  "page_number": 3,
  "section_heading": "1.2 Euclid's Division Lemma",
  "content": "Given positive integers a and b, there exist unique integers q and r satisfying a = bq + r, where 0 <= r < b...",
  "embedding": [0.0123, -0.0456, 0.0789, "... 384 float dimensions ..."],
  "created_at": "2026-08-07T22:30:00Z"
}
```

### Collection 3: `ai_workspace_caches`
Stores full pre-indexed academic workspace JSON payloads for sub-15ms client loads.
```json
{
  "_id": "ObjectId('65c123456789abcdef012347')",
  "resource_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
  "workspace_data": {
    "resource_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "resource_title": "NCERT Class 10 Mathematics: Chapter 1 - Real Numbers",
    "pdf_url": "https://ncert.nic.in/textbook/pdf/jemh101.pdf",
    "summaries": {},
    "mind_map": {},
    "flashcards": [],
    "study_tools": {},
    "question_bank": []
  },
  "updated_at": "2026-08-07T22:30:00Z"
}
```

---

## 🔌 4. API Endpoints & Contract Specifications

### 1. Retrieve Workspace Payload
- **Endpoint**: `GET /api/v1/learn-ai/workspace/{resource_id}`
- **Method**: `GET`
- **Response**:
```json
{
  "success": true,
  "message": "Workspace retrieved from MongoDB Atlas.",
  "data": {
    "resource_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "resource_title": "NCERT Class 10 Mathematics: Chapter 1 - Real Numbers",
    "pdf_url": "https://ncert.nic.in/textbook/pdf/jemh101.pdf",
    "summaries": {
      "one_min_bullets": ["Core theme focuses on fundamental properties.", "Euclid's Division Lemma governs divisibility."],
      "five_min_paragraph": "Comprehensive theoretical and practical overview...",
      "revision_notes": ["Rule 1: Always state general definitions first."]
    },
    "mind_map": {
      "id": "root",
      "label": "Real Numbers",
      "children": [{"id": "b1", "label": "1. Foundational Concepts", "children": []}]
    },
    "flashcards": [
      {"id": "fc-1", "front": "What is Euclid's Lemma?", "back": "a = bq + r (0 <= r < b)", "difficulty": "Easy", "tag": "Concept"}
    ],
    "study_tools": {
      "definitions": [{"term": "Real Number", "definition": "A continuous line value."}],
      "formulas": [{"name": "Standard Identity", "latex": "a = bq + r", "explanation": "Division relation"}],
      "mnemonics": [{"phrase": "OIL RIG", "concept": "Redox", "explanation": "Oxidation Is Loss"}],
      "common_mistakes": [{"misconception": "Sign errors", "correction": "Draw coordinate diagram", "reason": "Avoid sign loss"}],
      "video_scripts": []
    },
    "question_bank": [
      {
        "id": "q1",
        "bloom_level": "Remembering",
        "question_type": "MCQ",
        "question": "What condition must remainder r satisfy in a = bq + r?",
        "options": [{"id": "A", "text": "0 <= r < b"}, {"id": "B", "text": "r > b"}],
        "correct_answer": "A",
        "explanation": "By definition, r is non-negative and strictly smaller than b."
      }
    ]
  }
}
```

### 2. AI Doubt Solver Query (RAG Chatbot)
- **Endpoint**: `POST /api/v1/learn-ai/query`
- **Request Body**:
```json
{
  "resource_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
  "question": "How do you prove square root of 2 is irrational?"
}
```
- **Response**:
```json
{
  "success": true,
  "message": "Doubt query solved successfully.",
  "data": {
    "answer": "To prove sqrt(2) is irrational using proof by contradiction:\nAssume sqrt(2) = a/b where a and b are co-prime integers [Page 5]...",
    "sources": [
      {"page_number": 5, "content_snippet": "Theorem 1.4: Square root of 2 is irrational..."}
    ]
  }
}
```

### 3. Practice Quiz Submission
- **Endpoint**: `POST /api/v1/learn-ai/quiz/submit`
- **Request Body**:
```json
{
  "resource_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
  "user_id": "student-guest",
  "answers": {"q1": "A", "q2": "A"}
}
```
- **Response**:
```json
{
  "success": true,
  "message": "Quiz evaluated successfully.",
  "data": {
    "score": 2,
    "total_questions": 2,
    "percentage": 100.0,
    "weak_topics": [],
    "results": [
      {
        "question_id": "q1",
        "question": "What condition must remainder r satisfy in a = bq + r?",
        "user_answer": "A",
        "correct_answer": "A",
        "is_correct": true,
        "explanation": "Correct! r satisfies 0 <= r < b."
      }
    ]
  }
}
```

---

## ⚡ 5. Performance & Memory Guarantees

1. **Memory Capping (< 60MB RAM)**:
   - Configured single-thread environment variables (`OMP_NUM_THREADS=1`, `TORCH_NUM_THREADS=1`) and lazy module imports.
   - Prevents memory spikes on cloud containers, running safely within 512MB RAM limits.
2. **Sub-15ms Cached Response**:
   - Once pre-indexed, workspace API requests return from MongoDB Atlas in **< 15 milliseconds**.
3. **SHA-256 Deduplication**:
   - Calculates file byte hashes before PDF parsing; skips duplicated PDFs in **< 5 milliseconds**.
4. **Non-Blocking Background Tasks**:
   - API endpoints return immediately (< 20ms) while PDF parsing runs asynchronously in `BackgroundTasks`.

---

## 🚀 6. Render Environment Variables Reference

| Environment Variable | Value / Description | Service |
| :--- | :--- | :--- |
| `MONGODB_URL` | `mongodb+srv://user:pass@cluster.mongodb.net/?retryWrites=true&w=majority` | Learn AI Microservice |
| `MONGODB_DB_NAME` | `samidha_ai_db` | Learn AI Microservice |
| `GROQ_API_KEY` | `gsk_...` (Groq API Key) | Learn AI Microservice |
| `LEARN_AI_SERVICE_URL` | `https://samidha-learn-ai-service.onrender.com` | Main FastAPI Gateway |
| `NEXT_PUBLIC_API_URL` | `https://samidha-e-guru.onrender.com/api/v1` | Next.js Frontend |
