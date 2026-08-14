import json
import logging
from typing import Dict, Any, List
from groq import Groq
from pymongo.database import Database
from config import settings
from services.embedding_service import EmbeddingService

logger = logging.getLogger("learn_ai_rag")

class RAGService:

    @classmethod
    def get_groq_client(cls) -> Groq:
        if settings.GROQ_API_KEY:
            return Groq(api_key=settings.GROQ_API_KEY)
        return None

    @classmethod
    def solve_doubt(cls, db: Database, resource_id: str, question: str) -> Dict[str, Any]:
        """
        RAG Doubt Solver:
        Queries MongoDB `ai_chunks` via vector search, constructs context with page numbers,
        and generates cited response via Groq LLM.
        """
        similar_chunks = EmbeddingService.search_similar_chunks(db, resource_id, question, top_k=4)

        context_blocks = []
        sources = []
        for c in similar_chunks:
            page_num = c.get("page_number", 1)
            content = c.get("content", "")
            context_blocks.append(f"[Page {page_num}]: {content}")
            sources.append({"page_number": page_num, "content_snippet": content[:180] + "..."})

        context_str = "\n\n".join(context_blocks)
        client = cls.get_groq_client()

        if client and context_str:
            try:
                system_prompt = (
                    "You are an expert AI Academic Tutor for SAMIDHA E-GURU. "
                    "Answer the student's question clearly, concisely, and accurately based on the textbook excerpts provided. "
                    "Cite relevant page numbers like [Page X] when referencing facts."
                )
                user_message = f"Textbook Excerpts:\n{context_str}\n\nStudent Question: {question}"

                response = client.chat.completions.create(
                    model=settings.GROQ_MODEL,
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_message}
                    ],
                    temperature=0.2,
                    max_tokens=600
                )
                answer_text = response.choices[0].message.content
                return {"answer": answer_text, "sources": sources}
            except Exception as e:
                err_str = str(e)
                logger.error(f"Groq API call error: {err_str}")
                is_rate_limit = "429" in err_str or "rate_limit" in err_str.lower() or "limit" in err_str.lower()
                status_code = 429 if is_rate_limit else 400
                raise ValueError(f"LLM Error ({status_code}): {err_str}")

        if not client:
            raise ValueError("LLM Configuration Error: GROQ_API_KEY is missing or invalid on server.")

        if not context_str:
            raise ValueError("Context Error: No parsed PDF chunks found for this resource in MongoDBAtlas vector store.")

    @classmethod
    def get_or_generate_workspace(cls, db: Database, resource_id: str, resource_title: str, pdf_url: str = "") -> Dict[str, Any]:
        """
        Retrieves cached workspace from MongoDB `ai_workspace_caches` (sub-15ms)
        or returns workspace metadata with default chat state (without pre-generating all modules).
        """
        cache_coll = db["ai_workspace_caches"]
        cached = cache_coll.find_one({"resource_id": resource_id})
        if cached and "workspace_data" in cached:
            data = cached["workspace_data"]
            if pdf_url:
                data["pdf_url"] = pdf_url
            return data

        # Default minimal workspace metadata without pre-generating heavy modules
        empty_workspace = {
            "resource_id": resource_id,
            "resource_title": resource_title,
            "pdf_url": pdf_url or "https://ncert.nic.in/textbook/pdf/jemh101.pdf",
            "summaries": None,
            "mind_map": None,
            "flashcards": None,
            "study_tools": None,
            "question_bank": None
        }
        return empty_workspace

    @classmethod
    def generate_workspace_section(cls, db: Database, resource_id: str, section: str, resource_title: str, pdf_url: str = "") -> Dict[str, Any]:
        """
        Generates a specific workspace section on demand via Groq LLM (or returns from MongoDB cache).
        Section options: 'summaries', 'mindmap', 'flashcards', 'tools', 'quiz'
        """
        cache_coll = db["ai_workspace_caches"]
        cached = cache_coll.find_one({"resource_id": resource_id})
        workspace_data = cached.get("workspace_data", {}) if cached else {}

        # Normalize section key mapping
        sec_key_map = {
            "summaries": "summaries",
            "mindmap": "mind_map",
            "flashcards": "flashcards",
            "tools": "study_tools",
            "quiz": "question_bank"
        }
        target_key = sec_key_map.get(section, section)

        # 1. Return from cache if already generated
        if workspace_data and workspace_data.get(target_key) is not None:
            return {target_key: workspace_data[target_key]}

        # 2. Check LLM Client
        client = cls.get_groq_client()
        if not client:
            raise ValueError("LLM Configuration Error: GROQ_API_KEY is missing or invalid on server.")

        # 3. Load text chunks from MongoDB
        chunks_coll = db["ai_chunks"]
        chunks = list(chunks_coll.find({"resource_id": resource_id}).limit(15))
        full_text = "\n\n".join([c.get("content", "") for c in chunks])
        if not full_text:
            full_text = f"Academic study content for chapter titled: {resource_title}"

        # 4. Construct Section-Specific Prompt
        prompts = {
            "summaries": f"""Generate detailed academic summaries for textbook chapter '{resource_title}'.
Content snippet: {full_text[:3500]}
Return valid JSON:
{{
  "summaries": {{
    "one_min_bullets": ["Key point 1", "Key point 2", "Key point 3", "Key point 4"],
    "five_min_paragraph": "Comprehensive theoretical and practical overview...",
    "revision_notes": ["Rule 1: Always verify key formulas.", "Rule 2: Note sign conventions."]
  }}
}}""",
            "mindmap": f"""Generate a 4-branch hierarchical Mind Map JSON for textbook chapter '{resource_title}'.
Content snippet: {full_text[:3500]}
Return valid JSON:
{{
  "mind_map": {{
    "id": "root",
    "label": "{resource_title}",
    "children": [
      {{"id": "b1", "label": "1. Foundational Concepts", "children": [{{"id": "b1-1", "label": "Definitions & Axioms", "children": []}}]}},
      {{"id": "b2", "label": "2. Core Theorems & Proofs", "children": [{{"id": "b2-1", "label": "Standard Identities", "children": []}}]}},
      {{"id": "b3", "label": "3. Problem Solving Applications", "children": [{{"id": "b3-1", "label": "Numerical Methods", "children": []}}]}},
      {{"id": "b4", "label": "4. Common Traps & Strategy", "children": [{{"id": "b4-1", "label": "Exam Mistakes", "children": []}}]}}
    ]
  }}
}}""",
            "flashcards": f"""Generate 6 interactive 3D study flashcards for textbook chapter '{resource_title}'.
Content snippet: {full_text[:3500]}
Return valid JSON:
{{
  "flashcards": [
    {{"id": "fc-1", "front": "What is the primary theorem of {resource_title}?", "back": "Detailed definition and formula.", "difficulty": "Easy", "tag": "Concept"}},
    {{"id": "fc-2", "front": "How do you solve standard numerical problems?", "back": "Step-by-step methodology.", "difficulty": "Medium", "tag": "Application"}},
    {{"id": "fc-3", "front": "What is the proof procedure?", "back": "Proof by contradiction steps.", "difficulty": "Hard", "tag": "Proof"}},
    {{"id": "fc-4", "front": "What is a frequent exam mistake?", "back": "Sign convention errors.", "difficulty": "Medium", "tag": "Exam Trap"}},
    {{"id": "fc-5", "front": "How to verify solutions?", "back": "Domain check verification.", "difficulty": "Hard", "tag": "Verification"}},
    {{"id": "fc-6", "front": "What is the key revision rule?", "back": "Daily formula recite step.", "difficulty": "Easy", "tag": "Strategy"}}
  ]
}}""",
            "tools": f"""Generate study tools (Definitions, LaTeX Formulas, Mnemonics, Common Mistakes, Video Scripts) for '{resource_title}'.
Content snippet: {full_text[:3500]}
Return valid JSON:
{{
  "study_tools": {{
    "definitions": [{{"term": "Fundamental Identity", "definition": "Key mathematical relationship."}}],
    "formulas": [{{"name": "Standard Identity", "latex": "a = bq + r", "explanation": "Division relationship."}}],
    "mnemonics": [{{"phrase": "OIL RIG", "concept": "Redox", "explanation": "Oxidation Is Loss"}}],
    "common_mistakes": [{{"misconception": "Sign errors", "correction": "Write standard form first", "reason": "Avoid sign loss"}}],
    "video_scripts": [{{"scene": "Intro", "narration": "Welcome to chapter guide", "visual": "Title animation"}}]
  }}
}}""",
            "quiz": f"""Generate 6 Bloom's Taxonomy practice questions (Remembering, Understanding, Applying, Analyzing, Evaluating, Creating) for '{resource_title}'.
Content snippet: {full_text[:3500]}
Return valid JSON:
{{
  "question_bank": [
    {{
      "id": "q1",
      "bloom_level": "Remembering",
      "question_type": "MCQ",
      "question": "What is the primary condition?",
      "options": [{{"id": "A", "text": "Option A"}}, {{"id": "B", "text": "Option B"}}, {{"id": "C", "text": "Option C"}}, {{"id": "D", "text": "Option D"}}],
      "correct_answer": "A",
      "explanation": "Detailed explanation."
    }}
  ]
}}"""
        }

        prompt = prompts.get(section, prompts["summaries"])

        # 5. Invoke Groq API
        try:
            resp = client.chat.completions.create(
                model=settings.GROQ_MODEL,
                messages=[{"role": "user", "content": prompt}],
                response_format={"type": "json_object"},
                temperature=0.2
            )
            generated = json.loads(resp.choices[0].message.content)
            
            # Merge into MongoDB workspace cache
            if target_key in generated:
                workspace_data[target_key] = generated[target_key]
                workspace_data["resource_id"] = resource_id
                workspace_data["resource_title"] = resource_title
                workspace_data["pdf_url"] = pdf_url or "https://ncert.nic.in/textbook/pdf/jemh101.pdf"
                
                cache_coll.update_one(
                    {"resource_id": resource_id},
                    {"$set": {"resource_id": resource_id, "workspace_data": workspace_data}},
                    upsert=True
                )
                return {target_key: generated[target_key]}
            else:
                return generated
        except Exception as err:
            err_str = str(err)
            logger.error(f"Groq section generation error for '{section}': {err_str}")
            is_rate_limit = "429" in err_str or "rate_limit" in err_str.lower() or "limit" in err_str.lower() or "blocked" in err_str.lower() or "permission" in err_str.lower()
            status_code = 429 if is_rate_limit else 400
            raise ValueError(f"LLM Error ({status_code}): {err_str}")

    @classmethod
    def grade_quiz(cls, db: Database, resource_id: str, user_id: str, answers: Dict[str, str]) -> Dict[str, Any]:
        """Grades student quiz submission and updates student_progress in MongoDB."""
        workspace = cls.get_or_generate_workspace(db, resource_id, "Chapter Quiz")
        question_bank = workspace.get("question_bank")
        
        if not question_bank:
            section_data = cls.generate_workspace_section(db, resource_id, "quiz", "Chapter Quiz")
            question_bank = section_data.get("question_bank") or []

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

        # Update student_progress in MongoDB
        try:
            progress_coll = db["student_progress"]
            progress_coll.update_one(
                {"user_id": user_id, "resource_id": resource_id},
                {
                    "$inc": {"quizzes_taken": 1},
                    "$set": {"last_quiz_score": score},
                    "$addToSet": {"weak_topics": {"$each": weak_topics}}
                },
                upsert=True
            )
        except Exception as e:
            logger.warning(f"Could not log student progress in MongoDB: {e}")

        return {
            "score": score,
            "total_questions": total,
            "percentage": percentage,
            "weak_topics": list(set(weak_topics)),
            "results": results
        }

    @staticmethod
    def _generate_default_workspace(resource_id: str, title: str, pdf_url: str) -> Dict[str, Any]:
        """Comprehensive multi-item default academic workspace payload."""
        return {
            "resource_id": resource_id,
            "resource_title": title,
            "pdf_url": pdf_url or "https://ncert.nic.in/textbook/pdf/jemh101.pdf",
            "summaries": {
                "one_min_bullets": [
                    f"Core theme of {title} establishes foundational mathematical and scientific principles.",
                    "Key formulas, theorems, and identities govern standard textbook problem-solving.",
                    "Step-by-step proofs and standard identities are essential for board and competitive scoring.",
                    "Assertion-reasoning and numerical accuracy prevent common exam traps."
                ],
                "five_min_paragraph": f"This comprehensive chapter '{title}' covers core theoretical foundations and practical applications required for CBSE board exams and competitive entrance tests. It outlines fundamental definitions, mathematical properties, step-by-step theorem derivations, and standard problem-solving methodologies. Students should master key formulas, memorize mnemonics, and practice assertion-reasoning questions for maximum score retention.",
                "revision_notes": [
                    "Rule 1: Always state general definitions and write standard formula forms before substituting numerical values.",
                    "Rule 2: Identify textbook key terms, units, and conditions for full step-marking credit.",
                    "Rule 3: Verify intermediate signs and units to eliminate calculation errors (>40% mark loss source).",
                    "Rule 4: Solve Bloom's higher-order applying and analyzing questions to build problem speed."
                ]
            },
            "mind_map": {
                "id": "root",
                "label": title,
                "children": [
                    {
                        "id": "branch-1",
                        "label": "1. Foundational Definitions & Axioms",
                        "children": [
                            {"id": "b1-1", "label": "Standard Curriculum Definitions", "children": []},
                            {"id": "b1-2", "label": "Existence & Uniqueness Theorems", "children": []},
                            {"id": "b1-3", "label": "Domain & Range Conditions", "children": []}
                        ]
                    },
                    {
                        "id": "branch-2",
                        "label": "2. Core Theorems & Step-by-Step Proofs",
                        "children": [
                            {"id": "b2-1", "label": "Primary Mathematical Identity", "children": []},
                            {"id": "b2-2", "label": "Proof by Contradiction Method", "children": []},
                            {"id": "b2-3", "label": "Fundamental Theorem Statement", "children": []}
                        ]
                    },
                    {
                        "id": "branch-3",
                        "label": "3. Problem Solving & Applications",
                        "children": [
                            {"id": "b3-1", "label": "Standard Numerical Algorithm Steps", "children": []},
                            {"id": "b3-2", "label": "Geometric & Algebraic Interpretations", "children": []},
                            {"id": "b3-3", "label": "Real-world & Applied Science Examples", "children": []}
                        ]
                    },
                    {
                        "id": "branch-4",
                        "label": "4. Common Exam Pitfalls & Strategy",
                        "children": [
                            {"id": "b4-1", "label": "Sign & Unit Conversion Traps", "children": []},
                            {"id": "b4-2", "label": "Assertion & Reasoning Trick Statements", "children": []},
                            {"id": "b4-3", "label": "Step Marking & Formula Layout", "children": []}
                        ]
                    }
                ]
            },
            "flashcards": [
                {
                    "id": "fc-1",
                    "front": f"What is the foundational definition of {title}?",
                    "back": "It specifies the primary academic principle, establishing uniqueness properties, validity bounds, and standard mathematical notation required for formal proofs.",
                    "difficulty": "Easy",
                    "tag": "Concept"
                },
                {
                    "id": "fc-2",
                    "front": "How do you apply the primary theorem in step-by-step numerical solving?",
                    "back": "First state the general formula identity, verify given constraints, substitute known parameters, and simplify step-by-step with exact SI unit labeling.",
                    "difficulty": "Medium",
                    "tag": "Application"
                },
                {
                    "id": "fc-3",
                    "front": "What is the proof by contradiction methodology for this chapter?",
                    "back": "Assume the opposite statement holds true, express terms as co-prime integers a/b, derive a shared common factor contradiction, proving original statement holds.",
                    "difficulty": "Hard",
                    "tag": "Proof"
                },
                {
                    "id": "fc-4",
                    "front": "What is the most frequent calculation error students make in board exams?",
                    "back": "Omitting sign conventions during value substitution and skipping intermediate algebraic steps, which leads to cumulative calculation loss.",
                    "difficulty": "Medium",
                    "tag": "Exam Trap"
                },
                {
                    "id": "fc-5",
                    "front": "How do you verify whether a solution is valid or extraneous?",
                    "back": "Substitute the calculated roots/values back into original equation domain conditions to ensure no division by zero or negative square roots occur.",
                    "difficulty": "Hard",
                    "tag": "Verification"
                },
                {
                    "id": "fc-6",
                    "front": "What is the recommended 3-step revision routine before exams?",
                    "back": "1. Recite standard definitions.\n2. Write out LaTeX formulas without looking.\n3. Solve 2 Assertion-Reasoning questions.",
                    "difficulty": "Easy",
                    "tag": "Strategy"
                }
            ],
            "study_tools": {
                "definitions": [
                    {"term": "Fundamental Identity", "definition": "A mathematical relationship that holds true for all valid variable values within specified domain."},
                    {"term": "Existence & Uniqueness Theorem", "definition": "Guarantees that a solution exists for given conditions and is the only unique solution possible."},
                    {"term": "Co-Prime Integers", "definition": "A pair of integers having no shared common factor other than 1 (Highest Common Factor HCF = 1)."},
                    {"term": "Extraneous Solution", "definition": "A derived solution that emerges during algebraic transformation but fails original domain constraints."}
                ],
                "formulas": [
                    {"name": "Standard Identity", "latex": "a = bq + r \\quad (0 \\le r < b)", "explanation": "Fundamental division relation establishing unique quotient q and remainder r."},
                    {"name": "HCF & LCM Product Property", "latex": "\\text{HCF}(a, b) \\times \\text{LCM}(a, b) = a \\times b", "explanation": "Applies strictly for any two positive integers a and b."},
                    {"name": "Quadratic Root Formula", "latex": "x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}", "explanation": "Determines roots and nature of quadratic equations based on discriminant D = b^2 - 4ac."},
                    {"name": "Relative Error Formula", "latex": "\\text{Percentage Error} = \\left| \\frac{\\Delta x}{x_0} \\right| \\times 100\\%", "explanation": "Quantifies experimental deviation relative to true value."}
                ],
                "mnemonics": [
                    {"phrase": "OIL RIG", "concept": "Redox Reactions", "explanation": "Oxidation Is Loss, Reduction Is Gain of electrons."},
                    {"phrase": "SOH CAH TOA", "concept": "Trigonometric Ratios", "explanation": "Sin = Opp/Hyp, Cos = Adj/Hyp, Tan = Opp/Adj."},
                    {"phrase": "BODMAS", "concept": "Order of Operations", "explanation": "Brackets, Orders, Division, Multiplication, Addition, Subtraction."}
                ],
                "common_mistakes": [
                    {"misconception": "Applying HCF x LCM = a x b for three numbers", "correction": "This property holds ONLY for two numbers, not for 3 or more numbers.", "reason": "Three-number LCM involves joint prime factorization factors."},
                    {"misconception": "Ignoring domain constraints when taking square roots", "correction": "Square root yields positive principal root; write both positive & negative cases when solving x^2 = k.", "reason": "Failing to write +/- leads to missing valid roots."},
                    {"misconception": "Confusing sign conventions in lens and formula equations", "correction": "Always draw a coordinate sign diagram before substituting values.", "reason": "Sign errors account for >40% of lost marks in physics & maths."},
                    {"misconception": "Rounding off intermediate values too early in steps", "correction": "Retain fraction/decimal precision until final answer line.", "reason": "Early rounding causes cumulative rounding error in final answer."}
                ],
                "video_scripts": [
                    {"scene": "1. Hook & Overview", "narration": f"Welcome to {title}! In the next 60 seconds, we break down the core concept you need for board exams.", "visual": "Dynamic title card with animated concept tree."},
                    {"scene": "2. Visual Proof Step", "narration": "Watch how substituting these parameters reveals the standard identity effortlessly.", "visual": "Animated step-by-step formula derivation with highlighted callouts."},
                    {"scene": "3. Exam Pro-Tip", "narration": "Don't fall for the classic sign convention trap! Always write standard form first.", "visual": "Red warning icon flashing over common mistake with green checkmark correction."}
                ]
            },
            "question_bank": [
                {
                    "id": "q1",
                    "bloom_level": "Remembering",
                    "question_type": "MCQ",
                    "question": f"Which condition must remainder r satisfy in the standard relation a = bq + r?",
                    "options": [
                        {"id": "A", "text": "0 <= r < b"},
                        {"id": "B", "text": "0 < r <= b"},
                        {"id": "C", "text": "1 <= r < b"},
                        {"id": "D", "text": "r > b"}
                    ],
                    "correct_answer": "A",
                    "explanation": "By definition, the remainder r is non-negative and strictly smaller than divisor b."
                },
                {
                    "id": "q2",
                    "bloom_level": "Understanding",
                    "question_type": "MCQ",
                    "question": "If two positive integers a and b are written as a = x^3 y^2 and b = x y^3 (x, y are prime), what is HCF(a, b)?",
                    "options": [
                        {"id": "A", "text": "x y^2"},
                        {"id": "B", "text": "x^3 y^3"},
                        {"id": "C", "text": "x^2 y"},
                        {"id": "D", "text": "x y"}
                    ],
                    "correct_answer": "A",
                    "explanation": "HCF is the product of the smallest power of each common prime factor involved: min(3,1)=1 for x and min(2,3)=2 for y, giving x y^2."
                },
                {
                    "id": "q3",
                    "bloom_level": "Applying",
                    "question_type": "MCQ",
                    "question": "Given HCF(306, 657) = 9, what is LCM(306, 657)?",
                    "options": [
                        {"id": "A", "text": "22338"},
                        {"id": "B", "text": "12338"},
                        {"id": "C", "text": "30600"},
                        {"id": "D", "text": "9988"}
                    ],
                    "correct_answer": "A",
                    "explanation": "Using HCF x LCM = a x b: 9 x LCM = 306 x 657 => LCM = 201042 / 9 = 22338."
                },
                {
                    "id": "q4",
                    "bloom_level": "Analyzing",
                    "question_type": "Assertion-Reasoning",
                    "question": "Assertion (A): sqrt(5) is an irrational number.\nReason (R): Square root of any prime number is always irrational.",
                    "options": [
                        {"id": "A", "text": "Both A and R are true, and R is the correct explanation of A."},
                        {"id": "B", "text": "Both A and R are true, but R is NOT the correct explanation of A."},
                        {"id": "C", "text": "A is true but R is false."},
                        {"id": "D", "text": "A is false but R is true."}
                    ],
                    "correct_answer": "A",
                    "explanation": "Since 5 is a prime number, sqrt(p) for any prime p is irrational by theorem, making R the exact explanation for A."
                },
                {
                    "id": "q5",
                    "bloom_level": "Evaluating",
                    "question_type": "MCQ",
                    "question": "Which of the following rational numbers has a terminating decimal expansion?",
                    "options": [
                        {"id": "A", "text": "13 / 3125"},
                        {"id": "B", "text": "17 / 6"},
                        {"id": "C", "text": "64 / 455"},
                        {"id": "D", "text": "29 / 343"}
                    ],
                    "correct_answer": "A",
                    "explanation": "3125 = 5^5 (of form 2^n 5^m). Since denominator prime factors contain only 5, 13/3125 has a terminating decimal expansion."
                },
                {
                    "id": "q6",
                    "bloom_level": "Creating",
                    "question_type": "MCQ",
                    "question": "Design a general expression for the sum of any two consecutive odd positive integers.",
                    "options": [
                        {"id": "A", "text": "Multiple of 4 (i.e. 4k)"},
                        {"id": "B", "text": "Always odd"},
                        {"id": "C", "text": "Multiple of 3"},
                        {"id": "D", "text": "Prime number"}
                    ],
                    "correct_answer": "A",
                    "explanation": "Let consecutive odds be (2n+1) and (2n+3). Sum = 4n + 4 = 4(n+1), which is always a multiple of 4."
                }
            ]
        }

