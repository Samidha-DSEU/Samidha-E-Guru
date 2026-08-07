"use client";

import React, { useState } from "react";
import { Clock, FileText, CheckCircle, Zap } from "lucide-react";
import { Card } from "@/components/ui/Card";

interface SummariesTabProps {
  summaries: {
    one_min_bullets: string[];
    five_min_paragraph: string;
    revision_notes: string[];
  };
}

export function SummariesTab({ summaries }: SummariesTabProps) {
  const [activeMode, setActiveMode] = useState<"1min" | "5min" | "revision">("1min");

  return (
    <div className="space-y-6">
      {/* Selector Controls */}
      <div className="flex items-center justify-between p-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/60 max-w-md">
        <button
          onClick={() => setActiveMode("1min")}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            activeMode === "1min"
              ? "bg-white dark:bg-zinc-900 text-sky-600 dark:text-sky-400 shadow-sm"
              : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
          }`}
        >
          <Zap className="h-3.5 w-3.5" /> 1-Min Bullets
        </button>
        <button
          onClick={() => setActiveMode("5min")}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            activeMode === "5min"
              ? "bg-white dark:bg-zinc-900 text-sky-600 dark:text-sky-400 shadow-sm"
              : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
          }`}
        >
          <Clock className="h-3.5 w-3.5" /> 5-Min Overview
        </button>
        <button
          onClick={() => setActiveMode("revision")}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            activeMode === "revision"
              ? "bg-white dark:bg-zinc-900 text-sky-600 dark:text-sky-400 shadow-sm"
              : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
          }`}
        >
          <FileText className="h-3.5 w-3.5" /> Revision Notes
        </button>
      </div>

      {/* Summary Content Display */}
      {activeMode === "1min" && (
        <Card className="space-y-4 border-l-4 border-l-sky-500">
          <div className="flex items-center gap-2 text-sky-600 dark:text-sky-400 font-semibold text-sm">
            <Zap className="h-4 w-4" /> 1-Minute Quick Glance Bullets
          </div>
          <ul className="space-y-3">
            {summaries.one_min_bullets.map((bullet, idx) => (
              <li key={idx} className="flex items-start gap-3 text-sm text-zinc-700 dark:text-zinc-300">
                <CheckCircle className="h-4 w-4 text-sky-500 shrink-0 mt-0.5" />
                <span>{bullet}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {activeMode === "5min" && (
        <Card className="space-y-4 border-l-4 border-l-indigo-500">
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-semibold text-sm">
            <Clock className="h-4 w-4" /> 5-Minute Comprehensive Chapter Summary
          </div>
          <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
            {summaries.five_min_paragraph}
          </p>
        </Card>
      )}

      {activeMode === "revision" && (
        <Card className="space-y-4 border-l-4 border-l-purple-500">
          <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-semibold text-sm">
            <FileText className="h-4 w-4" /> Bulletproof Revision Notes
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {summaries.revision_notes.map((note, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-purple-500/5 border border-purple-500/10 text-xs text-zinc-700 dark:text-zinc-300 font-medium"
              >
                📌 {note}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
