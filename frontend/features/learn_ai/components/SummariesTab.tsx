"use client";

import React from "react";
import { FileText } from "lucide-react";
import { Card } from "@/components/ui/Card";

interface SummariesTabProps {
  summaries: {
    one_min_bullets: string[];
    five_min_paragraph: string;
    revision_notes: string[];
  };
}

export function SummariesTab({ summaries }: SummariesTabProps) {
  const notes = summaries.revision_notes && summaries.revision_notes.length > 0 
    ? summaries.revision_notes 
    : (summaries.one_min_bullets || []);

  return (
    <div className="space-y-6">
      <Card className="space-y-4 border-l-4 border-l-purple-500">
        <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-semibold text-sm">
          <FileText className="h-4 w-4" /> Bulletproof Revision Notes
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {notes.map((note, idx) => (
            <div
              key={idx}
              className="p-3 rounded-xl bg-purple-500/5 border border-purple-500/10 text-xs text-zinc-700 dark:text-zinc-300 font-medium"
            >
              📌 {note}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
