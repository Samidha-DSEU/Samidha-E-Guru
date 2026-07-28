"use client";

import React, { useState } from "react";
import Link from "next/link";
import { BookOpen, Sparkles, User, ChevronDown, ShieldAlert, ShieldCheck, GraduationCap, Award, LayoutDashboard } from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

export function Navbar() {
  const [isPortalOpen, setIsPortalOpen] = useState(false);
  const [logoError, setLogoError] = useState(false);

  return (
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

          {/* Portals Dropdown */}
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

                <Link
                  href="/admin"
                  onClick={() => setIsPortalOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-amber-50 dark:hover:bg-amber-950/50 hover:text-amber-600 rounded-lg transition-colors"
                >
                  <LayoutDashboard className="h-4 w-4 text-amber-500" />
                  Admin Control Panel
                </Link>

                <Link
                  href="/super-admin"
                  onClick={() => setIsPortalOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-rose-50 dark:hover:bg-rose-950/50 hover:text-rose-600 rounded-lg transition-colors"
                >
                  <ShieldAlert className="h-4 w-4 text-rose-500" />
                  Super Admin Portal
                </Link>
              </div>
            )}
          </div>

          <Link href="/about" className="text-sm font-medium text-zinc-600 hover:text-sky-600 dark:text-zinc-400 dark:hover:text-sky-400 transition-colors">
            About
          </Link>
        </nav>

        {/* Right Actions & Theme Toggle */}
        <div className="flex items-center gap-3">
          <ThemeToggle />

          <Link
            href="/login"
            className="inline-flex items-center justify-center h-9 px-4 text-sm font-medium text-zinc-700 dark:text-zinc-200 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-lg transition-colors"
          >
            <User className="h-4 w-4 mr-2 text-zinc-500" />
            Sign In
          </Link>

          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center h-9 px-4 text-sm font-medium text-white bg-sky-600 hover:bg-sky-500 rounded-lg shadow-sm transition-all"
          >
            <Sparkles className="h-4 w-4 mr-1.5" />
            Dashboard
          </Link>
        </div>
      </div>
    </header>
  );
}
