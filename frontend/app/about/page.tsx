"use client";

import React from "react";
import Link from "next/link";
import { 
  BookOpen, Heart, Users, ShieldCheck, Award, Sparkles, Target, Star, 
  ArrowRight, Compass, CheckCircle2, History, Lightbulb, Zap, Globe, Flame, ShieldAlert, GraduationCap
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { CursorDotsCanvas } from "@/components/ui/CursorDotsCanvas";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { AnimatedText } from "@/components/ui/AnimatedText";
import { TiltCard } from "@/components/ui/TiltCard";
import { TypewriterText } from "@/components/ui/TypewriterText";

export default function AboutPage() {
  return (
    <div className="relative overflow-hidden space-y-20 sm:space-y-32 py-8 selection:bg-sky-500 selection:text-white">
      
      {/* INTERACTIVE CURSOR DOTS CANVAS */}
      <CursorDotsCanvas />

      {/* 3D BACKGROUND GLOWING ORBS */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-10 left-1/4 w-96 h-96 bg-sky-500/15 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute top-32 right-1/4 w-96 h-96 bg-purple-500/15 rounded-full blur-[120px] animate-pulse delay-1000" />
      </div>

      {/* HERO BRANDING BANNER: FROM CHALKBOARDS TO CLOUD LEARNING */}
      <section className="text-center space-y-6 max-w-4xl mx-auto px-4">
        <ScrollReveal direction="zoom" delay={0}>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 dark:bg-zinc-900/80 border border-zinc-200/80 dark:border-zinc-800 backdrop-blur-xl shadow-xl transition-transform hover:scale-105">
            <Flame className="h-4 w-4 text-amber-500 fill-amber-500/20" />
            <span className="text-xs font-bold tracking-wider uppercase bg-gradient-to-r from-amber-600 via-sky-600 to-indigo-600 bg-clip-text text-transparent">
              SAMIDHA Society • G.B. Pant Engineering College (DSEU Okhla-1 Campus)
            </span>
          </div>
        </ScrollReveal>

        <AnimatedText
          text="From Chalkboards to Cloud Learning"
          gradientWords={["Cloud", "Learning"]}
          className="text-4xl sm:text-6xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 leading-[1.15]"
        />

        <ScrollReveal direction="up" delay={200}>
          <TiltCard maxTilt={5} className="max-w-3xl mx-auto">
            <div className="p-6 sm:p-8 rounded-3xl bg-white/70 dark:bg-zinc-900/70 border border-zinc-200/80 dark:border-zinc-800 backdrop-blur-xl shadow-2xl space-y-3 text-left sm:text-center">
              <TypewriterText
                text="“What began in 2013 as a small campus initiative to teach underprivileged students has now evolved into a digital learning ecosystem where every student can learn, contribute, and grow together.”"
                highlightWords={["2013", "digital", "ecosystem", "together"]}
                speedMs={15}
                className="text-base sm:text-lg text-zinc-700 dark:text-zinc-300 italic font-medium leading-relaxed min-h-[4rem]"
              />
              <div className="text-xs font-bold text-sky-600 dark:text-sky-400 uppercase tracking-widest pt-2">
                — Your Spark Enlightens Their Future
              </div>
            </div>
          </TiltCard>
        </ScrollReveal>
      </section>

      {/* 1. WHO WE ARE (FOUNDING STORY & DR. VISHNU VATS SIR) */}
      <section className="max-w-7xl mx-auto px-4 space-y-10">
        <ScrollReveal direction="up" delay={0}>
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400 text-xs font-bold uppercase tracking-widest border border-sky-500/20">
              <History className="h-3.5 w-3.5" /> Who We Are
            </div>
            <AnimatedText
              text="Founded on Pure Intent"
              gradientWords={["Pure", "Intent"]}
              className="text-3xl sm:text-4xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight"
            />
            <p className="text-zinc-600 dark:text-zinc-400 text-sm">
              SAMIDHA means <span className="italic font-semibold text-zinc-800 dark:text-zinc-200">“an offering made with pure intent”</span>.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          
          {/* FOUNDING HISTORY CARD */}
          <ScrollReveal direction="left" delay={150}>
            <TiltCard className="h-full">
              <div className="p-8 rounded-3xl bg-white/80 dark:bg-zinc-900/80 border border-zinc-200/80 dark:border-zinc-800 backdrop-blur-xl shadow-xl space-y-4 h-full">
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
            </TiltCard>
          </ScrollReveal>

          {/* DR. VISHNU VATS SIR FACULTY MENTOR CARD */}
          <ScrollReveal direction="right" delay={300}>
            <TiltCard className="h-full">
              <div className="p-8 rounded-3xl bg-gradient-to-br from-purple-500/10 via-white/80 to-white dark:from-purple-950/40 dark:via-zinc-900/90 dark:to-zinc-900 border border-purple-200/80 dark:border-purple-800/60 shadow-xl space-y-4 h-full">
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
            </TiltCard>
          </ScrollReveal>

        </div>
      </section>

      {/* 2. OUR JOURNEY & EVOLUTION TIMELINE */}
      <section className="max-w-7xl mx-auto px-4 space-y-12">
        <ScrollReveal direction="up" delay={0}>
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-widest border border-emerald-500/20">
              <Compass className="h-3.5 w-3.5" /> Evolution Roadmap
            </div>
            <AnimatedText
              text="Our Journey Through Time"
              gradientWords={["Journey", "Through", "Time"]}
              className="text-3xl sm:text-4xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight"
            />
            <p className="text-zinc-600 dark:text-zinc-400 text-sm">
              How a campus teaching drive transformed into a digital learning ecosystem.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          
          <ScrollReveal direction="up" delay={100}>
            <TiltCard className="h-full">
              <div className="p-6 rounded-2xl bg-white/70 dark:bg-zinc-900/70 border border-zinc-200/80 dark:border-zinc-800 backdrop-blur-xl shadow-lg space-y-3 h-full">
                <div className="text-xs font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wider">Phase 1 • 2013</div>
                <h4 className="font-bold text-base text-zinc-900 dark:text-zinc-100">Campus Inception</h4>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Founded by Vineet, Vipul & Ankit. Started offline evening classes for local underprivileged children.
                </p>
              </div>
            </TiltCard>
          </ScrollReveal>

          <ScrollReveal direction="up" delay={200}>
            <TiltCard className="h-full">
              <div className="p-6 rounded-2xl bg-white/70 dark:bg-zinc-900/70 border border-zinc-200/80 dark:border-zinc-800 backdrop-blur-xl shadow-lg space-y-3 h-full">
                <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Phase 2 • 2015-2022</div>
                <h4 className="font-bold text-base text-zinc-900 dark:text-zinc-100">2,500+ Students Impacted</h4>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Expanded offline teaching, Independence & Republic Day community drives, character building workshops.
                </p>
              </div>
            </TiltCard>
          </ScrollReveal>

          <ScrollReveal direction="up" delay={300}>
            <TiltCard className="h-full">
              <div className="p-6 rounded-2xl bg-white/70 dark:bg-zinc-900/70 border border-zinc-200/80 dark:border-zinc-800 backdrop-blur-xl shadow-lg space-y-3 h-full">
                <div className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">Phase 3 • 2023-2024</div>
                <h4 className="font-bold text-base text-zinc-900 dark:text-zinc-100">Mentorship Network</h4>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Connected student volunteers with graduating alumni for career roadmaps and competitive exam guidance.
                </p>
              </div>
            </TiltCard>
          </ScrollReveal>

          <ScrollReveal direction="up" delay={400}>
            <TiltCard className="h-full">
              <div className="p-6 rounded-2xl bg-gradient-to-b from-sky-500/10 to-transparent border border-sky-300 dark:border-sky-700 shadow-xl space-y-3 h-full">
                <div className="text-xs font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wider">Phase 4 • Present</div>
                <h4 className="font-bold text-base text-zinc-900 dark:text-zinc-100">SAMIDHA E-GURU</h4>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Complete digital platform with NCERT library, rating system, alumni chat, and external scraper triggers.
                </p>
              </div>
            </TiltCard>
          </ScrollReveal>

        </div>
      </section>

      {/* 3. WHY E-GURU & 4. WHAT WE OFFER */}
      <section className="max-w-7xl mx-auto px-4 space-y-12">
        <ScrollReveal direction="up" delay={0}>
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
              
              <ScrollReveal direction="up" delay={150}>
                <TiltCard className="h-full">
                  <div className="p-6 rounded-2xl bg-zinc-800/70 border border-zinc-700/60 backdrop-blur-md space-y-3 h-full">
                    <BookOpen className="h-6 w-6 text-sky-400" />
                    <h3 className="text-lg font-bold text-zinc-100">Digital Library & PYQs</h3>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      NCERT textbooks, chapter notes, and 10+ years of previous board question papers organized by class & subject.
                    </p>
                  </div>
                </TiltCard>
              </ScrollReveal>

              <ScrollReveal direction="up" delay={300}>
                <TiltCard className="h-full">
                  <div className="p-6 rounded-2xl bg-zinc-800/70 border border-zinc-700/60 backdrop-blur-md space-y-3 h-full">
                    <Star className="h-6 w-6 text-amber-400" />
                    <h3 className="text-lg font-bold text-zinc-100">5-Star Peer Rating</h3>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Community-driven rating system ensuring only verified, highest quality notes and study materials get recommended.
                    </p>
                  </div>
                </TiltCard>
              </ScrollReveal>

              <ScrollReveal direction="up" delay={450}>
                <TiltCard className="h-full">
                  <div className="p-6 rounded-2xl bg-zinc-800/70 border border-zinc-700/60 backdrop-blur-md space-y-3 h-full">
                    <ShieldCheck className="h-6 w-6 text-emerald-400" />
                    <h3 className="text-lg font-bold text-zinc-100">Uploader Credit & Certificates</h3>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Volunteers receive verified certificates and credit on uploaded materials recognizing leadership & social impact.
                    </p>
                  </div>
                </TiltCard>
              </ScrollReveal>

            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* 5. OUR 5-C VISION PILLARS */}
      <section className="max-w-7xl mx-auto px-4 space-y-10">
        <ScrollReveal direction="up" delay={0}>
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 text-xs font-bold uppercase tracking-widest border border-purple-500/20">
              <Target className="h-3.5 w-3.5" /> Our Core Philosophy
            </div>
            <AnimatedText
              text="The 5-C Vision Pillars"
              gradientWords={["5-C", "Vision"]}
              className="text-3xl sm:text-4xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight"
            />
            <p className="text-zinc-600 dark:text-zinc-400 text-sm">
              Guiding principles that shape every SAMIDHA initiative.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-center">
          {[
            { num: "1", title: "Curiosity", desc: "Igniting the desire to learn", color: "text-sky-500" },
            { num: "2", title: "Competence", desc: "Building academic mastery", color: "text-indigo-500" },
            { num: "3", title: "Communication", desc: "Expressing ideas with clarity", color: "text-emerald-500" },
            { num: "4", title: "Compassion", desc: "Empathy and joy of giving", color: "text-rose-500" },
            { num: "5", title: "Conviction", desc: "Confidence to overcome hurdles", color: "text-amber-500" },
          ].map((item, idx) => (
            <ScrollReveal key={idx} direction="up" delay={idx * 100}>
              <TiltCard className="h-full">
                <div className="p-5 rounded-2xl bg-white/80 dark:bg-zinc-900/80 border border-zinc-200/80 dark:border-zinc-800 backdrop-blur-xl shadow-lg space-y-2 h-full">
                  <div className={`text-2xl font-black ${item.color}`}>{item.num}</div>
                  <div className="font-bold text-sm text-zinc-900 dark:text-zinc-100">{item.title}</div>
                  <p className="text-[11px] text-zinc-500">{item.desc}</p>
                </div>
              </TiltCard>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* 7. 12 CORE VALUES ("SAMIDHA IS ABOUT") */}
      <section className="max-w-7xl mx-auto px-4 space-y-10">
        <ScrollReveal direction="up" delay={0}>
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <AnimatedText
              text="SAMIDHA is About..."
              gradientWords={["SAMIDHA", "About..."]}
              className="text-3xl sm:text-4xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight"
            />
            <p className="text-zinc-600 dark:text-zinc-400 text-sm">
              The 12 core cultural values preserved from our founding journey.
            </p>
          </div>
        </ScrollReveal>

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
            <ScrollReveal key={idx} direction="up" delay={idx * 50}>
              <TiltCard>
                <div className={`p-4 rounded-2xl border ${item.bg} backdrop-blur-md shadow-sm font-bold text-xs hover:scale-105 transition-transform`}>
                  {item.title}
                </div>
              </TiltCard>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* 8. JOIN THE MOVEMENT CTA */}
      <ScrollReveal direction="zoom" delay={0}>
        <section className="max-w-5xl mx-auto px-4">
          <TiltCard maxTilt={5}>
            <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-sky-500/10 via-purple-500/10 to-indigo-500/10 dark:from-sky-950/50 dark:via-purple-950/40 dark:to-indigo-950/50 border border-sky-500/30 dark:border-sky-500/40 p-8 sm:p-14 text-center space-y-6 backdrop-blur-2xl shadow-2xl">
              <div className="relative inline-flex items-center justify-center">
                <span className="absolute inset-0 rounded-3xl bg-sky-500/30 blur-xl animate-ping" />
                <div className="relative h-16 w-16 rounded-3xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white flex items-center justify-center shadow-xl shadow-sky-500/30">
                  <Globe className="h-8 w-8 animate-spin-slow" />
                </div>
              </div>

              <AnimatedText
                text="Join the Movement Today"
                gradientWords={["Movement", "Today"]}
                className="text-3xl sm:text-4xl font-extrabold text-zinc-900 dark:text-zinc-50"
              />

              <p className="text-xs sm:text-base text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed">
                Be a part of India’s student-driven learning movement. Whether you want to contribute notes, mentor junior students, or access zero-cost study materials — SAMIDHA welcomes you.
              </p>

              <div className="pt-4 flex justify-center">
                <Link href="/login">
                  <Button size="lg" className="h-14 px-10 text-base sm:text-lg bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-600 hover:from-sky-400 hover:to-purple-500 text-white font-extrabold rounded-2xl shadow-2xl shadow-sky-500/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 group">
                    <Sparkles className="h-5 w-5 text-amber-300 group-hover:rotate-12 transition-transform" />
                    Join SAMIDHA E-GURU
                    <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </div>
            </div>
          </TiltCard>
        </section>
      </ScrollReveal>

    </div>
  );
}
