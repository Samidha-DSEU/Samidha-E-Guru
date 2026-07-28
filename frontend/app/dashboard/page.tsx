"use client";

import React from "react";
import { BookOpen, Bookmark, CheckCircle, Bell, Award, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { useAuth } from "@/features/auth/context/AuthContext";

export default function DashboardPage() {
  const { user } = useAuth();
  return (
    <div className="space-y-8">
      {/* Overview Banner */}
      <div className="bg-gradient-to-r from-sky-600 via-sky-500 to-indigo-600 rounded-3xl p-8 text-white space-y-3 shadow-lg shadow-sky-500/10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold uppercase tracking-wider">
          <Sparkles className="h-3.5 w-3.5" /> Student Dashboard
        </div>
        <h1 className="text-3xl font-bold">Welcome back, {user?.profile?.full_name?.split(' ')[0] || "Student"}!</h1>
        <p className="text-sky-100 text-sm max-w-xl">
          Track your learning progress, review bookmarked study resources, and manage upcoming registered events.
        </p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card className="space-y-2">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Bookmarks</span>
            <Bookmark className="h-4 w-4 text-sky-600" />
          </div>
          <div className="text-3xl font-bold">12</div>
          <p className="text-xs text-zinc-400">Saved resources</p>
        </Card>

        <Card className="space-y-2">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Chapter Progress</span>
            <CheckCircle className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-bold">75%</div>
          <p className="text-xs text-zinc-400">Average completion</p>
        </Card>

        <Card className="space-y-2">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Registered Events</span>
            <Award className="h-4 w-4 text-indigo-600" />
          </div>
          <div className="text-3xl font-bold">2</div>
          <p className="text-xs text-zinc-400">Upcoming workshops</p>
        </Card>
      </div>
    </div>
  );
}
