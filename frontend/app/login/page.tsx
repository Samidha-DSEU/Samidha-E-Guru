"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/context/AuthContext";
import { UserRole } from "@/types/api";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { BookOpen, GraduationCap, ShieldCheck, Award, Eye, EyeOff, CheckCircle2, AlertCircle, Sparkles } from "lucide-react";
import { GoogleLogin, useGoogleLogin } from "@react-oauth/google";

import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { AnimatedText } from "@/components/ui/AnimatedText";
import { TypewriterText } from "@/components/ui/TypewriterText";
import { TiltCard } from "@/components/ui/TiltCard";
import { getRoleFromUserOrToken } from "@/lib/userUtils";

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

  const redirectUserByRole = (userObj: any, isRegisterMode: boolean = false) => {
    let roleName = getRoleFromUserOrToken(userObj);
    if (!roleName && isRegisterMode) {
      roleName = selectedRole;
    }
    if (!roleName) {
      roleName = "student";
    }

    if (roleName === "super_admin") {
      router.replace("/super-admin");
    } else if (roleName === "admin") {
      router.replace("/admin");
    } else if (roleName === "volunteer") {
      router.replace("/volunteer");
    } else if (roleName === "alumni") {
      router.replace("/alumni");
    } else {
      router.replace("/dashboard");
    }
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
      let loggedUser: any = null;
      if (activeTab === "register") {
        loggedUser = await register({ ...formData, role_name: selectedRole });
        redirectUserByRole(loggedUser, true);
      } else {
        loggedUser = await login({ email: formData.email, password: formData.password });
        redirectUserByRole(loggedUser, false);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || err.response?.data?.message || "An error occurred during authentication.");
    }
  };

  const handleGoogleCredentialSuccess = async (credentialResponse: any) => {
    setError(null);
    try {
      if (credentialResponse.credential) {
        const loggedUser = await loginWithGoogle(selectedRole, credentialResponse.credential);
        redirectUserByRole(loggedUser, activeTab === "register");
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || err.response?.data?.message || "An error occurred during Google sign in.");
    }
  };

  const handleGoogleError = () => {
    setError("Google Sign-In failed. Please try again.");
  };

  // Custom Google Trigger via OAuth Token Hook
  const customGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setError(null);
      const loggedUser = await loginWithGoogle(selectedRole, tokenResponse.access_token);
      redirectUserByRole(loggedUser, activeTab === "register");
    },
    onError: handleGoogleError
  });

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
            <div className="bg-white/90 dark:bg-zinc-950/90 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800/80 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
              
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
                <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block">
                  Select Your Role
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedRole("student")}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                      selectedRole === "student"
                        ? "border-sky-500 bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 shadow-sm"
                        : "border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900"
                    }`}
                  >
                    <GraduationCap className="h-4 w-4 text-sky-500" />
                    Student
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedRole("volunteer")}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                      selectedRole === "volunteer"
                        ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 shadow-sm"
                        : "border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900"
                    }`}
                  >
                    <ShieldCheck className="h-4 w-4 text-emerald-500" />
                    Volunteer
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedRole("alumni")}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                      selectedRole === "alumni"
                        ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 shadow-sm"
                        : "border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900"
                    }`}
                  >
                    <Award className="h-4 w-4 text-indigo-500" />
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
                    Or Continue With
                  </span>
                </div>
              </div>

              {/* SLEEK DARK GLASSMORPHIC GOOGLE OAUTH BUTTON */}
              <div className="space-y-3 pt-1">
                <button
                  type="button"
                  onClick={() => customGoogleLogin()}
                  className="w-full py-3 px-4 flex items-center justify-center gap-3 rounded-2xl bg-zinc-900/90 hover:bg-zinc-800 text-zinc-100 border border-zinc-800 hover:border-sky-500/50 shadow-xl transition-all group font-semibold text-sm cursor-pointer active:scale-95"
                >
                  <svg className="w-5 h-5 shrink-0 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Continue with Google</span>
                </button>

                {/* Hidden Official Fallback Renderer */}
                <div className="hidden">
                  <GoogleLogin
                    onSuccess={handleGoogleCredentialSuccess}
                    onError={handleGoogleError}
                    theme="filled_black"
                    shape="pill"
                  />
                </div>

                <div className="text-center text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 flex items-center justify-center gap-1">
                  <Sparkles className="h-3 w-3 text-sky-500" /> Fast 1-Click Google Authentication
                </div>
              </div>

            </div>
          </TiltCard>
        </ScrollReveal>
      </div>
    </div>
  );
}
