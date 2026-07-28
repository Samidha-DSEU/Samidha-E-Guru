"use client";

import React from "react";
import Link from "next/link";
import { BookOpen, GraduationCap, Users, Sparkles, ArrowRight, ShieldCheck, Search, Award } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function LandingPage() {
  return (
    <div className="space-y-24 py-6">
      {/* Hero Section */}
      <section className="relative text-center py-16 px-4 space-y-8 max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-50 dark:bg-sky-950/50 border border-sky-200 dark:border-sky-800 text-sky-700 dark:text-sky-300 text-xs font-semibold tracking-wide uppercase">
          <Sparkles className="h-3.5 w-3.5 text-sky-500" />
          SAMIDHA Social Initiative
        </div>

        <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 leading-[1.15]">
          Free, Unlimited & Structured <br className="hidden sm:inline" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-600 via-sky-500 to-indigo-600">
            Education for Everyone
          </span>
        </h1>

        <p className="text-lg sm:text-xl text-zinc-600 dark:text-zinc-400 font-normal leading-relaxed max-w-2xl mx-auto">
          High-quality NCERT, DIKSHA, SWAYAM, and NPTEL study materials, alumni mentorship, and community guidance — 100% free forever.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          <Link href="/resources">
            <Button size="lg" className="shadow-lg shadow-sky-500/20">
              <Search className="h-4 w-4 mr-2" />
              Explore Study Materials
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>

          <Link href="/community">
            <Button variant="outline" size="lg">
              <Users className="h-4 w-4 mr-2" />
              Join Mentorship Community
            </Button>
          </Link>
        </div>

        {/* Platform Stat Counter */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-12 border-t border-zinc-200 dark:border-zinc-800 text-center">
          <div>
            <div className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">10,000+</div>
            <div className="text-xs text-zinc-500 font-medium mt-1">Study Resources</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">500+</div>
            <div className="text-xs text-zinc-500 font-medium mt-1">Volunteer Contributors</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">200+</div>
            <div className="text-xs text-zinc-500 font-medium mt-1">Alumni Mentors</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">100%</div>
            <div className="text-xs text-zinc-500 font-medium mt-1">Free & Open Access</div>
          </div>
        </div>
      </section>

      {/* Structured Hierarchy Feature Section */}
      <section className="space-y-12">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold tracking-tight">Organized Learning Hierarchy</h2>
          <p className="text-zinc-600 dark:text-zinc-400 text-sm">
            Find exactly what you need without getting overwhelmed by unverified web search results.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="space-y-4">
            <div className="h-10 w-10 rounded-xl bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold">
              1
            </div>
            <h3 className="text-lg font-semibold">Select Class & Subject</h3>
            <p className="text-sm text-zinc-500 leading-relaxed">
              Targeted curriculum from Class 6 to 12 (Science, Commerce, Arts) and Undergraduate degrees.
            </p>
          </Card>

          <Card className="space-y-4">
            <div className="h-10 w-10 rounded-xl bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold">
              2
            </div>
            <h3 className="text-lg font-semibold">Chapter-wise Materials</h3>
            <p className="text-sm text-zinc-500 leading-relaxed">
              Curated notes, PYQs, solutions, worksheets, and official video playlists for each specific chapter.
            </p>
          </Card>

          <Card className="space-y-4">
            <div className="h-10 w-10 rounded-xl bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold">
              3
            </div>
            <h3 className="text-lg font-semibold">Track Learning Progress</h3>
            <p className="text-sm text-zinc-500 leading-relaxed">
              Bookmark your favorite notes, complete practice questions, and monitor your personal study completion.
            </p>
          </Card>
        </div>
      </section>

      {/* Community Roles Section */}
      <section className="bg-zinc-100 dark:bg-zinc-900/50 rounded-3xl p-8 sm:p-12 border border-zinc-200 dark:border-zinc-800 space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">Built for Students, Volunteers & Alumni</h2>
            <p className="text-zinc-600 dark:text-zinc-400 text-sm">
              Connecting learners with dedicated mentors and verified contributors.
            </p>
          </div>
          <Link href="/login">
            <Button>Get Started Now</Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 space-y-3">
            <GraduationCap className="h-6 w-6 text-sky-600" />
            <h3 className="font-semibold text-base">Students & Learners</h3>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Browse study materials, save bookmarks, participate in Q&A discussions, and register for workshops.
            </p>
          </div>

          <div className="bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 space-y-3">
            <ShieldCheck className="h-6 w-6 text-emerald-600" />
            <h3 className="font-semibold text-base">SAMIDHA Volunteers</h3>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Upload notes and solutions, organize bootcamps, host educational events, and review student progress.
            </p>
          </div>

          <div className="bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 space-y-3">
            <Award className="h-6 w-6 text-indigo-600" />
            <h3 className="font-semibold text-base">Alumni Mentors</h3>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Provide career guidance, write educational articles, share industry experience, and mentor students.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
