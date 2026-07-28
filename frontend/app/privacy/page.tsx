import React from "react";
import { ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/Card";

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6 py-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Privacy Policy & Data Security
        </h1>
        <p className="text-xs text-zinc-500">Last updated: July 2026</p>
      </div>

      <Card className="space-y-4 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
        <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-base">Data Protection Commitment</h3>
        <p>
          SAMIDHA E-GURU respects user privacy. We do not sell or monetize student data. Google OAuth tokens and session cookies are used strictly for authentication and platform access control.
        </p>
      </Card>
    </div>
  );
}
