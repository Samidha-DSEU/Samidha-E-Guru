"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/context/AuthContext";
import { UserRole } from "@/types/api";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { BookOpen, GraduationCap, ShieldCheck, Award, Eye, EyeOff, CheckCircle2, AlertCircle, Sparkles } from "lucide-react";
import { GoogleLogin } from "@react-oauth/google";
import { CursorDotsCanvas } from "@/components/ui/CursorDotsCanvas";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { AnimatedText } from "@/components/ui/AnimatedText";
import { TypewriterText } from "@/components/ui/TypewriterText";
import { TiltCard } from "@/components/ui/TiltCard";

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
        await login({ email: formData.email, password: formData.password, role_name: selectedRole });
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
      setError(err.response?.data?.detail || err.response?.data?.message || "An error occurred during authentication.");
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
      setError(err.response?.data?.detail || err.response?.data?.message || "An error occurred during Google sign in.");
    }
  };

  const handleGoogleError = () => {
    setError("Google Sign-In failed. Please try again.");
  };

  return (
    <div className="relative min-h-[85vh] flex items-center justify-center py-10 px-4 selection:bg-sky-500 selection:text-white">
      <CursorDotsCanvas />

      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* Header Title with Blur-Fade Reveal */}
        <ScrollReveal direction="down" delay={0}>
          <div className="text-center space-y-2">
            <div className="h-14 w-14 rounded-2xl bg-sky-500/10 dark:bg-sky-400/10 text-sky-600 dark:text-sky-400 flex items-center justify-center mx-auto border border-sky-500/20 shadow-lg shadow-sky-500/10">
              <BookOpen className="h-7 w-7" />
            </div>
            
            <AnimatedText
              text="Welcome to SAMIDHA E-GURU"
              gradientWords={["SAMIDHA", "E-GURU"]}
              className="text-2xl sm:text-3xl font-extrabold tracking-tight"
            />
            
            <TypewriterText
              text="Access educational resources, bookmarks, progress tracking, and mentorship community."
              highlightWords={["resources", "progress", "mentorship"]}
              speedMs={15}
              className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400"
            />
          </div>
        </ScrollReveal>

        {/* Auth Glassmorphism Card Container */}
        <ScrollReveal direction="up" delay={100}>
          <TiltCard>
            <div className="bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
              
              {/* Sign In vs Create Account Tabs */}
              <div className="flex border-b border-zinc-200 dark:border-zinc-800 pb-2">
                <button
                  type="button"
                  className={`flex-1 pb-2 text-sm font-bold transition-all relative ${
                    activeTab === "login"
                      ? "text-sky-600 dark:text-sky-400"
                      : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                  }`}
                  onClick={() => {
                    setActiveTab("login");
                    setError(null);
                    setTouched({ email: false, password: false, full_name: false });
                  }}
                >
                  Sign In
                  {activeTab === "login" && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-sky-500 rounded-full" />
                  )}
                </button>
                <button
                  type="button"
                  className={`flex-1 pb-2 text-sm font-bold transition-all relative ${
                    activeTab === "register"
                      ? "text-sky-600 dark:text-sky-400"
                      : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                  }`}
                  onClick={() => {
                    setActiveTab("register");
                    setError(null);
                    setTouched({ email: false, password: false, full_name: false });
                  }}
                >
                  Create Account
                  {activeTab === "register" && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-sky-500 rounded-full" />
                  )}
                </button>
              </div>

              {/* Role Selection Grid */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Target Access Role
                  </label>
                  <span className="text-[10px] text-sky-600 dark:text-sky-400 font-medium">
                    Multi-Role Portal Access
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedRole("student")}
                    className={`p-2.5 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                      selectedRole === "student"
                        ? "border-sky-500 bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 shadow-md shadow-sky-500/10"
                        : "border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900"
                    }`}
                  >
                    <GraduationCap className="h-4 w-4" />
                    Student
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedRole("volunteer")}
                    className={`p-2.5 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                      selectedRole === "volunteer"
                        ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 shadow-md shadow-emerald-500/10"
                        : "border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900"
                    }`}
                  >
                    <ShieldCheck className="h-4 w-4" />
                    Volunteer
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedRole("alumni")}
                    className={`p-2.5 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                      selectedRole === "alumni"
                        ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 shadow-md shadow-indigo-500/10"
                        : "border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900"
                    }`}
                  >
                    <Award className="h-4 w-4" />
                    Alumni
                  </button>
                </div>
              </div>

              {error && (
                <div className="p-3 text-xs text-rose-600 bg-rose-50 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded-2xl flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Email / Password Form */}
              <form onSubmit={handleEmailSubmit} className="space-y-4">
                {activeTab === "register" && (
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                      Full Name
                    </label>
                    <input
                      name="full_name"
                      type="text"
                      required
                      value={formData.full_name}
                      onChange={handleInputChange}
                      onBlur={() => handleBlur("full_name")}
                      className="w-full px-3.5 py-2.5 border border-zinc-300 dark:border-zinc-700 rounded-xl bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
                      placeholder="E.g., Rahul Sharma"
                    />
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    Email Address
                  </label>
                  <div className="relative flex items-center">
                    <input
                      name="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={handleInputChange}
                      onBlur={() => handleBlur("email")}
                      className={`w-full px-3.5 py-2.5 pr-10 border rounded-xl bg-transparent text-sm focus:outline-none focus:ring-2 transition-all ${
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
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    Password
                  </label>
                  <div className="relative flex items-center">
                    <input
                      name="password"
                      type={showPassword ? "text" : "password"}
                      required
                      value={formData.password}
                      onChange={handleInputChange}
                      onBlur={() => handleBlur("password")}
                      className={`w-full px-3.5 py-2.5 pr-10 border rounded-xl bg-transparent text-sm focus:outline-none focus:ring-2 transition-all ${
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
                      className="absolute right-3 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  isLoading={isLoading}
                  className="w-full h-11 text-sm font-bold bg-sky-600 hover:bg-sky-500 text-white shadow-lg shadow-sky-500/20 rounded-2xl transition-all"
                >
                  {activeTab === "login" ? "Sign In to Dashboard" : "Create My Account"}
                </Button>
              </form>

              {/* Divider & Google OAuth Section */}
              <div className="relative pt-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-zinc-200 dark:border-zinc-800" />
                </div>
                <div className="relative flex justify-center text-[11px] font-semibold uppercase tracking-wider">
                  <span className="bg-white dark:bg-zinc-950 px-3 text-zinc-400">
                    Or Sign In With Google
                  </span>
                </div>
              </div>

              {/* TRADITIONAL CIRCULAR GOOGLE OAUTH BUTTON */}
              <div className="flex flex-col items-center justify-center gap-2 pt-1">
                <div className="p-1 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:scale-105 transition-transform shadow-md">
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={handleGoogleError}
                    type="icon"
                    shape="circle"
                    size="large"
                  />
                </div>
                <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                  <Sparkles className="h-3 w-3 text-sky-500" /> Fast 1-Click Google Authentication
                </span>
              </div>

            </div>
          </TiltCard>
        </ScrollReveal>
      </div>
    </div>
  );
}
