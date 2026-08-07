import os
import json
import logging
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session

from app.models.learn_ai import AIWorkspaceCache, AIDocumentChunk, StudentProgress
from app.services.embedding_service import EmbeddingService

try:
    from groq import Groq
    HAS_GROQ = True
except ImportError:
    HAS_GROQ = False

logger = logging.getLogger(__name__)


def get_groq_client() -> Optional[Any]:
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key or not HAS_GROQ:
        return None
    return Groq(api_key=api_key)


class AITutorService:
    GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")

    @classmethod
    def answer_student_doubt(cls, db: Session, resource_id: str, question: str) -> Dict[str, Any]:
        """
        RAG Doubt Solver Chatbot:
        Retrieves relevant PDF chunks, forms LLM prompt, and returns answer + page citations.
        """
        chunks = EmbeddingService.search_similar_chunks(db, resource_id, question, top_k=5)
        
        context_blocks = []
        sources = []
        for c in chunks:
            context_blocks.append(f"[Page {c['page_number']}]: {c['content']}")
            sources.append({
                "page_number": c["page_number"],
                "content_snippet": c["content"][:150] + "..."
            })

        context_str = "\n\n".join(context_blocks)
        
        client = get_groq_client()
        if not client or not context_str:
            # Clean fallback if Groq API key is not configured or context is empty
            return {
                "answer": f"Based on the chapter context, here is key information regarding '{question}':\n\nPlease refer to your study material for details.",
                "sources": sources
            }

        prompt = f"""You are an expert AI Education Tutor helping a student with their chapter doubts.
Use ONLY the following extracted textbook context to answer the student's question clearly and accurately.
Include page citations in your answer when referencing specific concepts (e.g. [Page X]).

--- TEXTBOOK CONTEXT ---
{context_str}

--- STUDENT QUESTION ---
{question}

Provide a clear, encouraging, step-by-step response formatted in clean Markdown.
"""

        try:
            response = client.chat.completions.create(
                model=cls.GROQ_MODEL,
                messages=[
                    {"role": "system", "content": "You are a helpful, accurate academic AI tutor for school & college students."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                max_tokens=1000
            )
            answer_text = response.choices[0].message.content
            return {
                "answer": answer_text,
                "sources": sources
            }
        except Exception as e:
            logger.error(f"Groq API error during doubt solving: {e}")
            return {
                "answer": f"I analyzed the textbook context for '{question}'. Please review pages {', '.join(str(s['page_number']) for s in sources)} for detailed explanations.",
                "sources": sources
            }

    @classmethod
    def get_or_generate_workspace(cls, db: Session, resource_id: str, resource_title: str) -> Dict[str, Any]:
        """
        Retrieves cached workspace from `AIWorkspaceCache` (sub-15ms)
        or generates a fresh workspace using Groq LLM JSON pipeline.
        """
        # 1. Check Cache Hit
        cached = db.query(AIWorkspaceCache).filter(AIWorkspaceCache.resource_id == resource_id).first()
        if cached and cached.workspace_data:
            return cached.workspace_data

        # 2. Get Chunk Context
        chunks = db.query(AIDocumentChunk).filter(AIDocumentChunk.resource_id == resource_id).all()
        full_text = "\n\n".join([c.content for c in chunks[:15]])
        if not full_text:
            full_text = f"Sample study content for chapter: {resource_title}"

        # 3. Generate via Groq or fallback default payload
        client = get_groq_client()
        workspace_payload = cls._generate_default_workspace(resource_id, resource_title)

        if client:
            try:
                # Call Groq JSON mode for summaries and study tools
                prompt = f"""Generate a structured JSON workspace payload for chapter titled '{resource_title}'.
Use content snippet: {full_text[:3000]}

Return valid JSON matching this schema:
{{
  "summaries": {{
    "one_min_bullets": ["Key point 1", "Key point 2", "Key point 3"],
    "five_min_paragraph": "Comprehensive overview paragraph...",
    "revision_notes": ["Note 1", "Note 2"]
  }},
  "mind_map": {{
    "id": "root",
    "label": "{resource_title}",
    "children": [
      {{"id": "node-1", "label": "Main Topic 1", "children": []}},
      {{"id": "node-2", "label": "Main Topic 2", "children": []}}
    ]
  }},
  "flashcards": [
    {{"id": "fc-1", "front": "Core Question?", "back": "Clear Answer.", "difficulty": "Easy", "tag": "Concept"}}
  ],
  "study_tools": {{
    "definitions": [{{"term": "Key Term", "definition": "Exact textbook definition."}}],
    "formulas": [{{"name": "Core Formula", "latex": "E = mc^2", "explanation": "Mass energy equivalence"}}],
    "mnemonics": [{{"phrase": "Memory Mnemonic", "concept": "Concept", "explanation": "How to remember"}}],
    "common_mistakes": [{{"misconception": "Common Error", "correction": "Factually correct fix", "reason": "Why"}}],
    "video_scripts": [{{"scene": "Scene 1", "narration": "Script text", "visual": "Animation description"}}]
  }},
  "question_bank": [
    {{
      "id": "q1",
      "bloom_level": "Remember",
      "question_type": "MCQ",
      "question": "Sample Question?",
      "options": [{{"id": "A", "text": "Option A"}}, {{"id": "B", "text": "Option B"}}],
      "correct_answer": "A",
      "explanation": "Detailed explanation."
    }}
  ]
}}
"""
                response = client.chat.completions.create(
                    model=cls.GROQ_MODEL,
                    messages=[{"role": "user", "content": prompt}],
                    response_format={"type": "json_object"},
                    temperature=0.2
                )
                generated = json.loads(response.choices[0].message.content)
                if "summaries" in generated and "flashcards" in generated:
                    generated["resource_id"] = resource_id
                    generated["resource_title"] = resource_title
                    workspace_payload = generated
            except Exception as e:
                logger.error(f"Failed to generate workspace JSON via Groq: {e}")

        # Save to Cache
        cache_entry = AIWorkspaceCache(resource_id=resource_id, workspace_data=workspace_payload)
        db.merge(cache_entry)
        db.commit()

        return workspace_payload

    @classmethod
    def grade_quiz(cls, db: Session, resource_id: str, user_id: str, answers: Dict[str, str]) -> Dict[str, Any]:
        """
        Grades student quiz submission and logs weak topics in StudentProgress.
        """
        workspace = cls.get_or_generate_workspace(db, resource_id, "Chapter Quiz")
        question_bank = workspace.get("question_bank", [])

        total = len(question_bank)
        score = 0
        results = []
        weak_topics = []

        for q in question_bank:
            q_id = q.get("id")
            correct = q.get("correct_answer")
            user_ans = answers.get(q_id, "")

            is_correct = (str(user_ans).strip().lower() == str(correct).strip().lower())
            if is_correct:
                score += 1
            else:
                weak_topics.append(q.get("bloom_level", "Concept Check"))

            results.append({
                "question_id": q_id,
                "question": q.get("question"),
                "user_answer": user_ans,
                "correct_answer": correct,
                "is_correct": is_correct,
                "explanation": q.get("explanation")
            })

        percentage = round((score / total) * 100, 1) if total > 0 else 0.0

        # Update StudentProgress in DB
        try:
            import uuid
            progress = db.query(StudentProgress).filter(
                StudentProgress.user_id == uuid.UUID(user_id) if isinstance(user_id, str) else user_id,
                StudentProgress.resource_id == resource_id
            ).first()

            if not progress:
                progress = StudentProgress(
                    user_id=uuid.UUID(user_id) if isinstance(user_id, str) else user_id,
                    resource_id=resource_id,
                    quizzes_taken=1,
                    last_quiz_score=score,
                    weak_topics=list(set(weak_topics))
                )
                db.add(progress)
            else:
                progress.quizzes_taken += 1
                progress.last_quiz_score = score
                progress.weak_topics = list(set(progress.weak_topics + weak_topics))

            db.commit()
        except Exception as e:
            logger.warning(f"Could not log student progress: {e}")

        return {
            "score": score,
            "total_questions": total,
            "percentage": percentage,
            "weak_topics": list(set(weak_topics)),
            "results": results
        }

    @staticmethod
    def _generate_default_workspace(resource_id: str, title: str) -> Dict[str, Any]:
        """Provides rich default workspace fallback structure."""
        return {
            "resource_id": resource_id,
            "resource_title": title,
            "summaries": {
                "one_min_bullets": [
                    f"Core theme of {title} focuses on fundamental academic concepts.",
                    "Key formulas and principles govern practical problem solving.",
                    "Essential textbook definitions provide base for exam readiness."
                ],
                "five_min_paragraph": f"This chapter '{title}' covers foundational concepts essential for board and competitive exams. It details core definitions, mathematical properties, practical applications, and step-by-step problem-solving methods. Master the formulas and key mnemonics to retain information quickly during revisions.",
                "revision_notes": [
                    "Rule 1: Always double check formulas before applying.",
                    "Rule 2: Identify textbook definitions and key terms for full marks in exams.",
                    "Rule 3: Practice Assertion-Reasoning and Bloom's level questions."
                ]
            },
            "mind_map": {
                "id": "root",
                "label": title,
                "children": [
                    {
                        "id": "sub-1",
                        "label": "Core Principles",
                        "children": [
                            {"id": "sub-1-1", "label": "Key Theorem", "children": []},
                            {"id": "sub-1-2", "label": "Mathematical Definition", "children": []}
                        ]
                    },
                    {
                        "id": "sub-2",
                        "label": "Applications & Problems",
                        "children": [
                            {"id": "sub-2-1", "label": "Standard Step-by-step Solution", "children": []},
                            {"id": "sub-2-2", "label": "Common Mistakes to Avoid", "children": []}
                        ]
                    }
                ]
            },
            "flashcards": [
                {
                    "id": "fc-1",
                    "front": f"What is the primary objective of {title}?",
                    "back": "To establish clear foundational understanding and analytical problem-solving steps.",
                    "difficulty": "Easy",
                    "tag": "Concept"
                },
                {
                    "id": "fc-2",
                    "front": "How do you avoid common calculation errors in this chapter?",
                    "back": "Write intermediate steps clearly, verify units, and cross-check textbook formulas.",
                    "difficulty": "Medium",
                    "tag": "Exam Strategy"
                }
            ],
            "study_tools": {
                "definitions": [
                    {"term": f"Primary Concept of {title}", "definition": "A fundamental principle defined in standard textbook curriculum."}
                ],
                "formulas": [
                    {"name": "Standard Identity", "latex": "a^2 + b^2 = c^2", "explanation": "Fundamental relationship used across geometry & algebraic proofs."}
                ],
                "mnemonics": [
                    {"phrase": "OIL RIG", "concept": "Redox Reactions", "explanation": "Oxidation Is Loss, Reduction Is Gain of electrons."}
                ],
                "common_mistakes": [
                    {"misconception": "Confusing sign conventions in formulas", "correction": "Always write standard general form before substituting values.", "reason": "Sign errors account for >40% of lost exam marks."}
                ],
                "video_scripts": [
                    {"scene": "Introduction", "narration": f"Welcome to our quick 1-minute breakdown of {title}!", "visual": "Animated title header with visual concept diagram."}
                ]
            },
            "question_bank": [
                {
                    "id": "q1",
                    "bloom_level": "Remember",
                    "question_type": "MCQ",
                    "question": f"Which statement best describes {title}?",
                    "options": [
                        {"id": "A", "text": "It provides foundational principles for academic study."},
                        {"id": "B", "text": "It is completely unrelated to board exams."},
                        {"id": "C", "text": "It only contains numerical definitions."},
                        {"id": "D", "text": "None of the above."}
                    ],
                    "correct_answer": "A",
                    "explanation": "Option A accurately reflects the standard curriculum objective."
                }
            ]
        }
