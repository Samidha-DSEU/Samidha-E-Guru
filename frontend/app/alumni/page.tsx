"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { getUserSlug } from "@/lib/userUtils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Upload, Calendar, Users, BookOpen, Award, FileText, CheckCircle2, Clock, X, ExternalLink, Trash2, Ban, MessageSquare, Sparkles, Send, Check, AlertCircle, ShieldCheck } from "lucide-react";
import { apiClient } from "@/services/apiClient";
import { StandardResponse } from "@/types/api";
import { Card, Skeleton } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { useAuth } from "@/features/auth/context/AuthContext";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { TiltCard } from "@/components/ui/TiltCard";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";

const CLASSES = ["Class 6", "Class 7", "Class 8", "Class 9", "Class 10", "Class 11", "Class 12", "Undergraduate"];
const SUBJECTS = ["Mathematics", "Science", "Physics", "Chemistry", "Biology", "English", "Computer Science", "Career Guidance"];
const CATEGORIES = ["Industry Trend / Market Advice", "Career Preparation Guide", "Interview Tips", "Mentorship Note"];

interface MyUploadItem {
  id: string;
  title: string;
  description?: string;
  external_url: string;
  target_class: string;
  subject_name: string;
  resource_category: string;
  verification_status: string;
  rejection_reason?: string;
  deletion_reason?: string;
  views_count: number;
  rating_avg: number;
  created_at: string;
}

interface MyEventItem {
  id: string;
  title: string;
  description: string;
  mode: string;
  venue: string;
  event_date: string;
  start_time?: string;
  whatsapp_group_url?: string;
  verification_status: string;
  event_status: string;
  registrations_count: number;
  rejection_reason?: string;
  created_at: string;
}

interface StudentRosterItem {
  id: string;
  full_name: string;
  email: string;
  class_or_college: string;
  mobile_number: string;
  address: string;
  registered_at: string;
}

interface MentorshipRequestItem {
  id: string;
  topic: string;
  message_note?: string;
  status: string;
  requester_name: string;
  requester_email: string;
  created_at: string;
}

interface ChatMessageItem {
  id: string;
  sender_id: string;
  sender_name: string;
  message: string;
  created_at: string;
}

export default function AlumniDashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (user && (!params || !params.username)) {
      const slug = getUserSlug(user);
      router.replace(`/alumni/${slug}`);
    }
  }, [user, params, router]);

  // ACTIVE TAB & FILTER STATE
  const [activeTab, setActiveTab] = useState<"requests" | "guides" | "resources">("requests");

  // MODALS STATE
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [eventTab, setEventTab] = useState<"create" | "manage">("manage");
  const [isMenteesModalOpen, setIsMenteesModalOpen] = useState(false);
  const [activeChatRequest, setActiveChatRequest] = useState<MentorshipRequestItem | null>(null);
  const [chatInputMessage, setChatInputMessage] = useState("");

  // GUIDE FORM STATE
  const [guideData, setGuideData] = useState({
    title: "",
    category: "Industry Trend / Market Advice",
    content: ""
  });

  // RESOURCE FORM STATE
  const [resourceData, setResourceData] = useState({
    title: "",
    target_class: "Undergraduate",
    subject_name: "Career Guidance",
    resource_category: "Mentorship Guide",
    external_url: "",
    description: ""
  });
  const [uploadError, setUploadError] = useState<string | null>(null);

  // EVENT FORM STATE
  const [eventData, setEventData] = useState({
    title: "",
    description: "",
    mode: "online",
    venue: "",
    event_date: "",
    start_time: "6:00 PM",
    whatsapp_group_url: "",
    max_participants: 50
  });
  const [eventError, setEventError] = useState<string | null>(null);

  // QUERIES
  const { data: statsData, isLoading: isStatsLoading } = useQuery({
    queryKey: ["alumniStats"],
    queryFn: async () => {
      const res = await apiClient.get<StandardResponse<{
        total_uploaded: number;
        approved_and_live: number;
        pending_review: number;
      }>>("/resources/my-stats");
      return res.data;
    }
  });

  const { data: myUploadsData, isLoading: myUploadsLoading, refetch: refetchMyUploads } = useQuery({
    queryKey: ["myAlumniUploads"],
    queryFn: async () => {
      const res = await apiClient.get<StandardResponse<MyUploadItem[]>>("/resources/my-uploads");
      return res.data;
    }
  });

  const { data: myEventsData, isLoading: myEventsLoading, refetch: refetchMyEvents } = useQuery({
    queryKey: ["myAlumniEvents"],
    queryFn: async () => {
      const res = await apiClient.get<StandardResponse<MyEventItem[]>>("/events/my-events");
      return res.data;
    }
  });

  const { data: receivedRequestsData, isLoading: requestsLoading, refetch: refetchReceivedRequests } = useQuery({
    queryKey: ["receivedMentorshipRequests"],
    queryFn: async () => {
      const res = await apiClient.get<StandardResponse<MentorshipRequestItem[]>>("/mentorship/requests/received");
      return res.data;
    }
  });

  // REAL-TIME CHAT MESSAGES QUERY (POLLING EVERY 3 SECONDS WHEN CHAT ROOM IS OPEN)
  const { data: chatMessagesData, refetch: refetchChatMessages } = useQuery({
    queryKey: ["mentorshipChatMessagesAlumni", activeChatRequest?.id],
    queryFn: async () => {
      if (!activeChatRequest) return null;
      const res = await apiClient.get<StandardResponse<ChatMessageItem[]>>(`/mentorship/requests/${activeChatRequest.id}/messages`);
      return res.data;
    },
    enabled: !!activeChatRequest,
    refetchInterval: 3000
  });

  // MUTATIONS
  const respondRequestMutation = useMutation({
    mutationFn: async ({ requestId, action }: { requestId: string; action: string }) => {
      const res = await apiClient.post(`/mentorship/requests/${requestId}/respond`, { action });
      return res.data;
    },
    onSuccess: () => {
      refetchReceivedRequests();
    }
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      if (!activeChatRequest) return;
      const res = await apiClient.post(`/mentorship/requests/${activeChatRequest.id}/messages`, { message });
      return res.data;
    },
    onSuccess: () => {
      setChatInputMessage("");
      refetchChatMessages();
    }
  });

  const uploadResourceMutation = useMutation({
    mutationFn: async (data: typeof resourceData) => {
      const res = await apiClient.post("/resources", data);
      return res.data;
    },
    onSuccess: () => {
      setIsUploadModalOpen(false);
      setResourceData({ title: "", target_class: "Undergraduate", subject_name: "Career Guidance", resource_category: "Mentorship Guide", external_url: "", description: "" });
      setUploadError(null);
      queryClient.invalidateQueries({ queryKey: ["alumniStats"] });
      refetchMyUploads();
    }
  });

  const createEventMutation = useMutation({
    mutationFn: async (data: typeof eventData) => {
      const res = await apiClient.post("/events", data);
      return res.data;
    },
    onSuccess: () => {
      setEventTab("manage");
      setEventData({ title: "", description: "", mode: "online", venue: "", event_date: "", start_time: "6:00 PM", whatsapp_group_url: "", max_participants: 50 });
      setEventError(null);
      refetchMyEvents();
    }
  });

  const stats = statsData?.data;
  const myUploads = myUploadsData?.data || [];
  const myEvents = myEventsData?.data || [];
  const receivedRequests = receivedRequestsData?.data || [];
  const chatMessages = chatMessagesData?.data || [];

  const pendingRequestsCount = receivedRequests.filter((r) => r.status === "pending").length;
  const totalMenteesCount = myEvents.reduce((sum, evt) => sum + (evt.registrations_count || 0), 0) + receivedRequests.filter((r) => r.status === "accepted").length;

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInputMessage.trim()) return;
    sendMessageMutation.mutate(chatInputMessage);
  };

  const handleGuideSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert("Industry Guide & Market Insight published successfully!");
    setIsGuideModalOpen(false);
    setGuideData({ title: "", category: "Industry Trend / Market Advice", content: "" });
  };

  return (
    <ProtectedRoute allowedRoles={["alumni", "admin", "super_admin"]}>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              Welcome back, {user?.profile?.full_name || "Alumni Mentor"}! 👋
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400 text-sm mt-1">
              Share industry trends & market advice, accept mentorship requests, and chat live 1-on-1 with volunteers.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={() => setIsGuideModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-500 text-white">
              <Plus className="h-4 w-4 mr-1.5" />
              Publish Market Guide
            </Button>

            <Button onClick={() => setIsEventModalOpen(true)} className="bg-purple-600 hover:bg-purple-500 text-white">
              <Calendar className="h-4 w-4 mr-1.5" />
              Organize Bootcamps
            </Button>

            <Button onClick={() => setIsUploadModalOpen(true)} className="bg-emerald-600 hover:bg-emerald-500 text-white">
              <Upload className="h-4 w-4 mr-1.5" />
              Upload Resource
            </Button>
          </div>
        </div>

        {/* METRIC CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
          <ScrollReveal direction="up" delay={100}>
            <TiltCard className="h-full">
              <Card
                onClick={() => setActiveTab("requests")}
                className={`space-y-2 cursor-pointer transition-all h-full ${
                  activeTab === "requests" ? "ring-2 ring-purple-500 bg-purple-50/40" : ""
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">Mentorship Requests</span>
                  <MessageSquare className="h-4 w-4 text-purple-600 animate-pulse" />
                </div>
                <AnimatedNumber value={String(receivedRequests.length)} className="text-3xl font-bold text-purple-600" />
                <div className="text-[11px] text-purple-600 font-semibold">{pendingRequestsCount} Pending Review</div>
              </Card>
            </TiltCard>
          </ScrollReveal>

          <ScrollReveal direction="up" delay={200}>
            <TiltCard className="h-full">
              <Card
                onClick={() => setActiveTab("guides")}
                className={`space-y-2 cursor-pointer transition-all h-full ${
                  activeTab === "guides" ? "ring-2 ring-indigo-500 bg-indigo-50/40" : ""
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">Market Insights & Guides</span>
                  <BookOpen className="h-4 w-4 text-indigo-500" />
                </div>
                <AnimatedNumber value="4" className="text-3xl font-bold text-zinc-900 dark:text-zinc-50" />
                <div className="text-[11px] text-indigo-600">Published Industry Advice</div>
              </Card>
            </TiltCard>
          </ScrollReveal>

          <ScrollReveal direction="up" delay={300}>
            <TiltCard className="h-full">
              <Card
                onClick={() => setIsMenteesModalOpen(true)}
                className="space-y-2 cursor-pointer transition-all ring-2 ring-sky-500 bg-sky-50/40 border-sky-300 h-full"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-sky-800">Active Mentees & Students</span>
                  <Users className="h-4 w-4 text-sky-600" />
                </div>
                <AnimatedNumber value={String(totalMenteesCount)} className="text-3xl font-bold text-sky-600" />
                <div className="text-[11px] text-sky-600 font-semibold">Click to view student contact roster ➔</div>
              </Card>
            </TiltCard>
          </ScrollReveal>

          <ScrollReveal direction="up" delay={400}>
            <TiltCard className="h-full">
              <Card className="space-y-2 bg-gradient-to-br from-indigo-50/50 to-purple-50/50 border-indigo-200 h-full">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-700">Mentorship Status</span>
                  <Award className="h-4 w-4 text-indigo-600" />
                </div>
                <div className="text-lg font-bold text-indigo-700">Senior Alumni Mentor</div>
                <div className="text-[11px] text-indigo-500">Verified Alumni Professional</div>
              </Card>
            </TiltCard>
          </ScrollReveal>
        </div>

        {/* NAVIGATION TABS */}
        <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-3">
          <button
            onClick={() => setActiveTab("requests")}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === "requests" ? "bg-purple-600 text-white" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600"
            }`}
          >
            🤝 Incoming Mentorship Requests ({receivedRequests.length})
          </button>

          <button
            onClick={() => setActiveTab("guides")}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === "guides" ? "bg-indigo-600 text-white" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600"
            }`}
          >
            💡 Industry Trends & Market Guides
          </button>

          <button
            onClick={() => setActiveTab("resources")}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === "resources" ? "bg-emerald-600 text-white" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600"
            }`}
          >
            📚 My Uploaded Resources ({myUploads.length})
          </button>
        </div>

        {/* TAB 1: INCOMING MENTORSHIP REQUESTS PIPELINE */}
        {activeTab === "requests" && (
          <Card className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-purple-500" /> Incoming Mentorship Guidance Requests
              </h2>
              <span className="text-xs text-zinc-500 font-medium">{pendingRequestsCount} awaiting your approval</span>
            </div>

            <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-zinc-50 dark:bg-zinc-900/50 text-zinc-500 text-xs font-semibold uppercase border-b border-zinc-200 dark:border-zinc-800">
                  <tr>
                    <th className="px-4 py-3">Requester (Volunteer/Student)</th>
                    <th className="px-4 py-3">Guidance Topic & Message Note</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {requestsLoading ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-zinc-500 text-xs">Loading mentorship requests...</td>
                    </tr>
                  ) : receivedRequests.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-zinc-500 text-xs">
                        No mentorship requests received yet.
                      </td>
                    </tr>
                  ) : (
                    receivedRequests.map((req) => (
                      <tr key={req.id}>
                        <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">
                          <div>{req.requester_name}</div>
                          <div className="text-[11px] text-zinc-500">{req.requester_email}</div>
                        </td>
                        <td className="px-4 py-3 text-xs">
                          <div className="font-semibold text-indigo-600">{req.topic}</div>
                          {req.message_note && <div className="text-zinc-500 italic mt-0.5 font-normal">"{req.message_note}"</div>}
                        </td>
                        <td className="px-4 py-3 text-xs">
                          <span className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase ${
                            req.status === "accepted" ? "bg-emerald-100 text-emerald-700" : req.status === "declined" ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700"
                          }`}>
                            {req.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right space-x-2">
                          {req.status === "pending" && (
                            <>
                              <Button
                                size="sm"
                                isLoading={respondRequestMutation.isPending}
                                onClick={() => respondRequestMutation.mutate({ requestId: req.id, action: "accept" })}
                                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs h-8"
                              >
                                <Check className="h-3.5 w-3.5 mr-1" /> Accept Request
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                isLoading={respondRequestMutation.isPending}
                                onClick={() => respondRequestMutation.mutate({ requestId: req.id, action: "decline" })}
                                className="text-rose-600 border-rose-200 text-xs h-8"
                              >
                                Decline
                              </Button>
                            </>
                          )}

                          {req.status === "accepted" && (
                            <Button
                              size="sm"
                              onClick={() => setActiveChatRequest(req)}
                              className="bg-purple-600 hover:bg-purple-500 text-white text-xs h-8"
                            >
                              <MessageSquare className="h-3.5 w-3.5 mr-1" /> Open Live Chat Room ➔
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* TAB 2: INDUSTRY TRENDS & MARKET GUIDES */}
        {activeTab === "guides" && (
          <Card className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-indigo-500" /> Published Industry Insights & Market Advice
              </h2>
              <Button size="sm" onClick={() => setIsGuideModalOpen(true)} className="bg-indigo-600 text-white">
                + Publish Market Guide
              </Button>
            </div>

            <div className="space-y-3">
              <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">Market Advice: AI & Cloud Computing Trends for 2026 Graduates</h4>
                  <div className="text-xs text-zinc-500">Category: Industry Trend / Market Advice • Published 2 days ago</div>
                </div>
                <span className="px-2 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded">PUBLISHED</span>
              </div>
            </div>
          </Card>
        )}

        {/* 1-ON-1 REAL-TIME MENTORSHIP CHAT ROOM MODAL */}
        {activeChatRequest && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-2xl w-full h-[80vh] flex flex-col shadow-2xl overflow-hidden relative">
              <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/60 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                    💬 Mentorship Room with {activeChatRequest.requester_name}: {activeChatRequest.topic}
                  </h3>
                  <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 mt-0.5">
                    <ShieldCheck className="h-3.5 w-3.5" /> Asynchronous Text-Only Inbox • Auto-purges after 3 days
                  </div>
                </div>
                <button onClick={() => setActiveChatRequest(null)} className="text-zinc-500 hover:text-zinc-700">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-zinc-50/50 dark:bg-zinc-950/50">
                {chatMessages.length === 0 ? (
                  <div className="text-center py-12 text-xs text-zinc-400">
                    No messages yet. Send a message to start real-time conversation!
                  </div>
                ) : (
                  chatMessages.map((msg) => {
                    const isMe = msg.sender_id === user?.id;
                    return (
                      <div key={msg.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                        <div className={`max-w-[75%] px-3.5 py-2.5 rounded-2xl text-xs ${
                          isMe ? "bg-purple-600 text-white rounded-br-none" : "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700 rounded-bl-none shadow-sm"
                        }`}>
                          <div className="font-bold text-[10px] opacity-75 mb-0.5">{msg.sender_name}</div>
                          <div>{msg.message}</div>
                        </div>
                        <span className="text-[9px] text-zinc-400 mt-1 px-1">{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    );
                  })
                )}
              </div>

              <form onSubmit={handleSendMessage} className="p-3 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center gap-2">
                <input
                  type="text"
                  required
                  placeholder="Type your message to mentee..."
                  value={chatInputMessage}
                  onChange={(e) => setChatInputMessage(e.target.value)}
                  className="flex-1 px-4 py-2.5 border border-zinc-300 dark:border-zinc-700 rounded-xl bg-transparent text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <Button type="submit" size="sm" className="bg-purple-600 text-white px-4">
                  Send <Send className="h-3.5 w-3.5 ml-1.5" />
                </Button>
              </form>
            </div>
          </div>
        )}

        {/* PUBLISH MARKET GUIDE MODAL */}
        {isGuideModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl relative">
              <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
                <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-indigo-500" /> Publish Industry Insights & Market Advice
                </h3>
                <button onClick={() => setIsGuideModalOpen(false)} className="text-zinc-500 hover:text-zinc-700">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleGuideSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="E.g., Market Advice: Software Engineering Specializations in 2026"
                    value={guideData.title}
                    onChange={(e) => setGuideData({ ...guideData, title: e.target.value })}
                    className="w-full p-3 border border-zinc-300 dark:border-zinc-700 rounded-xl bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Category *</label>
                  <select
                    value={guideData.category}
                    onChange={(e) => setGuideData({ ...guideData, category: e.target.value })}
                    className="w-full p-2.5 border border-zinc-300 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-800 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Market Advice & Industry Insights *</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Share market trends, skill demands, and guidance for volunteers and students..."
                    value={guideData.content}
                    onChange={(e) => setGuideData({ ...guideData, content: e.target.value })}
                    className="w-full p-3 border border-zinc-300 dark:border-zinc-700 rounded-xl bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <Button variant="outline" type="button" onClick={() => setIsGuideModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white">
                    Publish Guide
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
        {/* UPLOAD RESOURCE MODAL */}
        {isUploadModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl relative">
              <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
                <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <Upload className="h-5 w-5 text-emerald-500" /> Upload Career & Educational Resource
                </h3>
                <button onClick={() => setIsUploadModalOpen(false)} className="text-zinc-500 hover:text-zinc-700">
                  <X className="h-5 w-5" />
                </button>
              </div>

              {uploadError && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-medium rounded-xl">
                  {uploadError}
                </div>
              )}

              <form onSubmit={handleResourceSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Document Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="E.g., Tech Placement & Interview Preparation Handbook 2026"
                    value={resourceData.title}
                    onChange={(e) => setResourceData({ ...resourceData, title: e.target.value })}
                    className="w-full p-3 border border-zinc-300 dark:border-zinc-700 rounded-xl bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Target Class *</label>
                    <select
                      value={resourceData.target_class}
                      onChange={(e) => setResourceData({ ...resourceData, target_class: e.target.value })}
                      className="w-full p-2.5 border border-zinc-300 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-800 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      {CLASSES.map((cls) => (
                        <option key={cls} value={cls}>{cls}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Subject *</label>
                    <select
                      value={resourceData.subject_name}
                      onChange={(e) => setResourceData({ ...resourceData, subject_name: e.target.value })}
                      className="w-full p-2.5 border border-zinc-300 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-800 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      {SUBJECTS.map((sub) => (
                        <option key={sub} value={sub}>{sub}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Category *</label>
                    <select
                      value={resourceData.resource_category}
                      onChange={(e) => setResourceData({ ...resourceData, resource_category: e.target.value })}
                      className="w-full p-2.5 border border-zinc-300 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-800 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">External Document / Drive Link *</label>
                  <input
                    type="url"
                    required
                    placeholder="https://drive.google.com/file/d/..."
                    value={resourceData.external_url}
                    onChange={(e) => setResourceData({ ...resourceData, external_url: e.target.value })}
                    className="w-full p-3 border border-zinc-300 dark:border-zinc-700 rounded-xl bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Description / Summary</label>
                  <textarea
                    rows={3}
                    placeholder="Brief summary of advice or guide contents..."
                    value={resourceData.description}
                    onChange={(e) => setResourceData({ ...resourceData, description: e.target.value })}
                    className="w-full p-3 border border-zinc-300 dark:border-zinc-700 rounded-xl bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" type="button" onClick={() => setIsUploadModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" isLoading={uploadResourceMutation.isPending} className="bg-emerald-600 text-white font-bold">
                    Publish Alumni Guide
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
