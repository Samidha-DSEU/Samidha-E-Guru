"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  BookOpen, Heart, Users, ShieldCheck, Award, Sparkles, Target, Star, 
  ArrowRight, Compass, CheckCircle2, History, Lightbulb, Zap, Globe, Flame, 
  GraduationCap, Image as ImageIcon, X, ChevronLeft, ChevronRight, UserCheck, Crown
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { CursorDotsCanvas } from "@/components/ui/CursorDotsCanvas";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { AnimatedText } from "@/components/ui/AnimatedText";
import { TiltCard } from "@/components/ui/TiltCard";
import { TypewriterText } from "@/components/ui/TypewriterText";

// GALLERY IMAGES LIST FROM SAMIDHA-WEB REPO
const galleryImages = [
  { id: 1, src: "/images/gallery/art1.jpg", caption: "SAMIDHA Community Teaching Drive" },
  { id: 2, src: "/images/gallery/art2.jpg", caption: "Interactive Learning Session with Students" },
  { id: 3, src: "/images/gallery/art3.jpg", caption: "Volunteer Educators Mentorship Drive" },
  { id: 4, src: "/images/gallery/art4.jpg", caption: "Student Classroom Discussions" },
  { id: 5, src: "/images/gallery/art5.jpg", caption: "Academic Guidance Session" },
  { id: 6, src: "/images/gallery/art6.jpg", caption: "SAMIDHA Special Celebrations" },
  { id: 7, src: "/images/gallery/art7.jpg", caption: "Community Awareness Campaign" },
  { id: 8, src: "/images/gallery/art8.jpg", caption: "Outdoor Educational Bootcamp" },
  { id: 9, src: "/images/gallery/art9.jpg", caption: "Student Creativity & Art Workshop" },
  { id: 10, src: "/images/gallery/art10.jpg", caption: "Volunteer Recognition Gathering" },
  { id: 11, src: "/images/gallery/art11.jpg", caption: "SAMIDHA Society General Body Meet" },
  { id: 12, src: "/images/gallery/art12.jpg", caption: "Hands-on Practical Chemistry & Science Lab" },
  { id: 13, src: "/images/gallery/art13.jpg", caption: "Youth Empowerment Initiative" },
  { id: 14, src: "/images/gallery/art14.jpg", caption: "DSEU Campus Study Circle" },
  { id: 15, src: "/images/gallery/art15.jpg", caption: "Annual Educational Fest" },
  { id: 16, src: "/images/gallery/art16.jpg", caption: "Interactive Problem Solving" },
  { id: 17, src: "/images/gallery/art17.jpg", caption: "SAMIDHA Cultural Drive" },
  { id: 18, src: "/images/gallery/art18.jpg", caption: "Student Motivational Seminar" },
  { id: 19, src: "/images/gallery/art19.jpg", caption: "Community Outreach Group" },
  { id: 20, src: "/images/gallery/art20.jpg", caption: "SAMIDHA Learning Hub Family" }
];

// CREDITS LIST FOR TOP CONTRIBUTORS
const creditsList = [
  {
    name: "FEYAZ",
    role: "Operational and Volunteer Head",
    branch: "CSE 4th Year",
    rank: 1,
    badge: "👑 Lead Operational Head",
    color: "from-amber-500/20 via-sky-500/10 to-indigo-500/20 border-amber-500/40 text-amber-500"
  },
  {
    name: "HIMANSHU BANSAL",
    role: "Operational and Volunteer Head",
    branch: "CSE 4th Year",
    rank: 2,
    badge: "👑 Lead Technical & Operational Head",
    color: "from-sky-500/20 via-indigo-500/10 to-purple-500/20 border-sky-500/40 text-sky-500"
  },
  {
    name: "ADARSH",
    role: "Senior Volunteer",
    branch: "CSE 4th Year",
    rank: 3,
    badge: "⭐ Senior Core Contributor",
    color: "from-purple-500/20 via-pink-500/10 to-rose-500/20 border-purple-500/40 text-purple-500"
  },
  {
    name: "RAHUL ARYAN",
    role: "Volunteer",
    branch: "CSE 2nd Year",
    rank: 4,
    badge: "🚀 Active Educator Volunteer",
    color: "from-emerald-500/20 via-teal-500/10 to-cyan-500/20 border-emerald-500/40 text-emerald-500"
  },
  {
    name: "AMAN KUSHWAHA",
    role: "Volunteer",
    branch: "CSE 2nd Year",
    rank: 5,
    badge: "🚀 Active Educator Volunteer",
    color: "from-indigo-500/20 via-blue-500/10 to-sky-500/20 border-indigo-500/40 text-indigo-500"
  }
];

export default function AboutPage() {
  const [activeImage, setActiveImage] = useState<typeof galleryImages[0] | null>(null);
  const [showAllGallery, setShowAllGallery] = useState(false);

  const displayedImages = showAllGallery ? galleryImages : galleryImages.slice(0, 8);

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

      {/* 🌟 CREDITS & LEADERSHIP SECTION (TOP CONTRIBUTORS) */}
      <section className="max-w-7xl mx-auto px-4 space-y-10">
        <ScrollReveal direction="up" delay={0}>
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-extrabold uppercase tracking-widest border border-amber-500/30">
              <Crown className="h-4 w-4 text-amber-500 fill-amber-500/30" /> Platform Credits & Leadership
            </div>
            <AnimatedText
              text="Meet the Core Builders"
              gradientWords={["Core", "Builders"]}
              className="text-3xl sm:text-4xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight"
            />
            <p className="text-zinc-600 dark:text-zinc-400 text-sm">
              Honoring the dedicated leaders and student-volunteers who build and lead the SAMIDHA E-GURU platform.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {creditsList.map((member, idx) => (
            <ScrollReveal key={idx} direction="up" delay={idx * 100}>
              <TiltCard className="h-full">
                <div className={`p-6 rounded-3xl bg-gradient-to-br ${member.color} bg-white/80 dark:bg-zinc-900/90 border backdrop-blur-xl shadow-xl space-y-4 h-full flex flex-col justify-between transition-transform hover:scale-[1.02]`}>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-3 py-1 bg-white/90 dark:bg-zinc-950/80 rounded-full text-[10px] font-extrabold tracking-wider border border-zinc-200 dark:border-zinc-800 uppercase shadow-sm">
                        {member.badge}
                      </span>
                      <span className="text-xs font-black text-zinc-400">#{member.rank}</span>
                    </div>

                    <div>
                      <h3 className="text-xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight">
                        {member.name}
                      </h3>
                      <p className="text-xs font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wide mt-0.5">
                        {member.role}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-zinc-200/50 dark:border-zinc-800/50 flex items-center justify-between text-xs text-zinc-600 dark:text-zinc-400 font-semibold">
                      <span className="flex items-center gap-1.5">
                        <GraduationCap className="h-4 w-4 text-purple-500" />
                        Department & Year
                      </span>
                      <span className="px-2.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 rounded-lg font-bold text-[11px]">
                        {member.branch}
                      </span>
                    </div>
                  </div>

                  <div className="pt-3 text-[11px] text-zinc-500 font-medium italic">
                    G.B. Pant Engineering College (DSEU Okhla-1)
                  </div>
                </div>
              </TiltCard>
            </ScrollReveal>
          ))}
        </div>
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
                  <img 
                    src="/images/gallery/v_sir.png" 
                    alt="Dr. Vishnu Vats" 
                    className="h-16 w-16 rounded-2xl object-cover border-2 border-purple-500/40 shadow-lg shadow-purple-500/20 shrink-0" 
                  />
                  <div>
                    <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Dr. Vishnu Vats</h3>
                    <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
                      Faculty Head of Chemistry & Pillar of SAMIDHA
                    </span>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Dr. Vishnu Vats Sir stands as one of the strongest pillars of SAMIDHA. Since inception, his unwavering mentorship, guidance, and vision have fostered seamless coordination among student volunteers and faculty.
                </p>
                <p className="text-xs text-zinc-500 leading-relaxed italic border-l-2 border-purple-500 pl-3 py-1 bg-purple-50/50 dark:bg-purple-950/30 rounded-r-xl">
                  “Privileged and grateful to have him as our mentor and source of strength.”
                </p>
              </div>
            </TiltCard>
          </ScrollReveal>

        </div>
      </section>

      {/* 🖼️ SAMIDHA ACTIVITY PHOTO GALLERY */}
      <section className="max-w-7xl mx-auto px-4 space-y-10">
        <ScrollReveal direction="up" delay={0}>
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-extrabold uppercase tracking-widest border border-emerald-500/30">
              <ImageIcon className="h-4 w-4 text-emerald-500" /> SAMIDHA Photo Gallery
            </div>
            <AnimatedText
              text="Moments of Hope & Learning"
              gradientWords={["Hope", "Learning"]}
              className="text-3xl sm:text-4xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight"
            />
            <p className="text-zinc-600 dark:text-zinc-400 text-sm">
              Explore real moments from our student teaching drives, bootcamps, and community events.
            </p>
          </div>
        </ScrollReveal>

        {/* IMAGE MASONRY GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {displayedImages.map((img) => (
            <ScrollReveal key={img.id} direction="up" delay={img.id * 50}>
              <div 
                onClick={() => setActiveImage(img)}
                className="group relative h-64 rounded-3xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-900 cursor-pointer shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]"
              >
                <img 
                  src={img.src} 
                  alt={img.caption}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110 opacity-90 group-hover:opacity-100"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-4 flex flex-col justify-end">
                  <p className="text-xs font-bold text-white tracking-wide">{img.caption}</p>
                  <span className="text-[10px] text-sky-400 font-semibold flex items-center gap-1 mt-1">
                    <Sparkles className="h-3 w-3" /> Click to enlarge
                  </span>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>

        {/* TOGGLE FULL GALLERY BUTTON */}
        <div className="text-center pt-4">
          <Button 
            variant="outline" 
            size="lg" 
            onClick={() => setShowAllGallery(!showAllGallery)}
            className="rounded-2xl font-extrabold text-xs px-8 border-sky-500/40 text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/40"
          >
            {showAllGallery ? "Show Less" : `View Full Gallery (${galleryImages.length} Photos)`}
          </Button>
        </div>
      </section>

      {/* 2. OUR JOURNEY & EVOLUTION TIMELINE */}
      <section className="max-w-7xl mx-auto px-4 space-y-12">
        <ScrollReveal direction="up" delay={0}>
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-widest border border-indigo-500/20">
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

      {/* LIGHTBOX MODAL FOR GALLERY IMAGES */}
      {activeImage && (
        <div 
          className="fixed inset-0 z-[99999] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setActiveImage(null)}
        >
          <div 
            className="relative max-w-4xl w-full bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => setActiveImage(null)}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/60 text-white hover:bg-black transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
            
            <img 
              src={activeImage.src} 
              alt={activeImage.caption} 
              className="w-full max-h-[75vh] object-contain bg-black"
            />
            
            <div className="p-4 bg-zinc-950 border-t border-zinc-800 text-center">
              <p className="text-sm font-bold text-zinc-100">{activeImage.caption}</p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
