"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { getUserSlug } from "@/lib/userUtils";
import { BookOpen, Bookmark, CheckCircle, Bell, Award, Sparkles, Mail, UserCheck } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/features/auth/context/AuthContext";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import axios from "axios";
import { AnimatedText } from "@/components/ui/AnimatedText";
import { TiltCard } from "@/components/ui/TiltCard";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const [requested, setRequested] = useState<string | null>(null);
  const [featuredMentors, setFeaturedMentors] = useState<any[]>([]);

  useEffect(() => {
    const fetchMentors = async () => {
      try {
        const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/community/featured-mentors`);
        if (res.data?.data) {
          setFeaturedMentors(res.data.data);
        }
      } catch (err) {
        console.error("Failed to fetch featured mentors", err);
      }
    };
    fetchMentors();
  }, []);

  useEffect(() => {
    if (user) {
      const roleName = user.role?.name?.toLowerCase();
      if (roleName === "admin" || roleName === "super_admin") {
        router.replace("/admin");
        return;
      }
      if (roleName === "volunteer") {
        const slug = getUserSlug(user);
        router.replace(`/volunteer/${slug}`);
        return;
      }
      if (roleName === "alumni") {
        const slug = getUserSlug(user);
        router.replace(`/alumni/${slug}`);
        return;
      }
      if (!params || !params.username) {
        const slug = getUserSlug(user);
        router.replace(`/dashboard/${slug}`);
      }
    }
  }, [user, params, router]);

  const handleRequestMentorship = (name: string) => {
    setRequested(name);
    setTimeout(() => setRequested(null), 3000);
  };

  return (
    <ProtectedRoute allowedRoles={["student"]}>
      <div className="space-y-8">
        
        {/* Overview Banner */}
        <ScrollReveal direction="zoom" delay={0}>
          <div className="bg-gradient-to-r from-sky-600 via-sky-500 to-indigo-600 rounded-3xl p-8 text-white space-y-3 shadow-xl shadow-sky-500/10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="h-3.5 w-3.5" /> Student Dashboard
            </div>
            <AnimatedText
              text={`Welcome back, ${user?.profile?.full_name?.split(' ')[0] || "Student"}!`}
              className="text-3xl font-bold justify-start"
            />
            <p className="text-sky-100 text-sm max-w-xl">
              Track your learning progress, review bookmarked study resources, and connect directly with SAMIDHA volunteer teachers & alumni mentors.
            </p>
          </div>
        </ScrollReveal>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <ScrollReveal direction="up" delay={100}>
            <TiltCard className="h-full">
              <Card className="space-y-2 h-full">
                <div className="flex items-center justify-between text-zinc-500">
                  <span className="text-xs font-semibold uppercase tracking-wider">Bookmarks</span>
                  <Bookmark className="h-4 w-4 text-sky-600" />
                </div>
                <AnimatedNumber value="0" className="text-3xl font-bold" />
                <p className="text-xs text-zinc-400">Saved resources</p>
              </Card>
            </TiltCard>
          </ScrollReveal>

          <ScrollReveal direction="up" delay={200}>
            <TiltCard className="h-full">
              <Card className="space-y-2 h-full">
                <div className="flex items-center justify-between text-zinc-500">
                  <span className="text-xs font-semibold uppercase tracking-wider">Chapter Progress</span>
                  <CheckCircle className="h-4 w-4 text-emerald-600" />
                </div>
                <AnimatedNumber value="0%" className="text-3xl font-bold" />
                <p className="text-xs text-zinc-400">Average completion</p>
              </Card>
            </TiltCard>
          </ScrollReveal>

          <ScrollReveal direction="up" delay={300}>
            <TiltCard className="h-full">
              <Card className="space-y-2 h-full">
                <div className="flex items-center justify-between text-zinc-500">
                  <span className="text-xs font-semibold uppercase tracking-wider">Registered Events</span>
                  <Award className="h-4 w-4 text-indigo-600" />
                </div>
                <AnimatedNumber value="0" className="text-3xl font-bold" />
                <p className="text-xs text-zinc-400">Upcoming workshops</p>
              </Card>
            </TiltCard>
          </ScrollReveal>
        </div>

        {/* GET MENTOR SECTION */}
        <ScrollReveal direction="up" delay={400}>
          <Card className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-4">
              <div>
                <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                  <UserCheck className="h-5 w-5 text-sky-500" /> Recommended SAMIDHA Mentors
                </h2>
                <p className="text-xs text-zinc-500">Directly connect with SAMIDHA volunteer teachers and senior alumni mentors for academic guidance.</p>
              </div>
            </div>

            {requested && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-medium rounded-xl">
                Mentorship request sent to <strong>{requested}</strong>! They will contact you via email shortly.
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {featuredMentors.length > 0 ? (
                featuredMentors.map((mentor) => (
                  <div key={mentor.id} className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 flex flex-col md:flex-row items-center gap-4">
                    <img
                      src={mentor.avatar_url || "https://api.dicebear.com/7.x/avataaars/svg?seed=" + mentor.id}
                      alt={mentor.full_name}
                      className="h-16 w-16 rounded-full object-cover border-2 border-sky-100 dark:border-sky-900"
                    />
                    <div className="flex-1 text-center md:text-left">
                      <h4 className="font-bold text-zinc-900 dark:text-zinc-100">{mentor.full_name}</h4>
                      <p className="text-xs font-medium text-sky-600 dark:text-sky-400">{mentor.assigned_role || "Mentor"}</p>
                      <p className="text-xs text-zinc-500 mt-1">{mentor.organization}</p>
                    </div>
                    <Button
                      onClick={() => handleRequestMentorship(mentor.full_name)}
                      className="bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs px-4 py-2 rounded-xl"
                    >
                      Connect
                    </Button>
                  </div>
                ))
              ) : (
                <div className="col-span-full p-8 rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 text-center space-y-4">
                  <div className="h-12 w-12 rounded-full bg-sky-500/10 text-sky-500 mx-auto flex items-center justify-center border border-sky-500/20">
                    <Sparkles className="h-6 w-6" />
                  </div>
                  <div className="space-y-1 max-w-md mx-auto">
                    <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">Connect with Verified SAMIDHA Volunteer Heads</h4>
                    <p className="text-xs text-zinc-500">
                      Request 1-on-1 academic assistance and doubt resolution directly from active 3rd & 4th year Operational & Volunteer Heads via Email & Instant WhatsApp.
                    </p>
                  </div>
                  <Button
                    onClick={() => router.push('/resources')}
                    className="bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md shadow-sky-500/20"
                  >
                    <Sparkles className="h-4 w-4 mr-1.5" /> Find & Connect with Volunteer Head
                  </Button>
                </div>
              )}
            </div>
          </Card>
        </ScrollReveal>

      </div>
    </ProtectedRoute>
  );
}
