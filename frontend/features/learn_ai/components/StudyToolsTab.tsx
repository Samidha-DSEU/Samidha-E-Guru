"use client";

import React, { useState } from "react";
import { Wrench, BookMarked, Calculator, Lightbulb, AlertTriangle, Video } from "lucide-react";
import { StudyTools } from "../services/learnAiService";
import { Card } from "@/components/ui/Card";

export function StudyToolsTab({ tools }: { tools: StudyTools }) {
  const [activeSubTab, setActiveSubTab] = useState<"definitions" | "formulas" | "mnemonics" | "mistakes" | "videos">("definitions");

  return (
    <div className="space-y-6">
      {/* Sub-tab Navigation */}
      <div className="flex flex-wrap gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-3">
        <button
          onClick={() => setActiveSubTab("definitions")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
            activeSubTab === "definitions"
              ? "bg-sky-600 text-white"
              : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900"
          }`}
        >
          <BookMarked className="h-3.5 w-3.5" /> Key Definitions
        </button>

        <button
          onClick={() => setActiveSubTab("formulas")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
            activeSubTab === "formulas"
              ? "bg-sky-600 text-white"
              : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900"
          }`}
        >
          <Calculator className="h-3.5 w-3.5" /> LaTeX Formulas
        </button>

        <button
          onClick={() => setActiveSubTab("mnemonics")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
            activeSubTab === "mnemonics"
              ? "bg-sky-600 text-white"
              : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900"
          }`}
        >
          <Lightbulb className="h-3.5 w-3.5" /> Mnemonics
        </button>

        <button
          onClick={() => setActiveSubTab("mistakes")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
            activeSubTab === "mistakes"
              ? "bg-sky-600 text-white"
              : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900"
          }`}
        >
          <AlertTriangle className="h-3.5 w-3.5" /> Common Mistakes
        </button>
      </div>

      {/* Definitions Display */}
      {activeSubTab === "definitions" && (
        <div className="grid gap-3 sm:grid-cols-2">
          {tools.definitions.map((def, idx) => (
            <Card key={idx} className="space-y-1.5">
              <h4 className="font-bold text-sm text-sky-600 dark:text-sky-400">{def.term}</h4>
              <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">{def.definition}</p>
            </Card>
          ))}
        </div>
      )}

      {/* Formulas Display */}
      {activeSubTab === "formulas" && (
        <div className="space-y-3">
          {tools.formulas.map((f, idx) => (
            <Card key={idx} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h4 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">{f.name}</h4>
                <p className="text-xs text-zinc-500">{f.explanation}</p>
              </div>
              <div className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 font-mono text-sm rounded-xl text-sky-600 dark:text-sky-400 border border-zinc-200 dark:border-zinc-700">
                {f.latex}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Mnemonics Display */}
      {activeSubTab === "mnemonics" && (
        <div className="space-y-3">
          {tools.mnemonics.map((m, idx) => (
            <Card key={idx} className="space-y-2 border-l-4 border-l-amber-500">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-amber-600 dark:text-amber-400">{m.phrase}</span>
                <span className="text-xs px-2 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-300 font-medium">{m.concept}</span>
              </div>
              <p className="text-xs text-zinc-600 dark:text-zinc-300">{m.explanation}</p>
            </Card>
          ))}
        </div>
      )}

      {/* Common Mistakes Display */}
      {activeSubTab === "mistakes" && (
        <div className="space-y-3">
          {tools.common_mistakes.map((c, idx) => (
            <Card key={idx} className="space-y-2 border-l-4 border-l-rose-500">
              <div className="text-xs font-semibold text-rose-600 dark:text-rose-400">
                ❌ Misconception: {c.misconception}
              </div>
              <div className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                ✅ Correct Fix: {c.correction}
              </div>
              <p className="text-xs text-zinc-500 italic">Reason: {c.reason}</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
