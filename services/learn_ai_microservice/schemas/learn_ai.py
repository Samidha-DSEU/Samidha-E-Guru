from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class RagQueryRequest(BaseModel):
    resource_id: str = Field(..., description="ID of the resource document")
    question: str = Field(..., description="Student's doubt or question regarding the chapter")
    pdf_url: Optional[str] = Field(None, description="PDF URL directly from frontend")
    resource_title: Optional[str] = Field(None, description="Resource title directly from frontend")


class SourceCitation(BaseModel):
    page_number: int
    content_snippet: str


class RagQueryResponse(BaseModel):
    answer: str
    sources: List[SourceCitation] = []


class RevisionSummaries(BaseModel):
    one_min_bullets: List[str] = []
    five_min_paragraph: str = ""
    revision_notes: List[str] = []


class MindMapNode(BaseModel):
    id: str
    label: str
    children: Optional[List["MindMapNode"]] = []


class Flashcard(BaseModel):
    id: str
    front: str
    back: str
    difficulty: str = "Medium"  # Easy, Medium, Hard
    tag: Optional[str] = None


class LaTeXFormula(BaseModel):
    name: str
    latex: str
    explanation: str


class MnemonicItem(BaseModel):
    phrase: str
    concept: str
    explanation: str


class CommonMistakeItem(BaseModel):
    misconception: str
    correction: str
    reason: str


class StudyTools(BaseModel):
    definitions: List[Dict[str, str]] = []
    formulas: List[LaTeXFormula] = []
    mnemonics: List[MnemonicItem] = []
    common_mistakes: List[CommonMistakeItem] = []
    video_scripts: List[Dict[str, str]] = []


class QuestionOption(BaseModel):
    id: str
    text: str


class TaxonomyQuestion(BaseModel):
    id: str
    bloom_level: str  # Remember, Understand, Apply, Analyze
    question_type: str  # MCQ, TrueFalse, FillInBlanks, AssertionReason
    question: str
    options: Optional[List[QuestionOption]] = None
    correct_answer: str
    explanation: str


class AIWorkspacePayload(BaseModel):
    resource_id: str
    resource_title: str
    summaries: RevisionSummaries
    mind_map: MindMapNode
    flashcards: List[Flashcard]
    study_tools: StudyTools
    question_bank: List[TaxonomyQuestion]


class QuizSubmitRequest(BaseModel):
    resource_id: str
    answers: Dict[str, str]  # question_id -> selected_option/answer string


class QuizSubmitResponse(BaseModel):
    score: int
    total_questions: int
    percentage: float
    weak_topics: List[str]
    results: List[Dict[str, Any]]
