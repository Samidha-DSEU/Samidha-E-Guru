"use client";

import React from "react";
import { Award, Plus, MessageSquare, BookOpen } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function AlumniDashboardPage() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Alumni Mentorship Portal
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400 text-sm">
            Share career guidance, mentor aspiring students, and publish educational articles.
          </p>
        </div>

        <Button onClick={() => alert("Mentorship Article creation will be available in the next release!")}>
          <Plus className="h-4 w-4 mr-2" />
          Create Mentorship Article
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card className="space-y-2">
          <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Articles Published</div>
          <div className="text-3xl font-bold">8</div>
        </Card>

        <Card className="space-y-2">
          <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Students Guided</div>
          <div className="text-3xl font-bold text-sky-600">45</div>
        </Card>

        <Card className="space-y-2">
          <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Mentorship Badge</div>
          <div className="text-lg font-bold text-indigo-600">Senior Alumni Mentor</div>
        </Card>
      </div>
    </div>
  );
}
