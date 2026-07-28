import React from "react";
import { BookOpen, Heart, Users, ShieldCheck, Award } from "lucide-react";
import { Card } from "@/components/ui/Card";

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-12 py-6">
      {/* Header Banner */}
      <div className="space-y-4 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          About SAMIDHA Social Initiative
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400 text-base max-w-2xl mx-auto leading-relaxed">
          Providing free, structured, and high-quality educational materials, mentorship, and opportunities to students, volunteers, and alumni across India.
        </p>
      </div>

      {/* Hero Image Section */}
      <div className="h-72 w-full rounded-2xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 overflow-hidden relative flex flex-col items-center justify-center text-center p-6">
        <img
          src="/images/about-hero.jpg"
          alt="SAMIDHA Social Initiative"
          className="w-full h-full object-cover absolute inset-0 opacity-80"
          onError={(e) => {
            // Hide image fallback if not uploaded yet
            (e.target as HTMLElement).style.display = 'none';
          }}
        />
        <div className="relative z-10 space-y-2 max-w-md bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md p-6 rounded-xl border border-zinc-200 dark:border-zinc-800">
          <BookOpen className="h-8 w-8 text-sky-600 mx-auto" />
          <h2 className="font-bold text-lg text-zinc-900 dark:text-zinc-100">Free Education for All</h2>
          <p className="text-xs text-zinc-500">Drop your about section photos in <code className="bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded text-sky-600">frontend/public/images/about-hero.jpg</code></p>
        </div>
      </div>

      {/* Core Values Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="space-y-3">
          <Heart className="h-6 w-6 text-rose-500" />
          <h3 className="font-semibold text-base">Our Core Mission</h3>
          <p className="text-xs text-zinc-500 leading-relaxed">
            Eliminating educational inequality by offering zero-cost, verified academic study materials, chapter notes, previous year question papers, and alumni mentorship.
          </p>
        </Card>

        <Card className="space-y-3">
          <ShieldCheck className="h-6 w-6 text-emerald-500" />
          <h3 className="font-semibold text-base">Zero Commercialization</h3>
          <p className="text-xs text-zinc-500 leading-relaxed">
            SAMIDHA E-GURU operates purely as a social initiative. There are no paywalls, hidden subscriptions, or commercial advertisements.
          </p>
        </Card>
      </div>
    </div>
  );
}
