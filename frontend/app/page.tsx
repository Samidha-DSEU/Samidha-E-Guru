"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  BookOpen, GraduationCap, Users, Sparkles, ArrowRight, ShieldCheck, Search, Award, 
  Cpu, CheckCircle2, Zap, Play, MessageSquare, ShieldAlert, Star, Compass, Layers, Globe
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useAuth } from "@/features/auth/context/AuthContext";
import { getUserHomeLink } from "@/lib/userUtils";

export default function LandingPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user) {
      router.replace(getUserHomeLink(user));
    }
  }, [user, isLoading, router]);

  if (user) {
    return null;
  }

  return (
    <div className="relative overflow-hidden space-y-28 py-10 selection:bg-sky-500 selection:text-white">
      
      {/* 3D BACKGROUND GLOWING ORBS & ANIMATED MESH GRADIENTS */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-10 left-1/4 w-96 h-96 bg-sky-500/20 dark:bg-sky-500/15 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute top-32 right-1/4 w-96 h-96 bg-purple-500/20 dark:bg-purple-500/15 rounded-full blur-[120px] animate-pulse delay-1000" />
        <div className="absolute top-80 left-1/3 w-80 h-80 bg-emerald-500/15 dark:bg-emerald-500/10 rounded-full blur-[100px]" />
      </div>

      {/* HERO SECTION WITH 3D GLASS CARDS */}
      <section className="relative text-center space-y-10 max-w-5xl mx-auto px-4">
        
        {/* Floating 3D Badge */}
        <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/80 dark:bg-zinc-900/80 border border-zinc-200/80 dark:border-zinc-800 backdrop-blur-xl shadow-xl shadow-sky-500/5 hover:scale-105 transition-transform cursor-pointer">
          <span className="flex h-2 w-2 rounded-full bg-sky-500 animate-ping" />
          <Sparkles className="h-4 w-4 text-sky-500" />
          <span className="text-xs font-bold tracking-wider uppercase bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent">
            SAMIDHA SaaS Educational Platform 2.0
          </span>
        </div>

        {/* 3D Heading with Rich Typography */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 leading-[1.1]">
          Free, Structured & <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-600 bg-clip-text text-transparent drop-shadow-sm">
            AI-Driven Education
          </span> for Everyone
        </h1>

        <p className="text-lg sm:text-xl text-zinc-600 dark:text-zinc-400 font-normal leading-relaxed max-w-3xl mx-auto">
          High-quality NCERT, CBSE, DIKSHA, SWAYAM, and NPTEL study materials, 1-on-1 alumni mentorship, and interactive bootcamps — 100% free forever.
        </p>

        {/* Call to Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <Link href="/resources">
            <Button size="lg" className="h-13 px-8 text-base bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white shadow-xl shadow-sky-500/25 rounded-2xl hover:scale-[1.02] active:scale-95 transition-all">
              <Search className="h-5 w-5 mr-2" />
              Explore Study Library
              <ArrowRight className="h-5 w-5 ml-2.5" />
            </Button>
          </Link>

          <Link href="/community">
            <Button variant="outline" size="lg" className="h-13 px-8 text-base backdrop-blur-xl bg-white/60 dark:bg-zinc-900/60 border-zinc-300 dark:border-zinc-800 rounded-2xl hover:scale-[1.02] active:scale-95 transition-all">
              <Users className="h-5 w-5 mr-2 text-indigo-500" />
              Mentorship Directory
            </Button>
          </Link>
        </div>

        {/* 3D PLATFORM STATS BAR */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-10">
          <div className="p-6 rounded-3xl bg-white/70 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800/80 backdrop-blur-xl shadow-xl hover:-translate-y-1 transition-transform">
            <div className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-sky-500 to-indigo-600">10,000+</div>
            <div className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mt-1 uppercase tracking-wider">Structured Resources</div>
          </div>

          <div className="p-6 rounded-3xl bg-white/70 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800/80 backdrop-blur-xl shadow-xl hover:-translate-y-1 transition-transform">
            <div className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-emerald-500 to-teal-600">500+</div>
            <div className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mt-1 uppercase tracking-wider">Verified Teachers</div>
          </div>

          <div className="p-6 rounded-3xl bg-white/70 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800/80 backdrop-blur-xl shadow-xl hover:-translate-y-1 transition-transform">
            <div className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-purple-500 to-indigo-600">200+</div>
            <div className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mt-1 uppercase tracking-wider">Alumni Mentors</div>
          </div>

          <div className="p-6 rounded-3xl bg-white/70 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800/80 backdrop-blur-xl shadow-xl hover:-translate-y-1 transition-transform">
            <div className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-amber-500 to-rose-600">100%</div>
            <div className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mt-1 uppercase tracking-wider">Free & Open Access</div>
          </div>
        </div>
      </section>

      {/* 🚀 INTERACTIVE 3D PORTALS SELECTION CARDS */}
      <section className="max-w-7xl mx-auto px-4 space-y-10">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 text-xs font-bold uppercase tracking-widest border border-purple-500/20">
            <Layers className="h-3.5 w-3.5" /> Tailored Portals for Every Role
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight">
            Role-Based Interactive Hubs
          </h2>
          <p className="text-zinc-600 dark:text-zinc-400 text-sm">
            Whether you are a learner, volunteer teacher, alumni mentor, or administrator — SAMIDHA has a dedicated portal for you.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* PORTAL 1: STUDENT */}
          <div className="group relative p-7 rounded-3xl bg-gradient-to-b from-sky-500/10 via-white/80 to-white dark:from-sky-950/40 dark:via-zinc-900/90 dark:to-zinc-900 border border-sky-200/80 dark:border-sky-800/60 shadow-xl hover:shadow-2xl hover:shadow-sky-500/20 transition-all duration-300 hover:-translate-y-2 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="h-14 w-14 rounded-2xl bg-sky-500 text-white flex items-center justify-center shadow-lg shadow-sky-500/30 group-hover:scale-110 transition-transform">
                <GraduationCap className="h-7 w-7" />
              </div>
              <div>
                <span className="px-2.5 py-0.5 rounded-md bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 text-[10px] font-bold uppercase tracking-wider">
                  Learner Portal
                </span>
                <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mt-2">Student Dashboard</h3>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-2 leading-relaxed">
                  Browse structured chapter notes, download PYQs, track study progress, and reach out to mentors.
                </p>
              </div>
            </div>
            <Link href="/dashboard" className="pt-6">
              <Button size="sm" className="w-full bg-sky-600 hover:bg-sky-500 text-white rounded-xl font-bold">
                Access Student Hub ➔
              </Button>
            </Link>
          </div>

          {/* PORTAL 2: VOLUNTEER */}
          <div className="group relative p-7 rounded-3xl bg-gradient-to-b from-emerald-500/10 via-white/80 to-white dark:from-emerald-950/40 dark:via-zinc-900/90 dark:to-zinc-900 border border-emerald-200/80 dark:border-emerald-800/60 shadow-xl hover:shadow-2xl hover:shadow-emerald-500/20 transition-all duration-300 hover:-translate-y-2 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="h-14 w-14 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30 group-hover:scale-110 transition-transform">
                <ShieldCheck className="h-7 w-7" />
              </div>
              <div>
                <span className="px-2.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold uppercase tracking-wider">
                  Teacher Portal
                </span>
                <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mt-2">Volunteer Portal</h3>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-2 leading-relaxed">
                  Upload study notes, organize bootcamp events, interact with alumni mentors, and guide students.
                </p>
              </div>
            </div>
            <Link href="/volunteer" className="pt-6">
              <Button size="sm" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold">
                Access Volunteer Hub ➔
              </Button>
            </Link>
          </div>

          {/* PORTAL 3: ALUMNI */}
          <div className="group relative p-7 rounded-3xl bg-gradient-to-b from-indigo-500/10 via-white/80 to-white dark:from-indigo-950/40 dark:via-zinc-900/90 dark:to-zinc-900 border border-indigo-200/80 dark:border-indigo-800/60 shadow-xl hover:shadow-2xl hover:shadow-indigo-500/20 transition-all duration-300 hover:-translate-y-2 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="h-14 w-14 rounded-2xl bg-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-500/30 group-hover:scale-110 transition-transform">
                <Award className="h-7 w-7" />
              </div>
              <div>
                <span className="px-2.5 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold uppercase tracking-wider">
                  Mentor Portal
                </span>
                <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mt-2">Alumni Portal</h3>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-2 leading-relaxed">
                  Offer 1-on-1 mentorship, share market insights, approve guidance requests, and direct chat.
                </p>
              </div>
            </div>
            <Link href="/alumni" className="pt-6">
              <Button size="sm" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold">
                Access Alumni Hub ➔
              </Button>
            </Link>
          </div>

          {/* PORTAL 4: SUPER ADMIN */}
          <div className="group relative p-7 rounded-3xl bg-gradient-to-b from-rose-500/10 via-white/80 to-white dark:from-rose-950/40 dark:via-zinc-900/90 dark:to-zinc-900 border border-rose-200/80 dark:border-rose-800/60 shadow-xl hover:shadow-2xl hover:shadow-rose-500/20 transition-all duration-300 hover:-translate-y-2 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="h-14 w-14 rounded-2xl bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-500/30 group-hover:scale-110 transition-transform">
                <ShieldAlert className="h-7 w-7" />
              </div>
              <div>
                <span className="px-2.5 py-0.5 rounded-md bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 text-[10px] font-bold uppercase tracking-wider">
                  Master Authority
                </span>
                <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mt-2">Super Admin Control</h3>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-2 leading-relaxed">
                  Trigger external web scrapers, view API payload contracts, manage user RBAC, and run health diagnostics.
                </p>
              </div>
            </div>
            <Link href="/super-admin" className="pt-6">
              <Button size="sm" className="w-full bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold">
                Access Master Control ➔
              </Button>
            </Link>
          </div>

        </div>
      </section>

      {/* 🔮 FEATURE SHOWCASE: 3D DEPTH CARDS */}
      <section className="max-w-7xl mx-auto px-4 space-y-12">
        <div className="bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 border border-zinc-800 rounded-3xl p-8 sm:p-14 text-white shadow-2xl space-y-10 relative overflow-hidden">
          <div className="absolute right-0 bottom-0 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/20 text-sky-400 border border-sky-500/30 text-xs font-semibold uppercase tracking-wider">
              <Zap className="h-3.5 w-3.5" /> High Performance Architecture
            </div>
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
              Why SAMIDHA E-GURU?
            </h2>
            <p className="text-zinc-400 text-sm">
              Engineered with modern Next.js 15, FastAPI, PostgreSQL, and Supabase for zero-latency educational access.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <div className="p-6 rounded-2xl bg-zinc-800/70 border border-zinc-700/60 backdrop-blur-md space-y-3">
              <div className="h-10 w-10 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold">
                <Compass className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-zinc-100">Structured Hierarchy</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Class 6–12 & Undergraduate subject materials neatly categorized by chapters and resource types.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-zinc-800/70 border border-zinc-700/60 backdrop-blur-md space-y-3">
              <div className="h-10 w-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
                <MessageSquare className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-zinc-100">1-on-1 Direct Chat & Auto-Purge</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Text-only mentorship chat room with automated 3-day message purge for privacy and zero technical debt.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-zinc-800/70 border border-zinc-700/60 backdrop-blur-md space-y-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                <Cpu className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-zinc-100">Scraper Microservice Trigger</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Integrated Webhook crawlers pulling trusted educational content from NCERT, CBSE, DIKSHA & SWAYAM.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* FOOTER CALL TO ACTION */}
      <section className="text-center max-w-3xl mx-auto px-4 space-y-6">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight">
          Ready to Start Your Learning Journey?
        </h2>
        <p className="text-zinc-600 dark:text-zinc-400 text-sm">
          Join thousands of students, volunteers, and alumni mentors building India’s best open educational platform.
        </p>
        <div className="pt-2">
          <Link href="/login">
            <Button size="lg" className="h-13 px-8 text-base bg-sky-600 hover:bg-sky-500 text-white rounded-2xl shadow-xl shadow-sky-500/20">
              Create Free Account / Sign In ➔
            </Button>
          </Link>
        </div>
      </section>

    </div>
  );
}
