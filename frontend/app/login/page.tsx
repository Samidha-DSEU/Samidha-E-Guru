"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/context/AuthContext";
import { UserRole } from "@/types/api";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { BookOpen, GraduationCap, ShieldCheck, Award } from "lucide-react";

export default function LoginPage() {
  const [selectedRole, setSelectedRole] = useState<UserRole>("student");
  const { loginWithGoogle, isLoading, user } = useAuth();
  const router = useRouter();

  const handleGoogleLogin = async () => {
    await loginWithGoogle(selectedRole);
    if (selectedRole === "admin" || selectedRole === "super_admin") {
      router.push("/admin");
    } else if (selectedRole === "volunteer") {
      router.push("/volunteer");
    } else if (selectedRole === "alumni") {
      router.push("/alumni");
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <div className="max-w-md mx-auto py-12 space-y-6">
      <div className="text-center space-y-2">
        <div className="h-12 w-12 rounded-2xl bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400 flex items-center justify-center mx-auto border border-sky-200 dark:border-sky-800">
          <BookOpen className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Sign In to SAMIDHA E-GURU
        </h1>
        <p className="text-xs text-zinc-500">
          Access educational resources, bookmarks, progress, and community.
        </p>
      </div>

      <Card className="space-y-6">
        <div className="space-y-3">
          <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Select Your Role
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setSelectedRole("student")}
              className={`p-3 rounded-xl border text-xs font-medium flex flex-col items-center gap-1.5 transition-all ${
                selectedRole === "student"
                  ? "border-sky-500 bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 shadow-sm"
                  : "border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900"
              }`}
            >
              <GraduationCap className="h-4 w-4" />
              Student
            </button>

            <button
              type="button"
              onClick={() => setSelectedRole("volunteer")}
              className={`p-3 rounded-xl border text-xs font-medium flex flex-col items-center gap-1.5 transition-all ${
                selectedRole === "volunteer"
                  ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 shadow-sm"
                  : "border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900"
              }`}
            >
              <ShieldCheck className="h-4 w-4" />
              Volunteer
            </button>

            <button
              type="button"
              onClick={() => setSelectedRole("alumni")}
              className={`p-3 rounded-xl border text-xs font-medium flex flex-col items-center gap-1.5 transition-all ${
                selectedRole === "alumni"
                  ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 shadow-sm"
                  : "border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900"
              }`}
            >
              <Award className="h-4 w-4" />
              Alumni
            </button>
          </div>
        </div>

        <Button
          onClick={handleGoogleLogin}
          isLoading={isLoading}
          className="w-full h-11 text-sm font-semibold shadow-md shadow-sky-500/10"
        >
          <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          Sign in with Google
        </Button>
      </Card>
    </div>
  );
}
