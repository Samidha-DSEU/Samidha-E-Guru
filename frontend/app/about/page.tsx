"use client";

import React from "react";
import Link from "next/link";
import { 
  BookOpen, Heart, Users, ShieldCheck, Award, Sparkles, Target, Star, 
  ArrowRight, Compass, CheckCircle2, History, Lightbulb, Zap, Globe, Flame, ShieldAlert, GraduationCap
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function AboutPage() {
  return (
    <div className="relative overflow-hidden space-y-24 py-8 selection:bg-sky-500 selection:text-white">
      
      {/* 3D BACKGROUND GLOWING ORBS */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-10 left-1/4 w-96 h-96 bg-sky-500/15 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute top-32 right-1/4 w-96 h-96 bg-purple-500/15 rounded-full blur-[120px] animate-pulse delay-1000" />
      </div>

      {/* HERO BRANDING BANNER: FROM CHALKBOARDS TO CLOUD LEARNING */}
      <section className="text-center space-y-6 max-w-4xl mx-auto px-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 dark:bg-zinc-900/80 border border-zinc-200/80 dark:border-zinc-800 backdrop-blur-xl shadow-xl">
          <Flame className="h-4 w-4 text-amber-500 fill-amber-500/20" />
          <span className="text-xs font-bold tracking-wider uppercase bg-gradient-to-r from-amber-600 via-sky-600 to-indigo-600 bg-clip-text text-transparent">
            SAMIDHA Society • G.B. Pant Engineering College (DSEU Okhla-1 Campus)
          </span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 leading-[1.15]">
          From Chalkboards to <br />
          <span className="bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-600 bg-clip-text text-transparent">
            Cloud Learning
          </span>
        </h1>

        <div className="p-6 sm:p-8 rounded-3xl bg-white/70 dark:bg-zinc-900/70 border border-zinc-200/80 dark:border-zinc-800 backdrop-blur-xl shadow-2xl space-y-3 max-w-3xl mx-auto text-left sm:text-center">
          <p className="text-base sm:text-lg text-zinc-700 dark:text-zinc-300 italic font-medium leading-relaxed">
            “What began in 2013 as a small campus initiative to teach underprivileged students has now evolved into a digital learning ecosystem where every student can learn, contribute, and grow together.”
          </p>
          <div className="text-xs font-bold text-sky-600 dark:text-sky-400 uppercase tracking-widest pt-1">
            — Your Spark Enlightens Their Future
          </div>
        </div>
      </section>

      {/* 1. WHO WE ARE (FOUNDING STORY & DR. VISHNU VATS SIR) */}
      <section className="max-w-7xl mx-auto px-4 space-y-10">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400 text-xs font-bold uppercase tracking-widest border border-sky-500/20">
            <History className="h-3.5 w-3.5" /> Who We Are
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight">
            Founded on Pure Intent
          </h2>
          <p className="text-zinc-600 dark:text-zinc-400 text-sm">
            SAMIDHA means <span className="italic font-semibold text-zinc-800 dark:text-zinc-200">“an offering made with pure intent”</span>.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          
          {/* FOUNDING HISTORY CARD */}
          <div className="p-8 rounded-3xl bg-white/80 dark:bg-zinc-900/80 border border-zinc-200/80 dark:border-zinc-800 backdrop-blur-xl shadow-xl space-y-4">
            <div className="h-12 w-12 rounded-2xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold">
              <GraduationCap className="h-6 w-6" />
            </div>
            <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">The 2013 Origin</h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Founded in 2013 by three passionate engineering students — <strong className="text-zinc-900 dark:text-zinc-100">Vineet, Vipul, and Ankit</strong> — at G.B. Pant Engineering College. What started as an informal gathering of students teaching children in nearby communities grew into a structured educational society.
            </p>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Over the last decade, SAMIDHA has evolved into a vibrant student movement fostering academics, character building, cultural celebrations, and social responsibility.
            </p>
          </div>

          {/* DR. VISHNU VATS SIR FACULTY MENTOR CARD */}
          <div className="p-8 rounded-3xl bg-gradient-to-br from-purple-500/10 via-white/80 to-white dark:from-purple-950/40 dark:via-zinc-900/90 dark:to-zinc-900 border border-purple-200/80 dark:border-purple-800/60 shadow-xl space-y-4">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-purple-600 text-white flex items-center justify-center font-bold text-xl shadow-lg shadow-purple-500/30">
                VV
              </div>
              <div>
                <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Dr. Vishnu Vats</h3>
                <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
                  Faculty Head & Pillar of SAMIDHA
                </span>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Dr. Vishnu Vats Sir stands as one of the strongest pillars of SAMIDHA. Since inception, his unwavering mentorship, guidance, and vision have fostered seamless coordination among student volunteers and faculty.
            </p>
            <p className="text-xs text-zinc-500 leading-relaxed">
              His active encouragement has inspired generations of student volunteers to lead with confidence, organize impactful events, and serve society.
            </p>
          </div>

        </div>
      </section>

      {/* 2. OUR JOURNEY & EVOLUTION TIMELINE */}
      <section className="max-w-7xl mx-auto px-4 space-y-12">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-widest border border-emerald-500/20">
            <Compass className="h-3.5 w-3.5" /> Evolution Roadmap
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight">
            Our Journey Through Time
          </h2>
          <p className="text-zinc-600 dark:text-zinc-400 text-sm">
            How a campus teaching drive transformed into a digital learning ecosystem.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          
          <div className="p-6 rounded-2xl bg-white/70 dark:bg-zinc-900/70 border border-zinc-200/80 dark:border-zinc-800 backdrop-blur-xl shadow-lg space-y-3">
            <div className="text-xs font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wider">Phase 1 • 2013</div>
            <h4 className="font-bold text-base text-zinc-900 dark:text-zinc-100">Campus Inception</h4>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Founded by Vineet, Vipul & Ankit. Started offline evening classes for local underprivileged children.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white/70 dark:bg-zinc-900/70 border border-zinc-200/80 dark:border-zinc-800 backdrop-blur-xl shadow-lg space-y-3">
            <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Phase 2 • 2015-2022</div>
            <h4 className="font-bold text-base text-zinc-900 dark:text-zinc-100">2,500+ Students Impacted</h4>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Expanded offline teaching, Independence & Republic Day community drives, character building workshops.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white/70 dark:bg-zinc-900/70 border border-zinc-200/80 dark:border-zinc-800 backdrop-blur-xl shadow-lg space-y-3">
            <div className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">Phase 3 • 2023-2024</div>
            <h4 className="font-bold text-base text-zinc-900 dark:text-zinc-100">Mentorship Network</h4>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Connected student volunteers with graduating alumni for career roadmaps and competitive exam guidance.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-gradient-to-b from-sky-500/10 to-transparent border border-sky-300 dark:border-sky-700 shadow-xl space-y-3">
            <div className="text-xs font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wider">Phase 4 • Present</div>
            <h4 className="font-bold text-base text-zinc-900 dark:text-zinc-100">SAMIDHA E-GURU</h4>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Complete digital platform with NCERT library, rating system, alumni chat, and external scraper triggers.
            </p>
          </div>

        </div>
      </section>

      {/* 3. WHY E-GURU & 4. WHAT WE OFFER */}
      <section className="max-w-7xl mx-auto px-4 space-y-12">
        <div className="bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 border border-zinc-800 rounded-3xl p-8 sm:p-14 text-white shadow-2xl space-y-10 relative overflow-hidden">
          <div className="absolute right-0 bottom-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/20 text-sky-400 border border-sky-500/30 text-xs font-semibold uppercase tracking-wider">
              <Zap className="h-3.5 w-3.5" /> What We Offer
            </div>
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
              Why SAMIDHA E-GURU?
            </h2>
            <p className="text-zinc-400 text-sm">
              Moving beyond traditional physical classrooms to provide structured, peer-reviewed educational resources.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <div className="p-6 rounded-2xl bg-zinc-800/70 border border-zinc-700/60 backdrop-blur-md space-y-3">
              <BookOpen className="h-6 w-6 text-sky-400" />
              <h3 className="text-lg font-bold text-zinc-100">Digital Library & PYQs</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                NCERT textbooks, chapter notes, and 10+ years of previous board question papers organized by class & subject.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-zinc-800/70 border border-zinc-700/60 backdrop-blur-md space-y-3">
              <Star className="h-6 w-6 text-amber-400" />
              <h3 className="text-lg font-bold text-zinc-100">5-Star Peer Rating</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Community-driven rating system ensuring only verified, highest quality notes and study materials get recommended.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-zinc-800/70 border border-zinc-700/60 backdrop-blur-md space-y-3">
              <ShieldCheck className="h-6 w-6 text-emerald-400" />
              <h3 className="text-lg font-bold text-zinc-100">Uploader Credit & Certificates</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Volunteers receive verified certificates and credit on uploaded materials recognizing leadership & social impact.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* 5. OUR 5-C VISION PILLARS */}
      <section className="max-w-7xl mx-auto px-4 space-y-10">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 text-xs font-bold uppercase tracking-widest border border-purple-500/20">
            <Target className="h-3.5 w-3.5" /> Our Core Philosophy
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight">
            The 5-C Vision Pillars
          </h2>
          <p className="text-zinc-600 dark:text-zinc-400 text-sm">
            Guiding principles that shape every SAMIDHA initiative.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-center">
          <div className="p-5 rounded-2xl bg-white/80 dark:bg-zinc-900/80 border border-zinc-200/80 dark:border-zinc-800 backdrop-blur-xl shadow-lg space-y-2">
            <div className="text-2xl font-black text-sky-500">1</div>
            <div className="font-bold text-sm text-zinc-900 dark:text-zinc-100">Curiosity</div>
            <p className="text-[11px] text-zinc-500">Igniting the desire to learn</p>
          </div>

          <div className="p-5 rounded-2xl bg-white/80 dark:bg-zinc-900/80 border border-zinc-200/80 dark:border-zinc-800 backdrop-blur-xl shadow-lg space-y-2">
            <div className="text-2xl font-black text-indigo-500">2</div>
            <div className="font-bold text-sm text-zinc-900 dark:text-zinc-100">Competence</div>
            <p className="text-[11px] text-zinc-500">Building academic mastery</p>
          </div>

          <div className="p-5 rounded-2xl bg-white/80 dark:bg-zinc-900/80 border border-zinc-200/80 dark:border-zinc-800 backdrop-blur-xl shadow-lg space-y-2">
            <div className="text-2xl font-black text-emerald-500">3</div>
            <div className="font-bold text-sm text-zinc-900 dark:text-zinc-100">Communication</div>
            <p className="text-[11px] text-zinc-500">Expressing ideas with clarity</p>
          </div>

          <div className="p-5 rounded-2xl bg-white/80 dark:bg-zinc-900/80 border border-zinc-200/80 dark:border-zinc-800 backdrop-blur-xl shadow-lg space-y-2">
            <div className="text-2xl font-black text-rose-500">4</div>
            <div className="font-bold text-sm text-zinc-900 dark:text-zinc-100">Compassion</div>
            <p className="text-[11px] text-zinc-500">Empathy and joy of giving</p>
          </div>

          <div className="p-5 rounded-2xl bg-white/80 dark:bg-zinc-900/80 border border-zinc-200/80 dark:border-zinc-800 backdrop-blur-xl shadow-lg space-y-2 col-span-2 sm:col-span-1">
            <div className="text-2xl font-black text-amber-500">5</div>
            <div className="font-bold text-sm text-zinc-900 dark:text-zinc-100">Conviction</div>
            <p className="text-[11px] text-zinc-500">Confidence to overcome hurdles</p>
          </div>
        </div>
      </section>

      {/* 7. 12 CORE VALUES ("SAMIDHA IS ABOUT") */}
      <section className="max-w-7xl mx-auto px-4 space-y-10">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight">
            SAMIDHA is About...
          </h2>
          <p className="text-zinc-600 dark:text-zinc-400 text-sm">
            The 12 core cultural values preserved from our founding journey.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4 text-center">
          {[
            { title: "Commitments", bg: "bg-sky-500/10 text-sky-600 border-sky-200" },
            { title: "Contribution", bg: "bg-emerald-500/10 text-emerald-600 border-emerald-200" },
            { title: "Enjoyment", bg: "bg-amber-500/10 text-amber-600 border-amber-200" },
            { title: "Transformation", bg: "bg-purple-500/10 text-purple-600 border-purple-200" },
            { title: "Friendships", bg: "bg-indigo-500/10 text-indigo-600 border-indigo-200" },
            { title: "Love", bg: "bg-rose-500/10 text-rose-600 border-rose-200" },
            { title: "Hope", bg: "bg-teal-500/10 text-teal-600 border-teal-200" },
            { title: "Respect", bg: "bg-blue-500/10 text-blue-600 border-blue-200" },
            { title: "Celebrations", bg: "bg-orange-500/10 text-orange-600 border-orange-200" },
            { title: "Empowerment", bg: "bg-violet-500/10 text-violet-600 border-violet-200" },
            { title: "Confidence", bg: "bg-cyan-500/10 text-cyan-600 border-cyan-200" },
            { title: "Family", bg: "bg-pink-500/10 text-pink-600 border-pink-200" },
          ].map((item, idx) => (
            <div key={idx} className={`p-4 rounded-2xl border ${item.bg} backdrop-blur-md shadow-sm font-bold text-xs hover:scale-105 transition-transform`}>
              {item.title}
            </div>
          ))}
        </div>
      </section>

      {/* 8. JOIN THE MOVEMENT CTA */}
      <section className="text-center max-w-3xl mx-auto px-4 space-y-6">
        <div className="h-16 w-16 mx-auto rounded-3xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold shadow-xl">
          <Globe className="h-8 w-8" />
        </div>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight">
          Join the Movement Today
        </h2>
        <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed">
          Be a part of India’s student-driven learning movement. Whether you want to contribute notes, mentor junior students, or access zero-cost study materials — SAMIDHA welcomes you.
        </p>
        <div className="pt-2 flex flex-wrap items-center justify-center gap-4">
          <Link href="/login">
            <Button size="lg" className="h-13 px-8 text-base bg-gradient-to-r from-sky-600 to-indigo-600 text-white rounded-2xl shadow-xl shadow-sky-500/20 font-bold">
              Join SAMIDHA E-GURU ➔
            </Button>
          </Link>
        </div>
      </section>

    </div>
  );
}
