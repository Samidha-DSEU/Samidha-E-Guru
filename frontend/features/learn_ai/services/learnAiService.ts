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

export const learnAiService = {
  async getWorkspace(resourceId: string): Promise<AIWorkspacePayload> {
    const res = await apiClient.get(`/learn-ai/workspace/${resourceId}`);
    return res.data.data;
  },

  async getWorkspaceSection(resourceId: string, section: string): Promise<Record<string, any>> {
    const res = await apiClient.get(`/learn-ai/workspace/${resourceId}/section/${section}`);
    return res.data.data;
  },

  async askDoubt(resourceId: string, question: string): Promise<DoubtResponse> {
    const res = await apiClient.post("/learn-ai/query", {
      resource_id: resourceId,
      question
    });
    return res.data.data;
  },

  async submitQuiz(resourceId: string, answers: Record<string, string>): Promise<QuizResult> {
    const res = await apiClient.post("/learn-ai/quiz/submit", {
      resource_id: resourceId,
      answers
    });
    return res.data.data;
  },

  async triggerIngestion(resourceId: string): Promise<void> {
    await apiClient.post(`/learn-ai/ingest/${resourceId}`);
  }
};
