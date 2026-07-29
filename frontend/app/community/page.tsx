"use client";

import React from "react";
import { MessageSquare, ThumbsUp, MessageCircle, Share2, Award, Plus } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";

export default function CommunityPage() {
  return (
    <ProtectedRoute>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              Educational Community & Mentorship
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400 text-sm">
              Ask questions, share career guidance, and interact with alumni mentors and peers.
            </p>
          </div>

          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Post
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Community Posts Feed */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 flex items-center justify-center font-bold text-sm">
                  AM
                </div>
                <div>
                  <h4 className="font-semibold text-sm">Ananya Sharma</h4>
                  <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium inline-flex items-center gap-1">
                    <Award className="h-3 w-3" />
                    Alumni Mentor • Software Engineer @ TechCorp
                  </span>
                </div>
              </div>

              <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
                Tips for preparing for Engineering Entrance Exams while balancing Class 12 Boards
              </h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                When preparing for both board exams and competitive entrance tests, consistency in revision outweighs cramming long hours. Focus heavily on NCERT fundamentals first...
              </p>

              <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center gap-6 text-xs text-zinc-500 font-medium">
                <button className="flex items-center gap-1.5 hover:text-sky-600 transition-colors">
                  <ThumbsUp className="h-4 w-4" /> 42 Likes
                </button>
                <button className="flex items-center gap-1.5 hover:text-sky-600 transition-colors">
                  <MessageCircle className="h-4 w-4" /> 18 Comments
                </button>
                <button className="flex items-center gap-1.5 hover:text-sky-600 transition-colors">
                  <Share2 className="h-4 w-4" /> Share
                </button>
              </div>
            </Card>
          </div>

          {/* Sidebar Mentorship Topics */}
          <div className="space-y-6">
            <Card className="space-y-4">
              <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">Mentorship Guidelines</h3>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Our community is exclusively dedicated to academic discussion, career guidance, and peer learning. Spam, advertisements, and off-topic posts are strictly moderated.
              </p>
            </Card>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
