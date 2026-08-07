"use client";

import React, { useState } from "react";
import { Layers, RotateCw, CheckCircle, ArrowLeft, ArrowRight, HelpCircle, Sparkles } from "lucide-react";
import { Flashcard } from "../services/learnAiService";
import { Button } from "@/components/ui/Button";

export function FlashcardsTab({ flashcards }: { flashcards: Flashcard[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [mastered, setMastered] = useState<Set<string>>(new Set());

  const currentCard = flashcards[currentIndex] || flashcards[0];

  const handleNext = () => {
    setFlipped(false);
    setCurrentIndex((prev) => (prev + 1) % flashcards.length);
  };

  const handlePrev = () => {
    setFlipped(false);
    setCurrentIndex((prev) => (prev - 1 + flashcards.length) % flashcards.length);
  };

  const toggleMastered = (id: string) => {
    setMastered((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (!flashcards || flashcards.length === 0) {
    return <div className="text-sm text-zinc-400 py-8 text-center">No flashcards available.</div>;
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="h-5 w-5 text-sky-600 dark:text-sky-400" />
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Interactive Chapter Flashcards ({currentIndex + 1} of {flashcards.length})
          </h3>
        </div>
      </div>

      {/* 3D Flip Card Container */}
      <div
        onClick={() => setFlipped(!flipped)}
        className="h-80 w-full cursor-pointer [perspective:1000px]"
      >
        <div
          className={`relative h-full w-full transition-transform duration-500 [transform-style:preserve-3d] ${
            flipped ? "[transform:rotateY(180deg)]" : ""
          }`}
        >
          {/* FRONT FACE (QUESTION) */}
          <div className="absolute inset-0 h-full w-full p-8 flex flex-col justify-between bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm [backface-visibility:hidden]">
            <div className="flex items-center justify-between text-xs">
              <span className="px-2.5 py-0.5 rounded-full bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 font-medium">
                {currentCard.tag || "Concept"}
              </span>
              <span className="text-zinc-400 font-mono text-[11px] flex items-center gap-1">
                <RotateCw className="h-3 w-3" /> Click card to flip
              </span>
            </div>

            <div className="text-center py-4 space-y-2">
              <span className="text-xs uppercase font-bold text-sky-600 dark:text-sky-400 tracking-wider">Question</span>
              <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                {currentCard.front}
              </p>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-zinc-100 dark:border-zinc-800/60">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleMastered(currentCard.id);
                }}
                className={`text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  mastered.has(currentCard.id) ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-400 hover:text-zinc-600"
                }`}
              >
                <CheckCircle className="h-4 w-4" />
                {mastered.has(currentCard.id) ? "Mastered" : "Mark as Mastered"}
              </button>
            </div>
          </div>

          {/* BACK FACE (ANSWER EXPLANATION) */}
          <div className="absolute inset-0 h-full w-full p-8 flex flex-col justify-between bg-gradient-to-br from-emerald-500/5 via-sky-500/5 to-indigo-500/5 dark:bg-zinc-900 border border-emerald-500/30 dark:border-emerald-500/40 rounded-2xl shadow-sm [backface-visibility:hidden] [transform:rotateY(180deg)]">
            <div className="flex items-center justify-between text-xs">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-medium flex items-center gap-1">
                <Sparkles className="h-3 w-3" /> Answer Explanation
              </span>
              <span className="text-zinc-400 font-mono text-[11px] flex items-center gap-1">
                <RotateCw className="h-3 w-3" /> Click card to flip back
              </span>
            </div>

            <div className="text-center py-4 space-y-2">
              <p className="text-base text-zinc-900 dark:text-zinc-100 leading-relaxed font-medium">
                {currentCard.back}
              </p>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-zinc-200/60 dark:border-zinc-800/60">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleMastered(currentCard.id);
                }}
                className={`text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  mastered.has(currentCard.id) ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-400 hover:text-zinc-600"
                }`}
              >
                <CheckCircle className="h-4 w-4" />
                {mastered.has(currentCard.id) ? "Mastered" : "Mark as Mastered"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={handlePrev}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Previous
        </Button>
        <span className="text-xs text-zinc-400 font-mono">
          Mastered: {mastered.size} / {flashcards.length}
        </span>
        <Button variant="outline" onClick={handleNext}>
          Next <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
