"use client";

import React, { useState, useEffect } from "react";
import { MessageSquare, ThumbsUp, MessageCircle, Share2, Award, Plus, X, Loader2, User } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { communityService } from "@/features/community/services/communityService";
import { useAuth } from "@/features/auth/context/AuthContext";

import { CommunityPostItem } from "@/types/api";
import { CursorDotsCanvas } from "@/components/ui/CursorDotsCanvas";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { AnimatedText } from "@/components/ui/AnimatedText";
import { TiltCard } from "@/components/ui/TiltCard";
import { TypewriterText } from "@/components/ui/TypewriterText";

export default function CommunityPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<CommunityPostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [newPost, setNewPost] = useState({
    title: "",
    content: "",
    post_type: "general"
  });

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const res = await communityService.getPosts();
      if (res.data) {
        setPosts(res.data);
      } else {
        setPosts([]);
      }
    } catch {
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPost.title.trim() || !newPost.content.trim()) return;

    try {
      setSubmitting(true);
      setError(null);
      const res = await communityService.createPost({
        title: newPost.title,
        content: newPost.content,
        post_type: newPost.post_type as any
      });

      if (res.data) {
        setPosts((prev) => [res.data as CommunityPostItem, ...prev]);
      } else {
        // Local push fallback
        const created: CommunityPostItem = {
          id: String(Date.now()),
          title: newPost.title,
          content: newPost.content,
          post_type: newPost.post_type as any,
          likes_count: 0,
          comments_count: 0,
          author_id: user?.id || "local",
          author_name: user?.profile?.full_name || "You",
          author_avatar: user?.profile?.avatar_url || null,
          author_role: user?.role?.name || "student",
          created_at: new Date().toISOString()
        };
        setPosts((prev) => [created, ...prev]);
      }

      setNewPost({ title: "", content: "", post_type: "general" });
      setIsModalOpen(false);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to create post. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleLike = async (postId: string) => {
    try {
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, likes_count: p.likes_count + 1 } : p))
      );
      await communityService.likePost(postId);
    } catch {
      // Ignore
    }
  };

  return (
    <ProtectedRoute>
      <div className="relative overflow-hidden space-y-8 selection:bg-sky-500 selection:text-white">
        <CursorDotsCanvas />

        {/* Header Section */}
        <ScrollReveal direction="zoom" delay={0}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-2">
              <AnimatedText
                text="Educational Community & Mentorship"
                gradientWords={["Community", "Mentorship"]}
                className="text-3xl sm:text-4xl font-extrabold tracking-tight justify-start"
              />
              <TypewriterText
                text="Ask questions, share career guidance, and interact with alumni mentors and peers."
                highlightWords={["questions", "guidance", "mentors"]}
                speedMs={16}
                className="text-xs sm:text-base text-zinc-600 dark:text-zinc-400"
              />
            </div>

            <Button onClick={() => setIsModalOpen(true)} className="bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-2xl shadow-lg shadow-sky-500/20 shrink-0">
              <Plus className="h-4 w-4 mr-2" />
              Create Post
            </Button>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Community Posts Feed */}
          <div className="lg:col-span-2 space-y-6">
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-sky-500" />
              </div>
            ) : posts.length === 0 ? (
              <Card className="text-center py-12 space-y-3">
                <MessageSquare className="h-10 w-10 text-zinc-400 mx-auto" />
                <h3 className="font-semibold text-lg">No posts yet</h3>
                <p className="text-sm text-zinc-500">Be the first to share a question or article with the community.</p>
              </Card>
            ) : (
              posts.map((post, idx) => (
                <ScrollReveal key={post.id} direction="up" delay={idx * 100}>
                  <TiltCard>
                    <Card className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-sky-100 dark:bg-sky-950 text-sky-600 flex items-center justify-center font-bold text-sm overflow-hidden border border-sky-200 dark:border-sky-800">
                          {post.author_avatar ? (
                            <img src={post.author_avatar} alt={post.author_name || "Author"} className="w-full h-full object-cover" />
                          ) : (
                            (post.author_name || "User").slice(0, 2).toUpperCase()
                          )}
                        </div>
                    <div>
                      <h4 className="font-semibold text-sm">{post.author_name || "Community Member"}</h4>
                      <span className="text-[11px] text-sky-600 dark:text-sky-400 font-medium inline-flex items-center gap-1 capitalize">
                        <Award className="h-3 w-3" />
                        {(post.author_role || "member").replace("_", " ")}
                      </span>
                    </div>
                  </div>

                  <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
                    {post.title}
                  </h3>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed whitespace-pre-line">
                    {post.content}
                  </p>

                  <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center gap-6 text-xs text-zinc-500 font-medium">
                    <button
                      onClick={() => handleLike(post.id)}
                      className="flex items-center gap-1.5 hover:text-sky-600 transition-colors"
                    >
                      <ThumbsUp className="h-4 w-4" /> {post.likes_count} Likes
                    </button>
                    <button className="flex items-center gap-1.5 hover:text-sky-600 transition-colors">
                      <MessageCircle className="h-4 w-4" /> {post.comments_count} Comments
                    </button>
                    <button className="flex items-center gap-1.5 hover:text-sky-600 transition-colors">
                      <Share2 className="h-4 w-4" /> Share
                    </button>
                  </div>
                </Card>
              </TiltCard>
            </ScrollReveal>
          ))
        )}
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

        {/* Create Post Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative">
              <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
                <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">Create Community Post</h2>
                <button onClick={() => setIsModalOpen(false)} className="text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300">
                  <X className="h-5 w-5" />
                </button>
              </div>

              {error && (
                <div className="p-3 text-xs text-rose-600 bg-rose-50 dark:bg-rose-950/50 rounded-lg">
                  {error}
                </div>
              )}

              <form onSubmit={handleCreatePost} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Post Type</label>
                  <select
                    value={newPost.post_type}
                    onChange={(e) => setNewPost({ ...newPost, post_type: e.target.value })}
                    className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="general">General Question</option>
                    <option value="career_guidance">Career Guidance</option>
                    <option value="mentorship">Mentorship Request</option>
                    <option value="article">Educational Article</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Title</label>
                  <input
                    required
                    placeholder="E.g., How to prepare for Class 12 Boards?"
                    value={newPost.title}
                    onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                    className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Content</label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Write your discussion or question details here..."
                    value={newPost.content}
                    onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                    className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none text-sm"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" isLoading={submitting} className="bg-sky-600 hover:bg-sky-500 text-white">
                    Publish Post
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
