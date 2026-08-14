import { apiClient } from "@/services/apiClient";

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

import axios from "axios";

// Dedicated axios client for the Learn AI Microservice
export const learnAiApiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_LEARN_AI_SERVICE_URL || "https://samidha-learn-ai-service.onrender.com/api/v1/learn-ai",
  headers: {
    "Content-Type": "application/json"
  }
});

// Fetch resource details from main backend before calling microservice
async function getResourceDetails(resourceId: string): Promise<{ title: string; pdfUrl: string }> {
  try {
    const res = await apiClient.get(`/resources/${resourceId}`);
    const data = res.data.data;
    return {
      title: data.title || "NCERT Textbook Chapter",
      pdfUrl: data.external_url || "https://ncert.nic.in/textbook/pdf/jemh101.pdf"
    };
  } catch (error) {
    console.warn("Could not fetch resource details for Learn AI, using defaults", error);
    return {
      title: "NCERT Textbook Chapter",
      pdfUrl: "https://ncert.nic.in/textbook/pdf/jemh101.pdf"
    };
  }
}

export const learnAiService = {
  async getWorkspace(resourceId: string): Promise<AIWorkspacePayload> {
    const { title, pdfUrl } = await getResourceDetails(resourceId);
    const res = await learnAiApiClient.get(`/workspace/${resourceId}`, {
      params: { title, pdf_url: pdfUrl }
    });
    return res.data.data;
  },

  async getWorkspaceSection(resourceId: string, section: string): Promise<Record<string, any>> {
    const { title, pdfUrl } = await getResourceDetails(resourceId);
    const res = await learnAiApiClient.get(`/workspace/${resourceId}/section/${section}`, {
      params: { title, pdf_url: pdfUrl }
    });
    return res.data.data;
  },

  async askDoubt(resourceId: string, question: string): Promise<DoubtResponse> {
    const { title, pdfUrl } = await getResourceDetails(resourceId);
    const res = await learnAiApiClient.post("/query", {
      resource_id: resourceId,
      question,
      resource_title: title,
      pdf_url: pdfUrl
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
    const { title, pdfUrl } = await getResourceDetails(resourceId);
    await learnAiApiClient.post(`/ingest/${resourceId}`, {
      resource_id: resourceId,
      title,
      pdf_url: pdfUrl
    });
  }
};
