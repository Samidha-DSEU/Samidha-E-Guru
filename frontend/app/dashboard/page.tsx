"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { getUserSlug } from "@/lib/userUtils";
import { BookOpen, Bookmark, CheckCircle, Bell, Award, Sparkles, Mail, UserCheck } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/features/auth/context/AuthContext";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const [requested, setRequested] = useState<string | null>(null);

  useEffect(() => {
    if (user && (!params || !params.username)) {
      const slug = getUserSlug(user);
      router.replace(`/dashboard/${slug}`);
    }
  }, [user, params, router]);

  const handleRequestMentorship = (name: string) => {
    setRequested(name);
    setTimeout(() => setRequested(null), 3000);
  };

  return (
    <ProtectedRoute allowedRoles={["student"]}>
      <div className="space-y-8">
        {/* Overview Banner */}
        <div className="bg-gradient-to-r from-sky-600 via-sky-500 to-indigo-600 rounded-3xl p-8 text-white space-y-3 shadow-lg shadow-sky-500/10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="h-3.5 w-3.5" /> Student Dashboard
          </div>
          <h1 className="text-3xl font-bold">Welcome back, {user?.profile?.full_name?.split(' ')[0] || "Student"}!</h1>
          <p className="text-sky-100 text-sm max-w-xl">
            Track your learning progress, review bookmarked study resources, and connect directly with SAMIDHA volunteer teachers & alumni mentors.
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

        {/* GET MENTOR SECTION */}
        <Card className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-4">
            <div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-sky-500" /> Recommended SAMIDHA Mentors
              </h2>
              <p className="text-xs text-zinc-500">Directly connect with SAMIDHA volunteer teachers and senior alumni mentors for academic guidance.</p>
            </div>
          </div>

          {requested && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-medium rounded-xl">
              Mentorship request sent to <strong>{requested}</strong>! They will contact you via email shortly.
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex flex-col justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center font-bold text-xs shrink-0">
                  VS
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">Vikram Singh</h4>
                    <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950 text-emerald-600 text-[10px] font-semibold uppercase rounded border border-emerald-200 dark:border-emerald-800">
                      Volunteer Teacher
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500">Specialization: Physics & Mathematics (Class 9 - 12)</p>
                </div>
              </div>
              <Button
                onClick={() => handleRequestMentorship("Vikram Singh")}
                className="w-full h-9 text-xs bg-sky-600 hover:bg-sky-500 text-white"
              >
                <Mail className="h-3.5 w-3.5 mr-1.5" /> Contact Teacher
              </Button>
            </div>

            <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex flex-col justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 flex items-center justify-center font-bold text-xs shrink-0">
                  AS
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">Ananya Sharma</h4>
                    <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 text-[10px] font-semibold uppercase rounded border border-indigo-200 dark:border-indigo-800">
                      Alumni Mentor
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500">Software Engineer @ TechCorp • Engineering Entrance Guidance</p>
                </div>
              </div>
              <Button
                onClick={() => handleRequestMentorship("Ananya Sharma")}
                className="w-full h-9 text-xs bg-sky-600 hover:bg-sky-500 text-white"
              >
                <Mail className="h-3.5 w-3.5 mr-1.5" /> Contact Mentor
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </ProtectedRoute>
  );
}
