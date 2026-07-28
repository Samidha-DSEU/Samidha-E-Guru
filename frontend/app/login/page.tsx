"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/context/AuthContext";
import { UserRole } from "@/types/api";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { BookOpen, GraduationCap, ShieldCheck, Award } from "lucide-react";

export default function LoginPage() {
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [selectedRole, setSelectedRole] = useState<UserRole>("student");
  const { loginWithGoogle, login, register, isLoading, user } = useAuth();
  const router = useRouter();

  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    password: ""
  });
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      if (activeTab === "register") {
        await register({ ...formData, role_name: selectedRole });
      } else {
        await login({ email: formData.email, password: formData.password });
      }
      
      if (selectedRole === "admin" || selectedRole === "super_admin") {
        router.push("/admin");
      } else if (selectedRole === "volunteer") {
        router.push("/volunteer");
      } else if (selectedRole === "alumni") {
        router.push("/alumni");
      } else {
        router.push("/dashboard");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "An error occurred");
    }
  };

  const handleGoogleLogin = async () => {
    setError("Google OAuth integration is pending. Please use 'Create Account' with Email and Password for now.");
  };

  return (
    <div className="max-w-md mx-auto py-12 space-y-6">
      <div className="text-center space-y-2">
        <div className="h-12 w-12 rounded-2xl bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400 flex items-center justify-center mx-auto border border-sky-200 dark:border-sky-800">
          <BookOpen className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Welcome to SAMIDHA E-GURU
        </h1>
        <p className="text-xs text-zinc-500">
          Access educational resources, bookmarks, progress, and community.
        </p>
      </div>

      <Card className="space-y-6">
        <div className="flex border-b border-zinc-200 dark:border-zinc-800">
          <button
            type="button"
            className={`flex-1 pb-3 text-sm font-medium ${
              activeTab === "login"
                ? "text-sky-600 border-b-2 border-sky-600 dark:text-sky-400 dark:border-sky-400"
                : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
            }`}
            onClick={() => {
              setActiveTab("login");
              setError(null);
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`flex-1 pb-3 text-sm font-medium ${
              activeTab === "register"
                ? "text-sky-600 border-b-2 border-sky-600 dark:text-sky-400 dark:border-sky-400"
                : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
            }`}
            onClick={() => {
              setActiveTab("register");
              setError(null);
            }}
          >
            Create Account
          </button>
        </div>

        <form onSubmit={handleEmailSubmit} className="space-y-4">
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

          {error && (
            <div className="p-3 text-sm text-rose-600 bg-rose-50 dark:bg-rose-950/50 dark:text-rose-400 rounded-lg">
              {error}
            </div>
          )}

          {activeTab === "register" && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Full Name
              </label>
              <input
                name="full_name"
                type="text"
                required
                value={formData.full_name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                placeholder="John Doe"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Email Address
            </label>
            <input
              name="email"
              type="email"
              required
              value={formData.email}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              placeholder="you@example.com"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Password
            </label>
            <input
              name="password"
              type="password"
              required
              value={formData.password}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              placeholder="••••••••"
            />
          </div>

          <Button
            type="submit"
            isLoading={isLoading}
            className="w-full h-11 text-sm font-semibold bg-sky-600 hover:bg-sky-500 text-white shadow-md shadow-sky-500/10"
          >
            {activeTab === "login" ? "Sign In" : "Create Account"}
          </Button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-zinc-200 dark:border-zinc-800"></div>
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-white dark:bg-zinc-950 px-2 text-zinc-500">
              Or continue with
            </span>
          </div>
        </div>

        <Button
          type="button"
          onClick={handleGoogleLogin}
          isLoading={isLoading}
          variant="outline"
          className="w-full h-11 text-sm font-semibold"
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
          Google
        </Button>
      </Card>
    </div>
  );
}
