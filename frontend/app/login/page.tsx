"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/context/AuthContext";
import { UserRole } from "@/types/api";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { BookOpen, GraduationCap, ShieldCheck, Award, Eye, EyeOff, CheckCircle2, AlertCircle } from "lucide-react";
import { GoogleLogin } from "@react-oauth/google";

export default function LoginPage() {
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [selectedRole, setSelectedRole] = useState<UserRole>("student");
  const { loginWithGoogle, login, register, isLoading } = useAuth();
  const router = useRouter();

  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    password: ""
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState({
    email: false,
    password: false,
    full_name: false
  });
  const [error, setError] = useState<string | null>(null);

  // Validation Logic
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isEmailValid = emailRegex.test(formData.email.trim());
  const isEmailTouched = touched.email && formData.email.length > 0;

  const isPasswordMinLength = formData.password.length >= 8;
  const hasLetter = /[a-zA-Z]/.test(formData.password);
  const hasNumber = /[0-9]/.test(formData.password);
  const isPasswordStrong = isPasswordMinLength && hasLetter && hasNumber;
  const isPasswordTouched = touched.password && formData.password.length > 0;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleBlur = (field: "email" | "password" | "full_name") => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setTouched({ email: true, password: true, full_name: true });

    if (!isEmailValid) {
      setError("Please enter a valid email address.");
      return;
    }

    if (activeTab === "register" && !isPasswordStrong) {
      setError("Password must be at least 8 characters long and contain both letters and numbers.");
      return;
    }

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
      setError(err.response?.data?.detail || err.response?.data?.message || "An error occurred");
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
      setError(err.response?.data?.detail || err.response?.data?.message || "An error occurred during Google sign in");
    }
  };

  const handleGoogleError = () => {
    setError("Google Login Failed. Please try again.");
  };

  return (
    <div className="max-w-md mx-auto py-12 space-y-6">
      <div className="text-center space-y-2">
        <div className="h-12 w-12 rounded-2xl bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400 flex items-center justify-center mx-auto border border-sky-200 dark:border-sky-800 shadow-sm">
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
            className={`flex-1 pb-3 text-sm font-medium transition-colors ${
              activeTab === "login"
                ? "text-sky-600 border-b-2 border-sky-600 dark:text-sky-400 dark:border-sky-400 font-semibold"
                : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
            }`}
            onClick={() => {
              setActiveTab("login");
              setError(null);
              setTouched({ email: false, password: false, full_name: false });
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`flex-1 pb-3 text-sm font-medium transition-colors ${
              activeTab === "register"
                ? "text-sky-600 border-b-2 border-sky-600 dark:text-sky-400 dark:border-sky-400 font-semibold"
                : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
            }`}
            onClick={() => {
              setActiveTab("register");
              setError(null);
              setTouched({ email: false, password: false, full_name: false });
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
            <div className="p-3 text-xs sm:text-sm text-rose-600 bg-rose-50 dark:bg-rose-950/50 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 rounded-xl flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
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
                onBlur={() => handleBlur("full_name")}
                className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-xl bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
                placeholder="John Doe"
              />
            </div>
          )}

          {/* EMAIL INPUT WITH VALIDATION ICON */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Email Address
              </label>
            </div>
            <div className="relative flex items-center">
              <input
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleInputChange}
                onBlur={() => handleBlur("email")}
                className={`w-full px-3 py-2 pr-10 border rounded-xl bg-transparent text-sm focus:outline-none focus:ring-2 transition-all ${
                  isEmailTouched && !isEmailValid
                    ? "border-rose-400 dark:border-rose-600 focus:ring-rose-500"
                    : formData.email.length > 0 && isEmailValid
                    ? "border-emerald-400 dark:border-emerald-600 focus:ring-emerald-500"
                    : "border-zinc-300 dark:border-zinc-700 focus:ring-sky-500"
                }`}
                placeholder="you@example.com"
              />
              <div className="absolute right-3 pointer-events-none flex items-center">
                {formData.email.length > 0 && (
                  isEmailValid ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 animate-in fade-in" />
                  ) : (
                    isEmailTouched && <AlertCircle className="h-4 w-4 text-rose-500 animate-in fade-in" />
                  )
                )}
              </div>
            </div>
            {isEmailTouched && !isEmailValid && (
              <p className="text-[11px] text-rose-500 flex items-center gap-1 mt-1 font-medium">
                <AlertCircle className="h-3 w-3 shrink-0" /> Please enter a valid email address (e.g. user@domain.com)
              </p>
            )}
          </div>

          {/* PASSWORD INPUT WITH EYE TOGGLE & STRENGTH BADGES */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Password
              </label>
            </div>
            <div className="relative flex items-center">
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                required
                value={formData.password}
                onChange={handleInputChange}
                onBlur={() => handleBlur("password")}
                className={`w-full px-3 py-2 pr-10 border rounded-xl bg-transparent text-sm focus:outline-none focus:ring-2 transition-all ${
                  activeTab === "register" && isPasswordTouched && !isPasswordStrong
                    ? "border-rose-400 dark:border-rose-600 focus:ring-rose-500"
                    : activeTab === "register" && isPasswordStrong
                    ? "border-emerald-400 dark:border-emerald-600 focus:ring-emerald-500"
                    : "border-zinc-300 dark:border-zinc-700 focus:ring-sky-500"
                }`}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 focus:outline-none transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>

            {/* Password Validation Hints for Registration */}
            {activeTab === "register" && formData.password.length > 0 && (
              <div className="pt-1.5 space-y-1">
                <div className="flex items-center gap-3 text-[11px]">
                  <span className={`flex items-center gap-1 font-medium transition-colors ${
                    isPasswordMinLength ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-400"
                  }`}>
                    <CheckCircle2 className={`h-3 w-3 ${isPasswordMinLength ? "text-emerald-500" : "text-zinc-300 dark:text-zinc-600"}`} />
                    8+ characters
                  </span>
                  <span className={`flex items-center gap-1 font-medium transition-colors ${
                    hasLetter && hasNumber ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-400"
                  }`}>
                    <CheckCircle2 className={`h-3 w-3 ${hasLetter && hasNumber ? "text-emerald-500" : "text-zinc-300 dark:text-zinc-600"}`} />
                    Letters & numbers
                  </span>
                </div>
              </div>
            )}
          </div>

          <Button
            type="submit"
            isLoading={isLoading}
            className="w-full h-11 text-sm font-semibold bg-sky-600 hover:bg-sky-500 text-white shadow-md shadow-sky-500/10 rounded-xl"
          >
            {activeTab === "login" ? "Sign In" : "Create Account"}
          </Button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-zinc-200 dark:border-zinc-800"></div>
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-white dark:bg-zinc-950 px-2 text-zinc-500 font-medium">
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
