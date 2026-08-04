"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  BookOpen, GraduationCap, Users, Sparkles, ArrowRight, ShieldCheck, Search, Award, 
  Heart, Target, Compass, BookMarked, MessageSquare, Lightbulb, CheckCircle2, Globe, Star
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
    <div className="relative overflow-hidden space-y-16 sm:space-y-28 py-6 sm:py-10 selection:bg-sky-500 selection:text-white">
      
      {/* 3D BACKGROUND GLOWING ORBS & ANIMATED MESH GRADIENTS */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[650px] pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-10 left-1/4 w-72 sm:w-96 h-72 sm:h-96 bg-sky-500/20 dark:bg-sky-500/15 rounded-full blur-[100px] sm:blur-[120px] animate-pulse" />
        <div className="absolute top-32 right-1/4 w-72 sm:w-96 h-72 sm:h-96 bg-purple-500/20 dark:bg-purple-500/15 rounded-full blur-[100px] sm:blur-[120px] animate-pulse delay-1000" />
        <div className="absolute top-80 left-1/3 w-64 sm:w-80 h-64 sm:h-80 bg-emerald-500/15 dark:bg-emerald-500/10 rounded-full blur-[80px] sm:blur-[100px]" />
      </div>

      {/* HERO SECTION: SAMIDHA MISSION & VISION */}
      <section className="relative text-center space-y-6 sm:space-y-8 max-w-5xl mx-auto px-4">
        
        {/* Floating Mission Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl sm:rounded-full bg-white/80 dark:bg-zinc-900/80 border border-zinc-200/80 dark:border-zinc-800 backdrop-blur-xl shadow-xl shadow-sky-500/5 max-w-full text-left sm:text-center">
          <Heart className="h-4 w-4 text-rose-500 fill-rose-500/20 shrink-0 mt-0.5 sm:mt-0" />
          <span className="text-[10px] sm:text-xs font-bold tracking-wide uppercase bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent leading-tight">
            SAMIDHA Society • G.B. Pant Engineering College (DSEU Okhla-1 Campus)
          </span>
        </div>

        {/* Main Mission Title */}
        <h1 className="text-2xl sm:text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 leading-[1.2] sm:leading-[1.1] px-1">
          Empowering Every Student with <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-600 bg-clip-text text-transparent">
            Free, Quality Education & Mentorship
          </span>
        </h1>

        <p className="text-xs sm:text-base md:text-lg text-zinc-600 dark:text-zinc-400 font-normal leading-relaxed max-w-3xl mx-auto px-1">
          SAMIDHA is dedicated to bridging the educational divide by providing structured study resources, NCERT notes, question banks, and direct 1-on-1 mentorship from experienced alumni — 100% free for all students across India.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3.5 pt-2 w-full sm:w-auto">
          <Link href="/resources" className="w-full sm:w-auto">
            <Button size="lg" className="w-full sm:w-auto h-12 sm:h-13 px-6 sm:px-8 text-sm sm:text-base bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white shadow-xl shadow-sky-500/25 rounded-2xl transition-all">
              <BookMarked className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
              Explore Free Study Resources
              <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 ml-2" />
            </Button>
          </Link>

          <Link href="/community" className="w-full sm:w-auto">
            <Button variant="outline" size="lg" className="w-full sm:w-auto h-12 sm:h-13 px-6 sm:px-8 text-sm sm:text-base backdrop-blur-xl bg-white/60 dark:bg-zinc-900/60 border-zinc-300 dark:border-zinc-800 rounded-2xl transition-all">
              <Users className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-indigo-500" />
              Volunteer Mentorship Network
            </Button>
          </Link>
        </div>

        {/* 3D STATS BAR */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-10">
          <div className="p-6 rounded-3xl bg-white/70 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800/80 backdrop-blur-xl shadow-xl hover:-translate-y-1 transition-transform">
            <div className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-sky-500 to-indigo-600">10,000+</div>
            <div className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mt-1 uppercase tracking-wider">Free Study Materials</div>
          </div>

          <div className="p-6 rounded-3xl bg-white/70 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800/80 backdrop-blur-xl shadow-xl hover:-translate-y-1 transition-transform">
            <div className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-emerald-500 to-teal-600">500+</div>
            <div className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mt-1 uppercase tracking-wider">Volunteer Educators</div>
          </div>

          <div className="p-6 rounded-3xl bg-white/70 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800/80 backdrop-blur-xl shadow-xl hover:-translate-y-1 transition-transform">
            <div className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-purple-500 to-indigo-600">200+</div>
            <div className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mt-1 uppercase tracking-wider">Alumni Mentors</div>
          </div>

          <div className="p-6 rounded-3xl bg-white/70 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800/80 backdrop-blur-xl shadow-xl hover:-translate-y-1 transition-transform">
            <div className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-rose-500 to-amber-600">100%</div>
            <div className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mt-1 uppercase tracking-wider">Free & Equal Access</div>
          </div>
        </div>
      </section>

      {/* SECTION 1: OUR MISSION & CORE PILLARS */}
      <section className="max-w-7xl mx-auto px-4 space-y-12">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400 text-xs font-bold uppercase tracking-widest border border-sky-500/20">
            <Target className="h-3.5 w-3.5" /> Our Purpose
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight">
            The SAMIDHA Mission
          </h2>
          <p className="text-zinc-600 dark:text-zinc-400 text-sm">
            We believe quality education is a fundamental right, not a luxury. SAMIDHA stands on three core pillars of social impact.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* PILLAR 1 */}
          <div className="p-8 rounded-3xl bg-white/80 dark:bg-zinc-900/80 border border-zinc-200/80 dark:border-zinc-800 backdrop-blur-xl shadow-xl hover:shadow-2xl hover:-translate-y-2 transition-all space-y-4">
            <div className="h-14 w-14 rounded-2xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold">
              <BookOpen className="h-7 w-7" />
            </div>
            <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Structured Study Resources</h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Curated Class 6 to 12 & Undergraduate notes, official NCERT solutions, previous year question papers (PYQs), and chapter summaries neatly structured without cluttered ads.
            </p>
          </div>

          {/* PILLAR 2 */}
          <div className="p-8 rounded-3xl bg-white/80 dark:bg-zinc-900/80 border border-zinc-200/80 dark:border-zinc-800 backdrop-blur-xl shadow-xl hover:shadow-2xl hover:-translate-y-2 transition-all space-y-4">
            <div className="h-14 w-14 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
              <Award className="h-7 w-7" />
            </div>
            <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Volunteer-Alumni Pipeline</h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Direct mentorship pipeline for volunteers to connect with experienced alumni for 1-on-1 career guidance, industry trends, and professional mentoring.
            </p>
          </div>

          {/* PILLAR 3 */}
          <div className="p-8 rounded-3xl bg-white/80 dark:bg-zinc-900/80 border border-zinc-200/80 dark:border-zinc-800 backdrop-blur-xl shadow-xl hover:shadow-2xl hover:-translate-y-2 transition-all space-y-4">
            <div className="h-14 w-14 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <Heart className="h-7 w-7" />
            </div>
            <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Volunteer Community</h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Driven by volunteer teachers and college student mentors giving back to society by creating high-quality study materials and hosting free educational workshops.
            </p>
          </div>

        </div>
      </section>

      {/* SECTION 2: EDUCATIONAL RESOURCES SHOWCASE */}
      <section className="max-w-7xl mx-auto px-4 space-y-12">
        <div className="bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 border border-zinc-800 rounded-3xl p-8 sm:p-14 text-white shadow-2xl space-y-10 relative overflow-hidden">
          <div className="absolute right-0 top-0 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/20 text-sky-400 border border-sky-500/30 text-xs font-semibold uppercase tracking-wider">
                <BookMarked className="h-3.5 w-3.5" /> High Quality Content
              </div>
              <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
                Everything Students Need to Succeed
              </h2>
              <p className="text-zinc-400 text-sm">
                No subscription fees, no hidden paywalls. Access complete academic materials organized by class and subject.
              </p>
            </div>

            <Link href="/resources">
              <Button size="lg" className="bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-2xl shrink-0">
                Browse All Resources ➔
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <div className="p-6 rounded-2xl bg-zinc-800/70 border border-zinc-700/60 backdrop-blur-md space-y-3">
              <div className="h-10 w-10 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold">
                <Compass className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-zinc-100">NCERT & CBSE Textbooks</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Chapter-wise PDF downloads, verified notes, and textbook exercise solutions for Science, Maths, Social Sciences & Languages.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-zinc-800/70 border border-zinc-700/60 backdrop-blur-md space-y-3">
              <div className="h-10 w-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
                <Sparkles className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-zinc-100">Question Banks & PYQs</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                10+ years of previous board examination question papers with model answers to help students build exam confidence.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-zinc-800/70 border border-zinc-700/60 backdrop-blur-md space-y-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                <Lightbulb className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-zinc-100">Career & Higher Ed Guides</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Specialized industry guidance, engineering & medical entrance exam tips, and vocational training resources written by alumni.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* SECTION 3: VOLUNTEER & ALUMNI MENTORSHIP PIPELINE */}
      <section className="max-w-7xl mx-auto px-4 space-y-12">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 text-xs font-bold uppercase tracking-widest border border-purple-500/20">
            <Users className="h-3.5 w-3.5" /> Volunteer-Alumni Guidance
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight">
            Volunteer & Alumni Mentorship Network
          </h2>
          <p className="text-zinc-600 dark:text-zinc-400 text-sm">
            SAMIDHA empowers volunteer educators with direct 1-on-1 guidance, career insights, and market advice from experienced alumni mentors.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          <div className="p-8 rounded-3xl bg-gradient-to-br from-indigo-500/10 via-white/80 to-white dark:from-indigo-950/40 dark:via-zinc-900/90 dark:to-zinc-900 border border-indigo-200/80 dark:border-indigo-800/60 shadow-xl space-y-4">
            <div className="h-12 w-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold">
              <MessageSquare className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Volunteer Mentorship Requests</h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Volunteers can send targeted mentorship requests to verified alumni mentors specifying topics like Career Guidance, Industry Trends, or Exam Preparation.
            </p>
            <div className="pt-2">
              <Link href="/community">
                <Button size="sm" className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl">
                  Volunteer Mentorship Directory ➔
                </Button>
              </Link>
            </div>
          </div>

          <div className="p-8 rounded-3xl bg-gradient-to-br from-emerald-500/10 via-white/80 to-white dark:from-emerald-950/40 dark:via-zinc-900/90 dark:to-zinc-900 border border-emerald-200/80 dark:border-emerald-800/60 shadow-xl space-y-4">
            <div className="h-12 w-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold">
              <GraduationCap className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Interactive Educational Bootcamps</h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Join online workshops and mentorship webinars organized by volunteer educators to clear doubts and learn practical skills.
            </p>
            <div className="pt-2">
              <Link href="/events">
                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl">
                  View Upcoming Events ➔
                </Button>
              </Link>
            </div>
          </div>

        </div>
      </section>

      {/* FOOTER CALL TO ACTION */}
      <section className="text-center max-w-3xl mx-auto px-4 space-y-6">
        <div className="h-16 w-16 mx-auto rounded-3xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold shadow-xl">
          <Globe className="h-8 w-8" />
        </div>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight">
          Join the SAMIDHA Mission Today
        </h2>
        <p className="text-zinc-600 dark:text-zinc-400 text-sm">
          Whether you want to access free study materials, mentor younger students, or contribute notes — everyone is welcome.
        </p>
        <div className="pt-2">
          <Link href="/login">
            <Button size="lg" className="h-13 px-8 text-base bg-gradient-to-r from-sky-600 to-indigo-600 text-white rounded-2xl shadow-xl shadow-sky-500/20 font-bold">
              Get Started for Free ➔
            </Button>
          </Link>
        </div>
      </section>

    </div>
  );
}
