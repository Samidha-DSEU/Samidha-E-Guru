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
  const [customPostType, setCustomPostType] = useState("");
  const [likingPosts, setLikingPosts] = useState<Set<string>>(new Set());

  // Comments State
  const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null);
  const [postComments, setPostComments] = useState<any[]>([]);
  const [commentInput, setCommentInput] = useState("");
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);

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
      const finalPostData = {
        ...newPost,
        post_type: newPost.post_type === "other" && customPostType.trim() !== "" ? customPostType : newPost.post_type
      };
      const res = await communityService.createPost(finalPostData);

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
      setCustomPostType("");
      setIsModalOpen(false);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to create post. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleLike = async (postId: string) => {
    if (likingPosts.has(postId)) return;
    
    setLikingPosts((prev) => {
      const newSet = new Set(prev);
      newSet.add(postId);
      return newSet;
    });

    try {
      const res = await communityService.likePost(postId);
      if (res.data) {
        setPosts((prev) =>
          prev.map((p) => (p.id === postId ? { ...p, likes_count: res.data?.likes_count ?? p.likes_count, has_liked: res.data?.liked } : p))
        );
      }
    } catch {
      // Silently fail or show toast
    } finally {
      setLikingPosts((prev) => {
        const newSet = new Set(prev);
        newSet.delete(postId);
        return newSet;
      });
    }
  };

  const loadComments = async (postId: string) => {
    if (activeCommentPostId === postId) {
      setActiveCommentPostId(null);
      return;
    }
    setActiveCommentPostId(postId);
    setCommentsLoading(true);
    try {
      const res = await communityService.getComments(postId);
      if (res.data) setPostComments(res.data);
    } catch {
      import("react-hot-toast").then((toast) => toast.default.error("Failed to load comments"));
    } finally {
      setCommentsLoading(false);
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeCommentPostId) {
      interval = setInterval(async () => {
        try {
          const res = await communityService.getComments(activeCommentPostId);
          if (res.data) setPostComments(res.data);
        } catch {
          // ignore background errors
        }
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [activeCommentPostId]);

  const handleCreateComment = async (e: React.FormEvent, postId: string) => {
    e.preventDefault();
    if (!commentInput.trim()) return;
    setSubmittingComment(true);
    try {
      const res = await communityService.createComment(postId, commentInput);
      if (res.data) {
        setPostComments((prev) => [...prev, res.data]);
        setCommentInput("");
        setPosts((prev) =>
          prev.map((p) => (p.id === postId ? { ...p, comments_count: p.comments_count + 1 } : p))
        );
      }
    } catch {
      import("react-hot-toast").then((toast) => toast.default.error("Failed to post comment"));
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleShare = async (title: string, id: string) => {
    const url = `${window.location.origin}/community?post=${id}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `SAMIDHA E-GURU Community: ${title}`,
          url: url,
        });
      } catch (err) {
        // user cancelled or error
      }
    } else {
      navigator.clipboard.writeText(url);
      import("react-hot-toast").then((toast) => toast.default.success("Link copied to clipboard!"));
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
                        disabled={likingPosts.has(post.id)}
                        className={`flex items-center gap-1.5 transition-colors ${likingPosts.has(post.id) ? "opacity-50 cursor-not-allowed text-sky-600" : post.has_liked ? "text-sky-600" : "hover:text-sky-600"}`}
                      >
                        <ThumbsUp className={`h-4 w-4 ${post.has_liked ? "fill-sky-600" : ""} ${likingPosts.has(post.id) ? "animate-pulse" : ""}`} /> {post.likes_count} Likes
                      </button>
                      <button onClick={() => loadComments(post.id)} className="flex items-center gap-1.5 hover:text-sky-600 transition-colors">
                        <MessageCircle className="h-4 w-4" /> {post.comments_count} Comments
                      </button>
                      <button onClick={() => handleShare(post.title, post.id)} className="flex items-center gap-1.5 hover:text-sky-600 transition-colors">
                        <Share2 className="h-4 w-4" /> Share
                      </button>
                    </div>

                    {activeCommentPostId === post.id && (
                      <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 space-y-4">
                        {commentsLoading ? (
                          <div className="text-center py-4 text-zinc-500 text-xs">Loading comments...</div>
                        ) : (
                          <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                            {postComments.length === 0 ? (
                              <div className="text-center text-xs text-zinc-500">No comments yet. Be the first!</div>
                            ) : (
                              postComments.map((c: any) => (
                                <div key={c.id} className="bg-zinc-50 dark:bg-zinc-900/50 p-3 rounded-xl border border-zinc-100 dark:border-zinc-800">
                                  <div className="flex items-center gap-2 mb-1.5">
                                    <div className="h-6 w-6 rounded-full bg-sky-100 dark:bg-sky-950 text-sky-600 flex items-center justify-center font-bold text-[10px] overflow-hidden">
                                      {c.author_avatar ? <img src={c.author_avatar} alt="Avatar" className="w-full h-full object-cover" /> : c.author_name.slice(0, 2).toUpperCase()}
                                    </div>
                                    <span className="font-semibold text-xs text-zinc-900 dark:text-zinc-100">{c.author_name}</span>
                                    <span className="text-[9px] text-zinc-400">{new Date(c.created_at).toLocaleDateString()}</span>
                                  </div>
                                  <p className="text-xs text-zinc-600 dark:text-zinc-400 pl-8">{c.content}</p>
                                </div>
                              ))
                            )}
                          </div>
                        )}
                        <form onSubmit={(e) => handleCreateComment(e, post.id)} className="flex gap-2 pt-2">
                          <input
                            type="text"
                            placeholder="Write a comment..."
                            value={commentInput}
                            onChange={(e) => setCommentInput(e.target.value)}
                            className="flex-1 px-3 py-2 text-xs border border-zinc-200 dark:border-zinc-700 bg-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                          />
                          <Button type="submit" isLoading={submittingComment} disabled={!commentInput.trim()} size="sm" className="bg-sky-600 hover:bg-sky-500 text-white px-3">
                            Post
                          </Button>
                        </form>
                      </div>
                    )}
                  </Card>
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
                    className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-transparent dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="general">General Question</option>
                    <option value="career_guidance">Career Guidance</option>
                    <option value="mentorship">Mentorship Request</option>
                    <option value="article">Educational Article</option>
                    <option value="other">Other (Custom)</option>
                  </select>
                  {newPost.post_type === "other" && (
                    <input
                      type="text"
                      placeholder="Enter custom post tag (e.g., Event Update)"
                      value={customPostType}
                      onChange={(e) => setCustomPostType(e.target.value)}
                      className="w-full mt-2 px-3 py-2 border border-sky-300 dark:border-sky-700 rounded-lg bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                      required
                    />
                  )}
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
