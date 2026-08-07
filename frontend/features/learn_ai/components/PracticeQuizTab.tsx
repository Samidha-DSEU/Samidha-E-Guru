"use client";

import React, { useState } from "react";
import { CheckCircle2, XCircle, HelpCircle, Award, AlertCircle, RefreshCw } from "lucide-react";
import { TaxonomyQuestion, QuizResult, learnAiService } from "../services/learnAiService";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export function PracticeQuizTab({ resourceId, questionBank }: { resourceId: string; questionBank: TaxonomyQuestion[] }) {
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<QuizResult | null>(null);

  const handleSelectOption = (qId: string, optionId: string) => {
    if (result) return; // Prevent changing after submission
    setUserAnswers((prev) => ({ ...prev, [qId]: optionId }));
  };

  const handleSubmit = async () => {
    if (Object.keys(userAnswers).length === 0 || submitting) return;
    setSubmitting(true);
    try {
      const res = await learnAiService.submitQuiz(resourceId, userAnswers);
      setResult(res);
    } catch (err) {
      console.error("Quiz submit error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setUserAnswers({});
    setResult(null);
  };

  if (!questionBank || questionBank.length === 0) {
    return <div className="text-sm text-zinc-400 py-8 text-center">No quiz questions generated for this chapter.</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header Result Summary if Submitted */}
      {result && (
        <Card className="p-6 bg-gradient-to-r from-sky-500/10 to-indigo-500/10 border-sky-500/30 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-sky-600 text-white flex items-center justify-center font-bold text-lg">
                {result.percentage}%
              </div>
              <div>
                <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
                  Quiz Performance Evaluation
                </h3>
                <p className="text-xs text-zinc-500">
                  Score: {result.score} / {result.total_questions} Questions Correct
                </p>
              </div>
            </div>

            <Button variant="outline" size="sm" onClick={handleReset}>
              <RefreshCw className="h-4 w-4 mr-1.5" /> Retake Quiz
            </Button>
          </div>

          {result.weak_topics.length > 0 && (
            <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 text-xs">
              <span className="font-semibold text-rose-500 flex items-center gap-1">
                <AlertCircle className="h-3.5 w-3.5" /> Identified Weak Topics for Revision:
              </span>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {result.weak_topics.map((topic, idx) => (
                  <span key={idx} className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 font-medium">
                    {topic}
                  </span>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Questions List */}
      <div className="space-y-4">
        {questionBank.map((q, idx) => {
          const selected = userAnswers[q.id];
          const evaluated = result?.results.find((r) => r.question_id === q.id);

          return (
            <Card key={q.id} className="space-y-4">
              <div className="flex items-center justify-between text-xs">
                <span className="px-2.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-mono font-medium">
                  Question {idx + 1} • {q.bloom_level}
                </span>

                {evaluated && (
                  <span className={`font-semibold flex items-center gap-1 ${evaluated.is_correct ? "text-emerald-500" : "text-rose-500"}`}>
                    {evaluated.is_correct ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                    {evaluated.is_correct ? "Correct" : "Incorrect"}
                  </span>
                )}
              </div>

              <h4 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
                {q.question}
              </h4>

              {/* Options */}
              {q.options && q.options.length > 0 && (
                <div className="space-y-2">
                  {q.options.map((opt) => {
                    const isSelected = selected === opt.id;
                    const isCorrectOpt = q.correct_answer === opt.id;

                    let optStyle = "bg-zinc-50 dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300";
                    if (isSelected) {
                      optStyle = "bg-sky-500/10 border-sky-500 text-sky-600 dark:text-sky-400 font-semibold";
                    }
                    if (result && isCorrectOpt) {
                      optStyle = "bg-emerald-500/15 border-emerald-500 text-emerald-60 me-2 font-semibold dark:text-emerald-400";
                    } else if (result && isSelected && !isCorrectOpt) {
                      optStyle = "bg-rose-500/15 border-rose-500 text-rose-600 dark:text-rose-400 font-semibold";
                    }

                    return (
                      <div
                        key={opt.id}
                        onClick={() => handleSelectOption(q.id, opt.id)}
                        className={`p-3 rounded-xl border text-xs cursor-pointer transition-all flex items-center gap-3 ${optStyle}`}
                      >
                        <span className="h-6 w-6 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center font-bold text-[11px] shrink-0">
                          {opt.id}
                        </span>
                        <span>{opt.text}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Explanation display post submission */}
              {result && (
                <div className="p-3 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 text-xs text-zinc-600 dark:text-zinc-300 space-y-1">
                  <span className="font-semibold text-sky-600 dark:text-sky-400 block">Explanation:</span>
                  <p>{q.explanation}</p>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Submit Button */}
      {!result && (
        <div className="flex justify-end pt-4">
          <Button
            size="lg"
            onClick={handleSubmit}
            disabled={submitting || Object.keys(userAnswers).length === 0}
          >
            {submitting ? "Evaluating Practice Quiz..." : "Submit Practice Quiz"}
          </Button>
        </div>
      )}
    </div>
  );
}
