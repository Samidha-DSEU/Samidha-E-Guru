"use client";

import React, { use, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft, Sparkles, MessageSquare, Zap, Network, Layers, Wrench, Award
} from "lucide-react";

import { learnAiService, AIWorkspacePayload } from "@/features/learn_ai/services/learnAiService";
import { DoubtSolverTab } from "@/features/learn_ai/components/DoubtSolverTab";
import { SummariesTab } from "@/features/learn_ai/components/SummariesTab";
import { MindMapTab } from "@/features/learn_ai/components/MindMapTab";
import { FlashcardsTab } from "@/features/learn_ai/components/FlashcardsTab";
import { StudyToolsTab } from "@/features/learn_ai/components/StudyToolsTab";
import { PracticeQuizTab } from "@/features/learn_ai/components/PracticeQuizTab";

import { Card, Skeleton } from "@/components/ui/Card";
import { ErrorState } from "@/components/ui/ErrorState";

type TabType = "doubts" | "summaries" | "mindmap" | "flashcards" | "tools" | "quiz";

export default function LearnAiWorkspacePage({ params }: { params: Promise<{ id: string }> }) {
  const { id: resourceId } = use(params);
  const [activeTab, setActiveTab] = useState<TabType>("doubts");

  const { data: workspace, isLoading, isError, refetch } = useQuery<AIWorkspacePayload>({
    queryKey: ["learn-ai-workspace", resourceId],
    queryFn: () => learnAiService.getWorkspace(resourceId)
  });

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto space-y-6 py-6 px-4">
        <Skeleton className="h-8 w-1/4" />
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (isError || !workspace) {
    return (
      <div className="max-w-5xl mx-auto py-12 px-4">
        <ErrorState
          message="Could not load AI Tutor Workspace. Triggering background extraction..."
          onRetry={refetch}
        />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 py-4 px-4">
      {/* Navigation Top Bar */}
      <div className="flex items-center justify-between">
        <Link
          href={`/resources/${resourceId}`}
          className="inline-flex items-center text-xs text-zinc-500 hover:text-sky-600 font-medium transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5 mr-1.5" /> Back to Resource Details & PDF Preview
        </Link>

        <span className="px-3 py-1 bg-gradient-to-r from-sky-500/10 to-indigo-500/10 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-800/60 rounded-full text-xs font-semibold flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5" /> SAMIDHA AI Tutor Workspace
        </span>
      </div>

      {/* Header Banner */}
      <Card className="p-6 bg-gradient-to-r from-sky-600 via-indigo-600 to-purple-600 text-white rounded-2xl space-y-2 border-0 shadow-lg">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
          {workspace.resource_title}
        </h1>
        <p className="text-xs sm:text-sm text-sky-100 max-w-2xl leading-relaxed">
          Interactive study workspace powered by RAG PDF parsing, local SentenceTransformer vector search, and structured Groq LLM intelligence.
        </p>
      </Card>

      {/* Workspace Tabs Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-zinc-200 dark:border-zinc-800">
        <button
          onClick={() => setActiveTab("doubts")}
          className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === "doubts"
              ? "bg-sky-600 text-white shadow-md"
              : "bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800"
          }`}
        >
          <MessageSquare className="h-4 w-4" /> 💬 AI Doubt Solver
        </button>

        <button
          onClick={() => setActiveTab("summaries")}
          className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === "summaries"
              ? "bg-sky-600 text-white shadow-md"
              : "bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800"
          }`}
        >
          <Zap className="h-4 w-4" /> 📝 Revision Summaries
        </button>

        <button
          onClick={() => setActiveTab("mindmap")}
          className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === "mindmap"
              ? "bg-sky-600 text-white shadow-md"
              : "bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800"
          }`}
        >
          <Network className="h-4 w-4" /> 🧠 Mind Map
        </button>

        <button
          onClick={() => setActiveTab("flashcards")}
          className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === "flashcards"
              ? "bg-sky-600 text-white shadow-md"
              : "bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800"
          }`}
        >
          <Layers className="h-4 w-4" /> 🎴 Flashcards
        </button>

        <button
          onClick={() => setActiveTab("tools")}
          className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === "tools"
              ? "bg-sky-600 text-white shadow-md"
              : "bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800"
          }`}
        >
          <Wrench className="h-4 w-4" /> 🛠️ Study Tools
        </button>

        <button
          onClick={() => setActiveTab("quiz")}
          className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === "quiz"
              ? "bg-sky-600 text-white shadow-md"
              : "bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800"
          }`}
        >
          <Award className="h-4 w-4" /> ✍️ Practice Quiz
        </button>
      </div>

      {/* Active Tab View Render */}
      <div className="pt-2">
        {activeTab === "doubts" && (
          <DoubtSolverTab resourceId={resourceId} title={workspace.resource_title} />
        )}

        {activeTab === "summaries" && (
          <SummariesTab summaries={workspace.summaries} />
        )}

        {activeTab === "mindmap" && (
          <MindMapTab mindMap={workspace.mind_map} />
        )}

        {activeTab === "flashcards" && (
          <FlashcardsTab flashcards={workspace.flashcards} />
        )}

        {activeTab === "tools" && (
          <StudyToolsTab tools={workspace.study_tools} />
        )}

        {activeTab === "quiz" && (
          <PracticeQuizTab resourceId={resourceId} questionBank={workspace.question_bank} />
        )}
      </div>
    </div>
  );
}
