"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { getUserSlug } from "@/lib/userUtils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Upload, Calendar, Clock, ShieldCheck, CheckCircle2, Lock, Plus, FileText, X, MessageSquare, Users, Eye, Ban, Edit, Sparkles, Trash2, ExternalLink, AlertTriangle, Send, UserCheck, Briefcase } from "lucide-react";
import { apiClient } from "@/services/apiClient";
import { StandardResponse } from "@/types/api";
import { Card, Skeleton } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { useAuth } from "@/features/auth/context/AuthContext";

const CLASSES = ["Class 6", "Class 7", "Class 8", "Class 9", "Class 10", "Class 11", "Class 12", "Undergraduate"];
const SUBJECTS = ["Mathematics", "Science", "Physics", "Chemistry", "Biology", "English", "Social Science", "Computer Science"];
const CATEGORIES = ["Notes", "Question Paper / PYQ", "Sample Paper", "Worksheet"];

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

interface AlumniMentorItem {
  id: string;
  full_name: string;
  email: string;
  avatar_url?: string;
  bio: string;
  current_company: string;
  designation: string;
}

interface MentorshipRequestItem {
  id: string;
  topic: string;
  message_note?: string;
  status: string;
  alumni_name?: string;
  alumni_email?: string;
  requester_name?: string;
  requester_email?: string;
  created_at: string;
}

interface ChatMessageItem {
  id: string;
  sender_id: string;
  sender_name: string;
  message: string;
  created_at: string;
}

export default function VolunteerDashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();
  const volunteerProfile = user?.volunteer_profile;
  const status = volunteerProfile?.approval_status || "PENDING";
  const isApproved = status === "APPROVED";

  useEffect(() => {
    if (user && (!params || !params.username)) {
      const slug = getUserSlug(user);
      router.replace(`/volunteer/${slug}`);
    }
  }, [user, params, router]);

  const [timeLeft, setTimeLeft] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"uploads" | "alumni" | "chats">("uploads");
  const [resourceFilter, setResourceFilter] = useState<"all" | "approved" | "pending">("all");

  // RESOURCE UPLOAD MODAL STATE
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [resourceData, setResourceData] = useState({
    title: "",
    target_class: "Class 9",
    subject_name: "Science",
    resource_category: "Notes",
    external_url: "",
    description: ""
  });
  const [uploadError, setUploadError] = useState<string | null>(null);

  // RESOURCE DELETION REQUEST MODAL STATE
  const [deletingResourceId, setDeletingResourceId] = useState<string | null>(null);
  const [deletionNote, setDeletionNote] = useState("");

  // EVENT MANAGEMENT MODAL STATE
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [eventTab, setEventTab] = useState<"create" | "manage">("manage");
  const [eventData, setEventData] = useState({
    title: "",
    description: "",
    mode: "online",
    venue: "",
    event_date: "",
    start_time: "5:00 PM",
    whatsapp_group_url: "",
    max_participants: 50
  });
  const [eventError, setEventError] = useState<string | null>(null);

  // ROSTER MODAL STATE
  const [viewingRosterEventId, setViewingRosterEventId] = useState<string | null>(null);
  const [viewingRosterEventTitle, setViewingRosterEventTitle] = useState<string>("");

  // MENTORSHIP REQUEST MODAL & CHAT ROOM STATE
  const [requestingAlumni, setRequestingAlumni] = useState<AlumniMentorItem | null>(null);
  const [mentorshipTopic, setMentorshipTopic] = useState("");
  const [mentorshipNote, setMentorshipNote] = useState("");
  const [activeChatRequest, setActiveChatRequest] = useState<MentorshipRequestItem | null>(null);
  const [chatInputMessage, setChatInputMessage] = useState("");

  // TIMER LOGIC FOR 3-DAY EXPIRY
  useEffect(() => {
    if (status !== "PENDING" || !volunteerProfile?.expires_at) return;

    const interval = setInterval(() => {
      const expiresAt = new Date(volunteerProfile.expires_at!).getTime();
      const now = new Date().getTime();
      const diff = expiresAt - now;

      if (diff <= 0) {
        setTimeLeft("Purge Pending (Expired)");
        clearInterval(interval);
      } else {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [status, volunteerProfile?.expires_at]);

  // QUERIES
  const { data: statsData, isLoading: isStatsLoading } = useQuery({
    queryKey: ["volunteerStats"],
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
    queryKey: ["myUploads"],
    queryFn: async () => {
      const res = await apiClient.get<StandardResponse<MyUploadItem[]>>("/resources/my-uploads");
      return res.data;
    }
  });

  const { data: myEventsData, isLoading: myEventsLoading, refetch: refetchMyEvents } = useQuery({
    queryKey: ["myEvents"],
    queryFn: async () => {
      const res = await apiClient.get<StandardResponse<MyEventItem[]>>("/events/my-events");
      return res.data;
    }
  });

  const { data: alumniMentorsData, isLoading: alumniLoading } = useQuery({
    queryKey: ["alumniMentorsDirectory"],
    queryFn: async () => {
      const res = await apiClient.get<StandardResponse<AlumniMentorItem[]>>("/mentorship/alumni");
      return res.data;
    }
  });

  const { data: sentRequestsData, isLoading: sentRequestsLoading, refetch: refetchSentRequests } = useQuery({
    queryKey: ["sentMentorshipRequests"],
    queryFn: async () => {
      const res = await apiClient.get<StandardResponse<MentorshipRequestItem[]>>("/mentorship/requests/sent");
      return res.data;
    }
  });

  // REAL-TIME CHAT MESSAGES QUERY (POLLING EVERY 3 SECONDS WHEN CHAT ROOM IS OPEN)
  const { data: chatMessagesData, refetch: refetchChatMessages } = useQuery({
    queryKey: ["mentorshipChatMessages", activeChatRequest?.id],
    queryFn: async () => {
      if (!activeChatRequest) return null;
      const res = await apiClient.get<StandardResponse<ChatMessageItem[]>>(`/mentorship/requests/${activeChatRequest.id}/messages`);
      return res.data;
    },
    enabled: !!activeChatRequest,
    refetchInterval: 3000
  });

  // MUTATIONS
  const sendMentorshipRequestMutation = useMutation({
    mutationFn: async (data: { alumni_id: string; topic: string; message_note: string }) => {
      const res = await apiClient.post("/mentorship/request", data);
      return res.data;
    },
    onSuccess: () => {
      setRequestingAlumni(null);
      setMentorshipTopic("");
      setMentorshipNote("");
      refetchSentRequests();
      setActiveTab("chats");
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
      setResourceData({ title: "", target_class: "Class 9", subject_name: "Science", resource_category: "Notes", external_url: "", description: "" });
      setUploadError(null);
      queryClient.invalidateQueries({ queryKey: ["volunteerStats"] });
      refetchMyUploads();
    },
    onError: (err: any) => {
      setUploadError(err.response?.data?.detail || err.response?.data?.message || "Failed to submit resource.");
    }
  });

  const requestDeletionMutation = useMutation({
    mutationFn: async ({ resourceId, reason }: { resourceId: string; reason: string }) => {
      const res = await apiClient.post(`/resources/${resourceId}/request-deletion`, { reason });
      return res.data;
    },
    onSuccess: () => {
      setDeletingResourceId(null);
      setDeletionNote("");
      refetchMyUploads();
      queryClient.invalidateQueries({ queryKey: ["volunteerStats"] });
    }
  });

  const createEventMutation = useMutation({
    mutationFn: async (data: typeof eventData) => {
      const res = await apiClient.post("/events", data);
      return res.data;
    },
    onSuccess: () => {
      setEventTab("manage");
      setEventData({ title: "", description: "", mode: "online", venue: "", event_date: "", start_time: "5:00 PM", whatsapp_group_url: "", max_participants: 50 });
      setEventError(null);
      refetchMyEvents();
    },
    onError: (err: any) => {
      setEventError(err.response?.data?.detail || err.response?.data?.message || "Failed to create bootcamp.");
    }
  });

  const closeEventMutation = useMutation({
    mutationFn: async (eventId: string) => {
      const res = await apiClient.post(`/events/${eventId}/close`);
      return res.data;
    },
    onSuccess: () => {
      refetchMyEvents();
    }
  });

  const stats = statsData?.data;
  const myUploads = myUploadsData?.data || [];
  const myEvents = myEventsData?.data || [];
  const alumniMentors = alumniMentorsData?.data || [];
  const sentRequests = sentRequestsData?.data || [];
  const chatMessages = chatMessagesData?.data || [];

  const filteredUploads = myUploads.filter((item) => {
    if (resourceFilter === "approved") return item.verification_status === "approved";
    if (resourceFilter === "pending") return item.verification_status === "pending";
    return true;
  });

  const handleResourceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resourceData.title || !resourceData.external_url) {
      setUploadError("Please provide a title and document link.");
      return;
    }
    uploadResourceMutation.mutate(resourceData);
  };

  const handleEventSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventData.title || !eventData.venue || !eventData.event_date) {
      setEventError("Please fill in event title, venue/link, and date.");
      return;
    }
    createEventMutation.mutate(eventData);
  };

  const handleMentorshipRequestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestingAlumni || !mentorshipTopic) return;
    sendMentorshipRequestMutation.mutate({
      alumni_id: requestingAlumni.id,
      topic: mentorshipTopic,
      message_note: mentorshipNote
    });
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInputMessage.trim()) return;
    sendMessageMutation.mutate(chatInputMessage);
  };

  return (
    <ProtectedRoute allowedRoles={["volunteer", "admin", "super_admin"]}>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              Welcome back, {user?.profile?.full_name || "Volunteer"}! 👋
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400 text-sm mt-1">
              Upload study notes, connect with Alumni Mentors, host free bootcamps, and guide students.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              disabled={!isApproved}
              onClick={() => setIsEventModalOpen(true)}
              className="bg-purple-600 hover:bg-purple-500 text-white"
            >
              <Calendar className="h-4 w-4 mr-2" />
              Organize Bootcamps
            </Button>

            <Button
              disabled={!isApproved}
              onClick={() => setIsUploadModalOpen(true)}
              className="bg-sky-600 hover:bg-sky-500 text-white"
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload Resource
            </Button>
          </div>
        </div>

        {/* METRIC CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
          <Card
            onClick={() => { setActiveTab("uploads"); setResourceFilter("all"); }}
            className={`space-y-2 cursor-pointer transition-all ${
              activeTab === "uploads" && resourceFilter === "all" ? "ring-2 ring-sky-500 bg-sky-50/40" : ""
            }`}
          >
            <div className="flex items-center justify-between text-zinc-500">
              <span className="text-xs font-bold uppercase tracking-wider">Total Uploaded</span>
              <FileText className="h-4 w-4 text-sky-600" />
            </div>
            <div className="text-3xl font-bold">{isStatsLoading ? <Skeleton className="h-8 w-16" /> : stats?.total_uploaded ?? 0}</div>
          </Card>

          <Card
            onClick={() => { setActiveTab("uploads"); setResourceFilter("approved"); }}
            className={`space-y-2 cursor-pointer transition-all ${
              activeTab === "uploads" && resourceFilter === "approved" ? "ring-2 ring-emerald-500 bg-emerald-50/40" : ""
            }`}
          >
            <div className="flex items-center justify-between text-zinc-500">
              <span className="text-xs font-bold uppercase tracking-wider">Approved & Live</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="text-3xl font-bold text-emerald-600">{isStatsLoading ? <Skeleton className="h-8 w-16" /> : stats?.approved_and_live ?? 0}</div>
          </Card>

          <Card
            onClick={() => setActiveTab("alumni")}
            className={`space-y-2 cursor-pointer transition-all ${
              activeTab === "alumni" ? "ring-2 ring-indigo-500 bg-indigo-50/40" : ""
            }`}
          >
            <div className="flex items-center justify-between text-zinc-500">
              <span className="text-xs font-bold uppercase tracking-wider">Alumni Mentors</span>
              <Briefcase className="h-4 w-4 text-indigo-600" />
            </div>
            <div className="text-3xl font-bold text-indigo-600">{alumniMentors.length}</div>
            <div className="text-[11px] text-indigo-600 font-semibold">Click to connect LinkedIn-style</div>
          </Card>

          <Card
            onClick={() => setActiveTab("chats")}
            className={`space-y-2 cursor-pointer transition-all ${
              activeTab === "chats" ? "ring-2 ring-purple-500 bg-purple-50/40" : ""
            }`}
          >
            <div className="flex items-center justify-between text-zinc-500">
              <span className="text-xs font-bold uppercase tracking-wider">Mentorship Chats</span>
              <MessageSquare className="h-4 w-4 text-purple-600" />
            </div>
            <div className="text-3xl font-bold text-purple-600">{sentRequests.length}</div>
            <div className="text-[11px] text-purple-600 font-semibold">Live 1-on-1 Chat Rooms</div>
          </Card>
        </div>

        {/* NAVIGATION TABS */}
        <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-3">
          <button
            onClick={() => setActiveTab("uploads")}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === "uploads" ? "bg-sky-600 text-white" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600"
            }`}
          >
            📚 My Uploaded Study Resources
          </button>

          <button
            onClick={() => setActiveTab("alumni")}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === "alumni" ? "bg-indigo-600 text-white" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600"
            }`}
          >
            💼 LinkedIn Alumni Mentors Directory ({alumniMentors.length})
          </button>

          <button
            onClick={() => setActiveTab("chats")}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === "chats" ? "bg-purple-600 text-white" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600"
            }`}
          >
            💬 Mentorship Chat Rooms ({sentRequests.length})
          </button>
        </div>

        {/* TAB 1: UPLOADED RESOURCES */}
        {activeTab === "uploads" && (
          <Card className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <FileText className="h-5 w-5 text-sky-500" /> Educational Resources Uploaded by You
              </h2>
              <Button size="sm" onClick={() => setIsUploadModalOpen(true)} className="bg-sky-600 text-white">
                + Upload Resource
              </Button>
            </div>

            <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-zinc-50 dark:bg-zinc-900/50 text-zinc-500 text-xs font-semibold uppercase border-b border-zinc-200 dark:border-zinc-800">
                  <tr>
                    <th className="px-4 py-3">Resource Title</th>
                    <th className="px-4 py-3">Taxonomy</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Views & Rating</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {myUploads.map((res) => (
                    <tr key={res.id}>
                      <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">{res.title}</td>
                      <td className="px-4 py-3 text-xs">{res.target_class} • {res.subject_name}</td>
                      <td className="px-4 py-3 text-xs">
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded uppercase bg-emerald-100 text-emerald-700">
                          {res.verification_status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs">👁️ {res.views_count} Views</td>
                      <td className="px-4 py-3 text-right">
                        <a href={res.external_url} target="_blank" rel="noopener noreferrer" className="text-sky-600 font-semibold text-xs">
                          Open Link
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* TAB 2: LINKEDIN-STYLE ALUMNI MENTORS DIRECTORY */}
        {activeTab === "alumni" && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-indigo-500" /> Alumni Industry Mentors (LinkedIn-Style Directory)
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {alumniLoading ? (
                <div className="col-span-3 py-8 text-center text-xs text-zinc-500">Loading alumni mentors...</div>
              ) : alumniMentors.length === 0 ? (
                <div className="col-span-3 py-8 text-center text-xs text-zinc-500">No alumni mentors registered yet.</div>
              ) : (
                alumniMentors.map((alumni) => (
                  <Card key={alumni.id} className="space-y-4 flex flex-col justify-between hover:shadow-xl transition-all border-indigo-100 dark:border-indigo-950">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 text-white font-bold text-lg flex items-center justify-center shadow-md">
                          {alumni.full_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                            {alumni.full_name} <UserCheck className="h-4 w-4 text-sky-500" />
                          </h3>
                          <div className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">{alumni.designation}</div>
                          <div className="text-[11px] text-zinc-500">{alumni.current_company}</div>
                        </div>
                      </div>
                      <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-3 italic">
                        "{alumni.bio}"
                      </p>
                    </div>

                    <Button
                      onClick={() => setRequestingAlumni(alumni)}
                      className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold"
                    >
                      <Send className="h-3.5 w-3.5 mr-1.5" /> Request Guidance & Mentorship
                    </Button>
                  </Card>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 3: MENTORSHIP CHAT ROOMS QUEUE */}
        {activeTab === "chats" && (
          <Card className="space-y-4">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-purple-500" /> Your Mentorship Direct Chat Rooms
            </h2>

            <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-zinc-50 dark:bg-zinc-900/50 text-zinc-500 text-xs font-semibold uppercase border-b border-zinc-200 dark:border-zinc-800">
                  <tr>
                    <th className="px-4 py-3">Alumni Mentor</th>
                    <th className="px-4 py-3">Topic</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {sentRequests.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-zinc-500 text-xs">
                        No mentorship requests sent yet. Go to Alumni Directory to request guidance!
                      </td>
                    </tr>
                  ) : (
                    sentRequests.map((req) => (
                      <tr key={req.id}>
                        <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">{req.alumni_name}</td>
                        <td className="px-4 py-3 text-xs">{req.topic}</td>
                        <td className="px-4 py-3 text-xs">
                          <span className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase ${
                            req.status === "accepted" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                          }`}>
                            {req.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {req.status === "accepted" ? (
                            <Button
                              size="sm"
                              onClick={() => setActiveChatRequest(req)}
                              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs h-8"
                            >
                              <MessageSquare className="h-3.5 w-3.5 mr-1" /> Open Live Chat Room ➔
                            </Button>
                          ) : (
                            <span className="text-xs text-zinc-400">Awaiting Alumni Response</span>
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

        {/* REQUEST MENTORSHIP MODAL */}
        {requestingAlumni && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
                <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
                  Request Mentorship from {requestingAlumni.full_name}
                </h3>
                <button onClick={() => setRequestingAlumni(null)} className="text-zinc-500 hover:text-zinc-700">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleMentorshipRequestSubmit} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Mentorship Topic *</label>
                  <input
                    type="text"
                    required
                    placeholder="E.g., IT Industry Placement Advice & Resume Review"
                    value={mentorshipTopic}
                    onChange={(e) => setMentorshipTopic(e.target.value)}
                    className="w-full p-2.5 border border-zinc-300 dark:border-zinc-700 rounded-xl bg-transparent text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Personal Note / Message</label>
                  <textarea
                    rows={3}
                    placeholder="Tell mentor about your background and specific guidance needed..."
                    value={mentorshipNote}
                    onChange={(e) => setMentorshipNote(e.target.value)}
                    className="w-full p-2.5 border border-zinc-300 dark:border-zinc-700 rounded-xl bg-transparent text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" type="button" size="sm" onClick={() => setRequestingAlumni(null)}>
                    Cancel
                  </Button>
                  <Button type="submit" size="sm" isLoading={sendMentorshipRequestMutation.isPending} className="bg-indigo-600 text-white">
                    Send Request & Notify Mentor
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 1-ON-1 REAL-TIME MENTORSHIP CHAT ROOM MODAL */}
        {activeChatRequest && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-2xl w-full h-[80vh] flex flex-col shadow-2xl overflow-hidden relative">
              {/* CHAT HEADER */}
              <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/60 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                    💬 1-on-1 Mentorship Room: {activeChatRequest.topic}
                  </h3>
                  <div className="text-xs text-zinc-500">Mentorship Room Active</div>
                </div>
                <button onClick={() => setActiveChatRequest(null)} className="text-zinc-500 hover:text-zinc-700">
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* CHAT MESSAGES BODY */}
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
                          isMe ? "bg-indigo-600 text-white rounded-br-none" : "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700 rounded-bl-none shadow-sm"
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

              {/* CHAT INPUT FORM */}
              <form onSubmit={handleSendMessage} className="p-3 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center gap-2">
                <input
                  type="text"
                  required
                  placeholder="Type your message..."
                  value={chatInputMessage}
                  onChange={(e) => setChatInputMessage(e.target.value)}
                  className="flex-1 px-4 py-2.5 border border-zinc-300 dark:border-zinc-700 rounded-xl bg-transparent text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <Button type="submit" size="sm" className="bg-indigo-600 text-white px-4">
                  Send <Send className="h-3.5 w-3.5 ml-1.5" />
                </Button>
              </form>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
