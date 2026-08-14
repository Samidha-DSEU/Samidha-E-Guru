import { apiClient } from "@/services/apiClient";
import axios from "axios";

export interface SourceCitation {
  page_number: number;
  content_snippet: string;
}

export interface DoubtResponse {
  answer: string;
  sources: SourceCitation[];
}

export interface MindMapNode {
  id: string;
  label: string;
  children?: MindMapNode[];
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  difficulty: "Easy" | "Medium" | "Hard";
  tag?: string;
}

export interface LaTeXFormula {
  name: string;
  latex: string;
  explanation: string;
}

export interface MnemonicItem {
  phrase: string;
  concept: string;
  explanation: string;
}

export interface CommonMistakeItem {
  misconception: string;
  correction: string;
  reason: string;
}

export interface StudyTools {
  definitions: Array<{ term: string; definition: string }>;
  formulas: LaTeXFormula[];
  mnemonics: MnemonicItem[];
  common_mistakes: CommonMistakeItem[];
  video_scripts: Array<{ scene: string; narration: string; visual: string }>;
}

export interface QuestionOption {
  id: string;
  text: string;
}

export interface TaxonomyQuestion {
  id: string;
  bloom_level: string;
  question_type: string;
  question: string;
  options?: QuestionOption[];
  correct_answer: string;
  explanation: string;
}

export interface AIWorkspacePayload {
  resource_id: string;
  resource_title: string;
  pdf_url?: string;
  summaries: {
    one_min_bullets: string[];
    five_min_paragraph: string;
    revision_notes: string[];
  };
  mind_map: MindMapNode;
  flashcards: Flashcard[];
  study_tools: StudyTools;
  question_bank: TaxonomyQuestion[];
}

export interface QuizResult {
  score: number;
  total_questions: number;
  percentage: number;
  weak_topics: string[];
  results: Array<{
    question_id: string;
    question: string;
    user_answer: string;
    correct_answer: string;
    is_correct: boolean;
    explanation: string;
  }>;
}

// Robustly get the base URL, appending /api/v1/learn-ai if the user only provided the domain
let baseLearnAiUrl = process.env.NEXT_PUBLIC_LEARN_AI_SERVICE_URL || "https://samidha-learn-ai-service.onrender.com/api/v1/learn-ai";
if (baseLearnAiUrl.endsWith("/")) {
  baseLearnAiUrl = baseLearnAiUrl.slice(0, -1);
}
if (!baseLearnAiUrl.endsWith("/api/v1/learn-ai")) {
  baseLearnAiUrl += "/api/v1/learn-ai";
}

export const learnAiApiClient = axios.create({
  baseURL: baseLearnAiUrl,
  headers: {
    "Content-Type": "application/json"
  }
});

export const learnAiService = {
  async getWorkspace(resourceId: string): Promise<AIWorkspacePayload> {
    const res = await learnAiApiClient.get(`/workspace/${resourceId}`);
    return res.data.data;
  },

  async getWorkspaceSection(resourceId: string, section: string): Promise<Record<string, any>> {
    const res = await learnAiApiClient.get(`/workspace/${resourceId}/section/${section}`);
    return res.data.data;
  },

  async askDoubt(resourceId: string, question: string): Promise<DoubtResponse> {
    const res = await learnAiApiClient.post("/query", {
      resource_id: resourceId,
      question
    });
    return res.data.data;
  },

  async submitQuiz(resourceId: string, answers: Record<string, string>): Promise<QuizResult> {
    const res = await learnAiApiClient.post("/quiz/submit", {
      resource_id: resourceId,
      answers
    });
    return res.data.data;
  },

  async triggerIngestion(resourceId: string): Promise<void> {
    await learnAiApiClient.post(`/ingest/${resourceId}`);
  }
};
