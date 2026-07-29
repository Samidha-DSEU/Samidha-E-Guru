"use client";

import React, { useState } from "react";
import Link from "next/link";
import { BookOpen, Sparkles, User, ChevronDown, ShieldCheck, GraduationCap, Award, X, MessageSquare, Mail, Phone } from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useAuth } from "@/features/auth/context/AuthContext";
import { ProfileSidebar } from "./ProfileSidebar";
import { Button } from "@/components/ui/Button";

export function Navbar() {
  const [isPortalOpen, setIsPortalOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMentorModalOpen, setIsMentorModalOpen] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const { user } = useAuth();

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand Logo & Title */}
          <Link href="/" className="flex items-center gap-2.5 group">
            {!logoError ? (
              <img
                src="/images/logo.png"
                alt="SAMIDHA E-GURU Logo"
                onError={() => setLogoError(true)}
                className="h-10 w-auto max-w-[140px] object-contain rounded-xl group-hover:scale-105 transition-transform"
              />
            ) : (
              <div className="h-9 w-9 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center border border-sky-500/20 group-hover:scale-105 transition-transform">
                <BookOpen className="h-5 w-5" />
              </div>
            )}

            <span className="font-semibold text-lg tracking-tight text-zinc-900 dark:text-zinc-50 leading-none">
              SAMIDHA <span className="text-sky-600 dark:text-sky-400">E-GURU</span>
            </span>
          </Link>

          {/* Center Navigation Links */}
          <nav className="hidden md:flex items-center gap-8">
            <Link href="/resources" className="text-sm font-medium text-zinc-600 hover:text-sky-600 dark:text-zinc-400 dark:hover:text-sky-400 transition-colors">
              Resources
            </Link>
            <Link href="/community" className="text-sm font-medium text-zinc-600 hover:text-sky-600 dark:text-zinc-400 dark:hover:text-sky-400 transition-colors">
              Community
            </Link>
            <Link href="/events" className="text-sm font-medium text-zinc-600 hover:text-sky-600 dark:text-zinc-400 dark:hover:text-sky-400 transition-colors">
              Events
            </Link>

            {/* Portals Dropdown - ONLY ON LANDING/PUBLIC (NOT LOGGED IN) */}
            {!user && (
              <div className="relative">
                <button
                  onClick={() => setIsPortalOpen(!isPortalOpen)}
                  className="text-sm font-medium text-zinc-600 hover:text-sky-600 dark:text-zinc-400 dark:hover:text-sky-400 flex items-center gap-1 transition-colors"
                >
                  Portals
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>

                {isPortalOpen && (
                  <div className="absolute top-full left-0 mt-2 w-56 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl p-2 z-50 space-y-1">
                    <Link
                      href="/dashboard"
                      onClick={() => setIsPortalOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-sky-50 dark:hover:bg-sky-950/50 hover:text-sky-600 rounded-lg transition-colors"
                    >
                      <GraduationCap className="h-4 w-4 text-sky-500" />
                      Student Dashboard
                    </Link>

                    <Link
                      href="/volunteer"
                      onClick={() => setIsPortalOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 hover:text-emerald-600 rounded-lg transition-colors"
                    >
                      <ShieldCheck className="h-4 w-4 text-emerald-500" />
                      Volunteer Portal
                    </Link>

                    <Link
                      href="/alumni"
                      onClick={() => setIsPortalOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 hover:text-indigo-600 rounded-lg transition-colors"
                    >
                      <Award className="h-4 w-4 text-indigo-500" />
                      Alumni Portal
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* GET MENTOR NAV LINK FOR LOGGED-IN STUDENTS */}
            {user && user.role?.name === "student" && (
              <button
                onClick={() => setIsMentorModalOpen(true)}
                className="text-sm font-semibold text-sky-600 dark:text-sky-400 hover:text-sky-500 flex items-center gap-1.5 transition-colors bg-sky-50 dark:bg-sky-950/60 px-3 py-1.5 rounded-lg border border-sky-200 dark:border-sky-800"
              >
                <Sparkles className="h-4 w-4 text-sky-500" />
                Get Mentor
              </button>
            )}

            <Link href="/about" className="text-sm font-medium text-zinc-600 hover:text-sky-600 dark:text-zinc-400 dark:hover:text-sky-400 transition-colors">
              About
            </Link>
          </nav>

          {/* Right Actions & Theme Toggle */}
          <div className="flex items-center gap-3">
            <ThemeToggle />

            {user ? (
              <div className="flex items-center gap-3 ml-2">
                <div className="flex flex-col items-end hidden sm:flex">
                  <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 leading-none">
                    {user.profile?.full_name || "User"}
                  </span>
                  <span className="text-xs text-zinc-500 capitalize">{user.role.name.replace("_", " ")}</span>
                </div>
                <button 
                  onClick={() => setIsProfileOpen(true)}
                  className="h-9 w-9 rounded-full bg-sky-100 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 flex items-center justify-center border border-sky-200 dark:border-sky-800 hover:scale-105 transition-transform overflow-hidden"
                >
                  {user.profile?.avatar_url ? (
                    <img src={user.profile.avatar_url} alt="Profile" className="w-full h-full object-cover rounded-full" />
                  ) : (
                    <User className="h-4 w-4" />
                  )}
                </button>
              </div>
            ) : (
              <>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center h-9 px-4 text-sm font-medium text-zinc-700 dark:text-zinc-200 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-lg transition-colors"
                >
                  <User className="h-4 w-4 mr-2 text-zinc-500" />
                  Sign In
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <ProfileSidebar isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />

      {/* GET MENTOR MODAL */}
      {isMentorModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[80] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-xl w-full p-6 space-y-6 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
              <div>
                <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-sky-500" /> Connect with SAMIDHA Mentors
                </h2>
                <p className="text-xs text-zinc-500">Reach out directly to verified SAMIDHA Volunteers & Alumni for academic & career guidance.</p>
              </div>
              <button onClick={() => setIsMentorModalOpen(false)} className="text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
              <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex items-start gap-4">
                <div className="h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center font-bold text-sm">
                  VS
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">Vikram Singh</h4>
                    <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950 text-emerald-600 text-[10px] font-semibold uppercase rounded border border-emerald-200 dark:border-emerald-800">
                      Volunteer Teacher
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500">Specialization: Physics & Mathematics (Class 9 - 12)</p>
                  <div className="pt-2 flex items-center gap-2">
                    <a
                      href="mailto:mentor@samidha.org?subject=Mentorship Request from Student"
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-lg transition-colors"
                    >
                      <Mail className="h-3.5 w-3.5" /> Send Message
                    </a>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex items-start gap-4">
                <div className="h-12 w-12 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 flex items-center justify-center font-bold text-sm">
                  AS
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">Ananya Sharma</h4>
                    <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 text-[10px] font-semibold uppercase rounded border border-indigo-200 dark:border-indigo-800">
                      Alumni Mentor
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500">Software Engineer @ TechCorp • Engineering Entrance Guidance</p>
                  <div className="pt-2 flex items-center gap-2">
                    <a
                      href="mailto:mentor@samidha.org?subject=Career Guidance Request from Student"
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-lg transition-colors"
                    >
                      <Mail className="h-3.5 w-3.5" /> Request Guidance
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
