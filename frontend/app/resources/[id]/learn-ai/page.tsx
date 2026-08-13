"use client";

import React, { use, useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft, Sparkles, MessageSquare, Zap, Network, Layers, Wrench, Award, AlertTriangle, RefreshCw
} from "lucide-react";

import { learnAiService, AIWorkspacePayload } from "@/features/learn_ai/services/learnAiService";
import { DoubtSolverTab } from "@/features/learn_ai/components/DoubtSolverTab";
import { SummariesTab } from "@/features/learn_ai/components/SummariesTab";
import { MindMapTab } from "@/features/learn_ai/components/MindMapTab";
import { FlashcardsTab } from "@/features/learn_ai/components/FlashcardsTab";
import { StudyToolsTab } from "@/features/learn_ai/components/StudyToolsTab";
import { PracticeQuizTab } from "@/features/learn_ai/components/PracticeQuizTab";
import { RateLimitBanner } from "@/features/learn_ai/components/RateLimitBanner";

import { Card, Skeleton } from "@/components/ui/Card";
import { ErrorState } from "@/components/ui/ErrorState";

type TabType = "doubts" | "summaries" | "mindmap" | "flashcards" | "tools" | "quiz";

function LearnAiWorkspaceContent({ params }: { params: Promise<{ id: string }> }) {
  const { id: resourceId } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryString = searchParams.toString();
  const previewHref = queryString ? `/resources/${resourceId}?${queryString}` : `/resources/${resourceId}`;
  const [activeTab, setActiveTab] = useState<TabType>("doubts");

  // Local state storing accumulated section data
  const [sectionsData, setSectionsData] = useState<Partial<AIWorkspacePayload>>({});
  const [sectionLoading, setSectionLoading] = useState<Record<string, boolean>>({});
  const [sectionError, setSectionError] = useState<Record<string, string>>({});

  // 60-Second Rate Limit Countdown Timer State
  const [rateLimitSeconds, setRateLimitSeconds] = useState<number>(0);

  // 1. Initial base workspace query
  const { data: baseWorkspace, isLoading, isError, refetch } = useQuery<AIWorkspacePayload>({
    queryKey: ["learn-ai-workspace-base", resourceId],
    queryFn: () => learnAiService.getWorkspace(resourceId)
  });

  // Countdown timer interval effect
  useEffect(() => {
    if (rateLimitSeconds <= 0) return;
    const interval = setInterval(() => {
      setRateLimitSeconds((prev) => (prev > 1 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [rateLimitSeconds]);

  // Handle Tab Switch & On-Demand Module LLM Generation
  const handleSelectTab = async (tab: TabType) => {
    setActiveTab(tab);
    if (tab === "doubts") return;

    // Check mapping
    const secKeyMap: Record<string, keyof AIWorkspacePayload> = {
      summaries: "summaries",
      mindmap: "mind_map",
      flashcards: "flashcards",
      tools: "study_tools",
      quiz: "question_bank"
    };
    const targetKey = secKeyMap[tab];

    // Skip if already generated or cached in initial workspace
    if (sectionsData[targetKey] || (baseWorkspace && baseWorkspace[targetKey])) {
      return;
    }

    // Block if rate limit is active
    if (rateLimitSeconds > 0) {
      return;
    }

    // Fetch section on demand
    setSectionLoading((prev) => ({ ...prev, [tab]: true }));
    setSectionError((prev) => ({ ...prev, [tab]: "" }));

    try {
      const generated = await learnAiService.getWorkspaceSection(resourceId, tab);
      setSectionsData((prev) => ({ ...prev, ...generated }));
    } catch (err: any) {
      const status = err?.response?.status;
      const detail = err?.response?.data?.detail || err?.message || "Failed to generate AI section.";
      const isRateLimit = status === 429 || detail.toLowerCase().includes("rate limit") || detail.toLowerCase().includes("limit") || detail.toLowerCase().includes("429");

      if (isRateLimit) {
        setRateLimitSeconds(60);
        setSectionError((prev) => ({
          ...prev,
          [tab]: "LLM Request Rate Limit Reached. Please wait for countdown timer to complete."
        }));
      } else {
        setSectionError((prev) => ({ ...prev, [tab]: detail }));
      }
    } finally {
      setSectionLoading((prev) => ({ ...prev, [tab]: false }));
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto py-20 px-4 flex flex-col items-center justify-center space-y-6 text-center">
        <div className="relative flex items-center justify-center">
          <div className="h-20 w-20 rounded-full border-4 border-sky-500/20 border-t-sky-600 border-r-indigo-600 border-b-purple-600 animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center text-sky-600 dark:text-sky-400">
            <Sparkles className="h-8 w-8 animate-pulse" />
          </div>
        </div>

        <div className="space-y-2 max-w-md">
          <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center justify-center gap-2">
            <Sparkles className="h-4 w-4 text-sky-500" /> Preparing AI Tutor Workspace
          </h3>
          <p className="text-xs text-zinc-500 leading-relaxed">
            Loading interactive chapter workspace...
          </p>
        </div>

        <div className="w-full max-w-2xl pt-4 space-y-4">
          <Skeleton className="h-24 w-full rounded-2xl bg-gradient-to-r from-sky-500/10 via-indigo-500/10 to-purple-500/10" />
          <div className="grid grid-cols-3 gap-3">
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !baseWorkspace) {
    return (
      <div className="max-w-5xl mx-auto py-12 px-4">
        <ErrorState
          message="Could not load AI Tutor Workspace metadata."
          onRetry={refetch}
        />
      </div>
    );
  }

  const mergedWorkspace: AIWorkspacePayload = {
    ...baseWorkspace,
    ...sectionsData
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 py-4 px-4">
      {/* TOP PAGE NAVIGATION (Always Active & Seamless) */}
      <div className="flex items-center justify-between pb-4 border-b border-zinc-200 dark:border-zinc-800/60 mb-6 sticky top-0 bg-zinc-50/80 dark:bg-zinc-950/80 backdrop-blur-md z-10 p-2">
        <Link 
          href={previewHref}
          className="inline-flex items-center text-xs text-zinc-500 hover:text-sky-600 font-medium transition-colors bg-transparent border-0 p-0 cursor-pointer"
        >
          <ArrowLeft className="h-3.5 w-3.5 mr-1.5" /> Back to PDF Preview
        </Link>

        <span className="px-3 py-1 bg-gradient-to-r from-sky-500/10 to-indigo-500/10 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-800/60 rounded-full text-xs font-semibold flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5" /> SAMIDHA AI Tutor Workspace
        </span>
      </div>

      {/* Header Banner */}
      <Card className="p-6 bg-gradient-to-r from-sky-600 via-indigo-600 to-purple-600 text-white rounded-2xl space-y-2 border-0 shadow-lg">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
          {baseWorkspace.resource_title}
        </h1>
        <p className="text-xs sm:text-sm text-sky-100 max-w-2xl leading-relaxed">
          Interactive study workspace powered by RAG PDF parsing, local SentenceTransformer vector search, and on-demand Groq LLM module generation.
        </p>
      </Card>

      {/* STUDY WORKSPACE CONTAINER CARD */}
      <div className="space-y-4">
        {/* Workspace Tabs Navigation */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-zinc-200 dark:border-zinc-800">
          <button
            onClick={() => handleSelectTab("doubts")}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 shrink-0 ${
              activeTab === "doubts"
                ? "bg-sky-600 text-white shadow-md"
                : "bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800"
            }`}
          >
            <MessageSquare className="h-4 w-4" /> 💬 AI Doubt Solver
          </button>

          <button
            onClick={() => handleSelectTab("summaries")}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 shrink-0 ${
              activeTab === "summaries"
                ? "bg-sky-600 text-white shadow-md"
                : "bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800"
            }`}
          >
            <Zap className="h-4 w-4" /> 📝 Revision Summaries
          </button>

          <button
            onClick={() => handleSelectTab("mindmap")}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 shrink-0 ${
              activeTab === "mindmap"
                ? "bg-sky-600 text-white shadow-md"
                : "bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800"
            }`}
          >
            <Network className="h-4 w-4" /> 🧠 Mind Map
          </button>

          <button
            onClick={() => handleSelectTab("flashcards")}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 shrink-0 ${
              activeTab === "flashcards"
                ? "bg-sky-600 text-white shadow-md"
                : "bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800"
            }`}
          >
            <Layers className="h-4 w-4" /> 🎴 Flashcards
          </button>

          <button
            onClick={() => handleSelectTab("tools")}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 shrink-0 ${
              activeTab === "tools"
                ? "bg-sky-600 text-white shadow-md"
                : "bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800"
            }`}
          >
            <Wrench className="h-4 w-4" /> 🛠️ Study Tools
          </button>

          <button
            onClick={() => handleSelectTab("quiz")}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 shrink-0 ${
              activeTab === "quiz"
                ? "bg-sky-600 text-white shadow-md"
                : "bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800"
            }`}
          >
            <Award className="h-4 w-4" /> ✍️ Practice Quiz
          </button>
        </div>

        {/* SCOPED RATE LIMIT COUNTDOWN BANNER (Strictly under Study Workspace) */}
        {rateLimitSeconds > 0 && (
          <RateLimitBanner remainingSeconds={rateLimitSeconds} />
        )}

        {/* Section Loading State */}
        {sectionLoading[activeTab] && (
          <div className="p-12 border border-zinc-200 dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-900 flex flex-col items-center justify-center space-y-4 text-center">
            <div className="h-12 w-12 rounded-full border-3 border-sky-500/20 border-t-sky-600 animate-spin flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-sky-500 animate-pulse" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 capitalize">
                Generating AI {activeTab} Module...
              </h4>
              <p className="text-xs text-zinc-500">
                Calling Groq LLM API and structuring custom study content for {baseWorkspace.resource_title}.
              </p>
            </div>
          </div>
        )}

        {/* Section Error State (Shows real LLM error without disturbing layout) */}
        {sectionError[activeTab] && !sectionLoading[activeTab] && rateLimitSeconds === 0 && (
          <div className="p-6 border border-rose-200 dark:border-rose-900/60 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 space-y-3">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 rounded-lg">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-rose-900 dark:text-rose-200">
                  AI Module Generation Error
                </h4>
                <p className="text-xs text-rose-800/80 dark:text-rose-300/80 font-mono leading-relaxed">
                  {sectionError[activeTab]}
                </p>
              </div>
            </div>
            <button
              onClick={() => handleSelectTab(activeTab)}
              className="px-3 py-1.5 text-xs font-semibold bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors inline-flex items-center gap-1.5"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Retry Generating {activeTab}
            </button>
          </div>
        )}

        {/* Active Tab View Render */}
        {!sectionLoading[activeTab] && !sectionError[activeTab] && (
          <div className="pt-2">
            {activeTab === "doubts" && (
              <DoubtSolverTab resourceId={resourceId} title={baseWorkspace.resource_title} />
            )}

            {activeTab === "summaries" && (
              <SummariesTab summaries={mergedWorkspace.summaries} />
            )}

            {activeTab === "mindmap" && (
              <MindMapTab mindMap={mergedWorkspace.mind_map} />
            )}

            {activeTab === "flashcards" && (
              <FlashcardsTab flashcards={mergedWorkspace.flashcards} />
            )}

            {activeTab === "tools" && (
              <StudyToolsTab tools={mergedWorkspace.study_tools} />
            )}

            {activeTab === "quiz" && (
              <PracticeQuizTab resourceId={resourceId} questionBank={mergedWorkspace.question_bank} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function LearnAiWorkspacePage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={
      <div className="max-w-5xl mx-auto py-12 px-4">
        <Skeleton className="h-10 w-64 rounded-xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    }>
      <LearnAiWorkspaceContent params={params} />
    </Suspense>
  );
}
