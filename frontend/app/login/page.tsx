"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/context/AuthContext";
import { UserRole } from "@/types/api";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { BookOpen, GraduationCap, ShieldCheck, Award } from "lucide-react";
import { GoogleLogin } from "@react-oauth/google";

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

  const handleGoogleSuccess = async (credentialResponse: any) => {
    setError(null);
    try {
      if (credentialResponse.credential) {
        await loginWithGoogle(selectedRole, credentialResponse.credential);
        
        if (selectedRole === "admin" || selectedRole === "super_admin") {
          router.push("/admin");
        } else if (selectedRole === "volunteer") {
          router.push("/volunteer");
        } else if (selectedRole === "alumni") {
          router.push("/alumni");
        } else {
          router.push("/dashboard");
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "An error occurred during Google sign in");
    }
  };

  const handleGoogleError = () => {
    setError("Google Login Failed. Please try again.");
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

        <div className="flex justify-center w-full min-h-[44px]">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
            theme="filled_blue"
            size="large"
            width="380"
            shape="rectangular"
            text="continue_with"
          />
        </div>
      </Card>
    </div>
  );
}
