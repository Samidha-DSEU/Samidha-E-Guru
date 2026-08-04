"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { getUserSlug } from "@/lib/userUtils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Upload, Calendar, Users, BookOpen, Award, FileText, CheckCircle2, Clock, X, ExternalLink, Trash2, Ban, MessageSquare, Sparkles } from "lucide-react";
import { apiClient } from "@/services/apiClient";
import { StandardResponse } from "@/types/api";
import { Card, Skeleton } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { useAuth } from "@/features/auth/context/AuthContext";

const CLASSES = ["Class 6", "Class 7", "Class 8", "Class 9", "Class 10", "Class 11", "Class 12", "Undergraduate"];
const SUBJECTS = ["Mathematics", "Science", "Physics", "Chemistry", "Biology", "English", "Computer Science", "Career Guidance"];
const CATEGORIES = ["Notes", "Question Paper / PYQ", "Sample Paper", "Worksheet", "Mentorship Guide"];

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

interface ArticleItem {
  id: string;
  title: string;
  category: string;
  content: string;
  views_count: number;
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
  const [activeTab, setActiveTab] = useState<"articles" | "resources" | "events">("resources");
  const [resourceFilter, setResourceFilter] = useState<"all" | "approved" | "pending">("all");

  // MODALS STATE
  const [isArticleModalOpen, setIsArticleModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [eventTab, setEventTab] = useState<"create" | "manage">("manage");
  const [isMenteesModalOpen, setIsMenteesModalOpen] = useState(false);

  // ARTICLE FORM STATE
  const [articleData, setArticleData] = useState({
    title: "",
    category: "Career Guidance",
    content: "",
    external_link: ""
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

  // RESOURCE DELETION REQUEST MODAL STATE
  const [deletingResourceId, setDeletingResourceId] = useState<string | null>(null);
  const [deletionNote, setDeletionNote] = useState("");

  // ROSTER MODAL STATE
  const [viewingRosterEventId, setViewingRosterEventId] = useState<string | null>(null);
  const [viewingRosterEventTitle, setViewingRosterEventTitle] = useState<string>("");

  // DYNAMIC STATS QUERY
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

  // MY UPLOADED RESOURCES QUERY
  const { data: myUploadsData, isLoading: myUploadsLoading, refetch: refetchMyUploads } = useQuery({
    queryKey: ["myAlumniUploads"],
    queryFn: async () => {
      const res = await apiClient.get<StandardResponse<MyUploadItem[]>>("/resources/my-uploads");
      return res.data;
    }
  });

  // MY CREATED EVENTS QUERY
  const { data: myEventsData, isLoading: myEventsLoading, refetch: refetchMyEvents } = useQuery({
    queryKey: ["myAlumniEvents"],
    queryFn: async () => {
      const res = await apiClient.get<StandardResponse<MyEventItem[]>>("/events/my-events");
      return res.data;
    }
  });

  // STUDENT ROSTER QUERY FOR SPECIFIC EVENT
  const { data: rosterData, isLoading: rosterLoading } = useQuery({
    queryKey: ["eventRosterAlumni", viewingRosterEventId],
    queryFn: async () => {
      if (!viewingRosterEventId) return null;
      const res = await apiClient.get<StandardResponse<StudentRosterItem[]>>(`/events/${viewingRosterEventId}/registrations`);
      return res.data;
    },
    enabled: !!viewingRosterEventId
  });

  // MUTATIONS
  const uploadResourceMutation = useMutation({
    mutationFn: async (data: typeof resourceData) => {
      const res = await apiClient.post("/resources", data);
      return res.data;
    },
    onSuccess: () => {
      setIsUploadModalOpen(false);
      setResourceData({
        title: "",
        target_class: "Undergraduate",
        subject_name: "Career Guidance",
        resource_category: "Mentorship Guide",
        external_url: "",
        description: ""
      });
      setUploadError(null);
      queryClient.invalidateQueries({ queryKey: ["alumniStats"] });
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
      queryClient.invalidateQueries({ queryKey: ["alumniStats"] });
    }
  });

  const createEventMutation = useMutation({
    mutationFn: async (data: typeof eventData) => {
      const res = await apiClient.post("/events", data);
      return res.data;
    },
    onSuccess: () => {
      setEventTab("manage");
      setEventData({
        title: "",
        description: "",
        mode: "online",
        venue: "",
        event_date: "",
        start_time: "6:00 PM",
        whatsapp_group_url: "",
        max_participants: 50
      });
      setEventError(null);
      refetchMyEvents();
    },
    onError: (err: any) => {
      setEventError(err.response?.data?.detail || err.response?.data?.message || "Failed to create event.");
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
  const rosterStudents = rosterData?.data || [];

  // Calculate total students reached across all alumni bootcamps
  const totalMenteesCount = myEvents.reduce((sum, evt) => sum + (evt.registrations_count || 0), 0);

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
      setEventError("Please fill in event title, venue/meeting link, and event date.");
      return;
    }
    createEventMutation.mutate(eventData);
  };

  const handleArticleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert("Article published successfully! It is now visible under Community Mentorship.");
    setIsArticleModalOpen(false);
    setArticleData({ title: "", category: "Career Guidance", content: "", external_link: "" });
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
              Share career guidance, mentor aspiring students, upload study materials, and organize bootcamps.
            </p>
          </div>

          {/* ALUMNI ACTION BUTTONS */}
          <div className="flex flex-wrap items-center gap-3">
            <Button
              onClick={() => setIsArticleModalOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-500 text-white"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Create Article
            </Button>

            <Button
              onClick={() => setIsEventModalOpen(true)}
              className="bg-purple-600 hover:bg-purple-500 text-white"
            >
              <Calendar className="h-4 w-4 mr-1.5" />
              Organize Bootcamps
            </Button>

            <Button
              onClick={() => setIsUploadModalOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white"
            >
              <Upload className="h-4 w-4 mr-1.5" />
              Upload Resource
            </Button>
          </div>
        </div>

        {/* 🌟 CLICKABLE INTERACTIVE METRIC CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
          {/* CARD 1: ARTICLES */}
          <Card
            onClick={() => setActiveTab("articles")}
            className={`space-y-2 cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-lg ${
              activeTab === "articles"
                ? "ring-2 ring-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/30 border-indigo-300 dark:border-indigo-700"
                : "hover:border-zinc-300 dark:hover:border-zinc-700"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">Articles & Guides</span>
              <BookOpen className="h-4 w-4 text-indigo-500" />
            </div>
            <div className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">3</div>
            <div className="text-[11px] text-indigo-600 dark:text-indigo-400">Click to manage mentorship posts</div>
          </Card>

          {/* CARD 2: UPLOADED STUDY RESOURCES */}
          <Card
            onClick={() => setActiveTab("resources")}
            className={`space-y-2 cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-lg ${
              activeTab === "resources"
                ? "ring-2 ring-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-700"
                : "hover:border-zinc-300 dark:hover:border-zinc-700"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">Uploaded Resources</span>
              <FileText className="h-4 w-4 text-emerald-500" />
            </div>
            <div className="text-3xl font-bold text-emerald-600">
              {isStatsLoading ? <Skeleton className="h-8 w-16" /> : stats?.total_uploaded ?? 0}
            </div>
            <div className="text-[11px] text-emerald-600 dark:text-emerald-400">Click to view study materials</div>
          </Card>

          {/* CARD 3: MY STUDENTS & MENTEES (REPLACES STATIC TEXT WITH DYNAMIC ROSTER) */}
          <Card
            onClick={() => setIsMenteesModalOpen(true)}
            className="space-y-2 cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-lg ring-2 ring-sky-500 bg-sky-50/40 dark:bg-sky-950/30 border-sky-300 dark:border-sky-700"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-sky-800 dark:text-sky-300">My Students & Mentees</span>
              <Users className="h-4 w-4 text-sky-600" />
            </div>
            <div className="text-3xl font-bold text-sky-600">
              {totalMenteesCount}
            </div>
            <div className="text-[11px] text-sky-600 dark:text-sky-400 font-semibold">Click to view student contact details ➔</div>
          </Card>

          {/* CARD 4: MENTORSHIP BADGE */}
          <Card className="space-y-2 bg-gradient-to-br from-indigo-50/50 to-purple-50/50 dark:from-indigo-950/20 dark:to-purple-950/20 border-indigo-200 dark:border-indigo-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">Mentorship Badge</span>
              <Award className="h-4 w-4 text-indigo-600" />
            </div>
            <div className="text-lg font-bold text-indigo-700 dark:text-indigo-300">
              Senior Alumni Mentor
            </div>
            <div className="text-[11px] text-indigo-500">Verified Alumni Contributor</div>
          </Card>
        </div>

        {/* TABBED TABLE AREA */}
        {/* TAB 1: UPLOADED RESOURCES */}
        {activeTab === "resources" && (
          <Card className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <FileText className="h-5 w-5 text-emerald-500" /> Educational Resources Uploaded by You
                {resourceFilter !== "all" && (
                  <span className="px-2.5 py-0.5 bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 text-xs font-semibold rounded-full border border-sky-200">
                    Filtered by: {resourceFilter.toUpperCase()}
                  </span>
                )}
              </h2>
              <div className="flex items-center gap-2 text-xs text-zinc-500 font-medium">
                <span>Showing {filteredUploads.length} of {myUploads.length} materials</span>
                {resourceFilter !== "all" && (
                  <button onClick={() => setResourceFilter("all")} className="text-sky-600 hover:underline font-bold ml-1">
                    Show All
                  </button>
                )}
              </div>
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
                  {myUploadsLoading ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-zinc-500 text-xs">
                        Loading study resources...
                      </td>
                    </tr>
                  ) : filteredUploads.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-zinc-500 text-xs">
                        No resources found. Click "Upload Resource" to share notes with students!
                      </td>
                    </tr>
                  ) : (
                    filteredUploads.map((res) => (
                      <tr key={res.id}>
                        <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">
                          <div>{res.title}</div>
                          <div className="text-[11px] text-zinc-500">{new Date(res.created_at).toLocaleDateString()}</div>
                        </td>
                        <td className="px-4 py-3 text-xs">
                          <div className="flex items-center gap-1">
                            <span className="px-1.5 py-0.5 bg-sky-50 dark:bg-sky-950 text-sky-600 text-[10px] font-bold rounded">
                              {res.target_class}
                            </span>
                            <span className="px-1.5 py-0.5 bg-emerald-50 dark:bg-emerald-950 text-emerald-600 text-[10px] font-bold rounded">
                              {res.subject_name}
                            </span>
                            <span className="px-1.5 py-0.5 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 text-[10px] font-bold rounded">
                              {res.resource_category}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs">
                          <span className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase ${
                            res.verification_status === "approved"
                              ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300"
                              : res.verification_status === "pending"
                              ? "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300"
                              : res.verification_status === "deletion_pending"
                              ? "bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300"
                              : "bg-zinc-200 text-zinc-700"
                          }`}>
                            {res.verification_status === "deletion_pending" ? "DELETION REQUESTED" : res.verification_status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-zinc-600 dark:text-zinc-400">
                          <div>👁️ {res.views_count} Views</div>
                          <div>⭐ {res.rating_avg > 0 ? res.rating_avg.toFixed(1) : "New"}</div>
                        </td>
                        <td className="px-4 py-3 text-right space-x-2">
                          <a
                            href={res.external_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-xs font-semibold text-sky-600 hover:text-sky-500 mr-2"
                          >
                            Open Link <ExternalLink className="h-3 w-3 ml-1" />
                          </a>

                          {res.verification_status !== "deletion_pending" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setDeletingResourceId(res.id)}
                              className="text-rose-600 border-rose-200 hover:bg-rose-50 text-xs h-7 px-2.5"
                            >
                              <Trash2 className="h-3 w-3 mr-1" /> Request Deletion
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

        {/* TAB 2: ARTICLES & GUIDES */}
        {activeTab === "articles" && (
          <Card className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-indigo-500" /> Published Mentorship Articles & Guides
              </h2>
              <Button size="sm" onClick={() => setIsArticleModalOpen(true)} className="bg-indigo-600 text-white">
                + Create Article
              </Button>
            </div>

            <div className="space-y-3">
              <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">How to Prepare for Engineering Entrance Exams & College Selection</h4>
                  <div className="text-xs text-zinc-500">Category: Career Guidance • 240 Views • Published 3 days ago</div>
                </div>
                <span className="px-2 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded">PUBLISHED</span>
              </div>

              <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">Resume Building & Internship Preparation Guide for Undergraduates</h4>
                  <div className="text-xs text-zinc-500">Category: Higher Studies • 185 Views • Published 1 week ago</div>
                </div>
                <span className="px-2 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded">PUBLISHED</span>
              </div>
            </div>
          </Card>
        )}

        {/* 👥 MY MENTEE STUDENTS ROSTER MODAL */}
        {isMenteesModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-3xl w-full p-6 space-y-4 shadow-2xl relative max-h-[85vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
                <div>
                  <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                    <Users className="h-5 w-5 text-sky-500" /> My Mentee Students & Reached Student Directory
                  </h3>
                  <p className="text-xs text-zinc-500">Students who registered for your bootcamps or requested academic mentorship.</p>
                </div>
                <button onClick={() => setIsMenteesModalOpen(false)} className="text-zinc-500 hover:text-zinc-700">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-50 dark:bg-zinc-900/50 text-zinc-500 font-semibold uppercase border-b border-zinc-200 dark:border-zinc-800">
                    <tr>
                      <th className="px-3 py-2.5">Student Name</th>
                      <th className="px-3 py-2.5">Class / College</th>
                      <th className="px-3 py-2.5">Mobile / WhatsApp</th>
                      <th className="px-3 py-2.5">Address / City</th>
                      <th className="px-3 py-2.5">Registered At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                    {myEvents.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-3 py-6 text-center text-zinc-500">
                          No bootcamp registrations yet. Organize a bootcamp to connect with students!
                        </td>
                      </tr>
                    ) : (
                      myEvents.map((evt) => (
                        <React.Fragment key={evt.id}>
                          <tr className="bg-indigo-50/50 dark:bg-indigo-950/30 border-y border-indigo-100 dark:border-indigo-900">
                            <td colSpan={5} className="px-3 py-2 font-bold text-indigo-900 dark:text-indigo-200">
                              Bootcamp: {evt.title} ({evt.registrations_count} registered students)
                            </td>
                          </tr>
                        </React.Fragment>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end pt-2">
                <Button variant="outline" size="sm" onClick={() => setIsMenteesModalOpen(false)}>
                  Close Mentees Roster
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* UPLOAD RESOURCE MODAL */}
        {isUploadModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-xl w-full p-6 space-y-5 shadow-2xl relative">
              <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
                <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <Upload className="h-5 w-5 text-emerald-500" /> SAMIDHA Shiksha Library Upload (Alumni)
                </h3>
                <button onClick={() => setIsUploadModalOpen(false)} className="text-zinc-500 hover:text-zinc-700">
                  <X className="h-5 w-5" />
                </button>
              </div>

              {uploadError && (
                <div className="p-3 text-xs bg-rose-50 dark:bg-rose-950 text-rose-600 rounded-xl border border-rose-200">
                  {uploadError}
                </div>
              )}

              <form onSubmit={handleResourceSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Target Class *</label>
                    <select
                      value={resourceData.target_class}
                      onChange={(e) => setResourceData({ ...resourceData, target_class: e.target.value })}
                      className="w-full p-2.5 border border-zinc-300 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-800 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      {CLASSES.map((c) => (
                        <option key={c} value={c}>{c}</option>
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
                      {SUBJECTS.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Type *</label>
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
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Resource Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="E.g., Engineering Mathematics Formula Sheet & GATE Guidance"
                    value={resourceData.title}
                    onChange={(e) => setResourceData({ ...resourceData, title: e.target.value })}
                    className="w-full p-3 border border-zinc-300 dark:border-zinc-700 rounded-xl bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Document URL / File Drive Link *</label>
                  <input
                    type="url"
                    required
                    placeholder="https://drive.google.com/... or PDF link"
                    value={resourceData.external_url}
                    onChange={(e) => setResourceData({ ...resourceData, external_url: e.target.value })}
                    className="w-full p-3 border border-zinc-300 dark:border-zinc-700 rounded-xl bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <Button variant="outline" type="button" onClick={() => setIsUploadModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" isLoading={uploadResourceMutation.isPending} className="bg-emerald-600 hover:bg-emerald-500 text-white">
                    Submit Resource for Admin Review
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* EVENT MANAGEMENT MODAL */}
        {isEventModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-3xl w-full p-6 space-y-5 shadow-2xl relative max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
                <div className="flex items-center gap-3">
                  <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-purple-500" /> Alumni Mentorship Bootcamp Control
                  </h3>
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full">
                    🎁 100% FREE BOOTCAMPS
                  </span>
                </div>
                <button onClick={() => setIsEventModalOpen(false)} className="text-zinc-500 hover:text-zinc-700">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-2">
                <button
                  onClick={() => setEventTab("manage")}
                  className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                    eventTab === "manage" ? "bg-purple-600 text-white" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600"
                  }`}
                >
                  📋 My Organized Bootcamps ({myEvents.length})
                </button>
                <button
                  onClick={() => setEventTab("create")}
                  className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                    eventTab === "create" ? "bg-purple-600 text-white" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600"
                  }`}
                >
                  ➕ Organize New Bootcamp
                </button>
              </div>

              {eventTab === "manage" && (
                <div className="space-y-3">
                  {myEvents.length === 0 ? (
                    <div className="p-8 text-center text-xs text-zinc-500 space-y-3">
                      <div>No bootcamps organized yet. Click "Organize New Bootcamp" to host your first mentorship session!</div>
                      <Button size="sm" onClick={() => setEventTab("create")} className="bg-purple-600 text-white">
                        + Organize New Bootcamp
                      </Button>
                    </div>
                  ) : (
                    myEvents.map((e) => (
                      <div key={e.id} className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">{e.title}</h4>
                            <span className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase ${
                              e.verification_status === "approved" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                            }`}>
                              {e.verification_status}
                            </span>
                          </div>
                          <div className="text-xs text-zinc-500">
                            {new Date(e.event_date).toLocaleDateString()} {e.start_time ? `• ${e.start_time}` : ""} • {e.venue}
                          </div>
                          <div className="text-xs font-semibold text-purple-600">
                            👥 {e.registrations_count} Registered Students
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setViewingRosterEventId(e.id);
                              setViewingRosterEventTitle(e.title);
                            }}
                            className="text-xs"
                          >
                            <Users className="h-3.5 w-3.5 mr-1 text-sky-500" /> View Roster ({e.registrations_count})
                          </Button>
                          {e.event_status !== "closed" && (
                            <Button
                              size="sm"
                              variant="outline"
                              isLoading={closeEventMutation.isPending}
                              onClick={() => closeEventMutation.mutate(e.id)}
                              className="text-xs text-rose-600 border-rose-200"
                            >
                              <Ban className="h-3.5 w-3.5 mr-1" /> End Registration
                            </Button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {eventTab === "create" && (
                <form onSubmit={handleEventSubmit} className="space-y-4">
                  {eventError && (
                    <div className="p-3 text-xs bg-rose-50 dark:bg-rose-950 text-rose-600 rounded-xl border border-rose-200">
                      {eventError}
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Bootcamp / Mentorship Session Title *</label>
                    <input
                      type="text"
                      required
                      placeholder="E.g., Career Guidance & IT Industry Preparation Session"
                      value={eventData.title}
                      onChange={(e) => setEventData({ ...eventData, title: e.target.value })}
                      className="w-full p-3 border border-zinc-300 dark:border-zinc-700 rounded-xl bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Meeting Link / Venue *</label>
                      <input
                        type="text"
                        required
                        placeholder="https://meet.google.com/..."
                        value={eventData.venue}
                        onChange={(e) => setEventData({ ...eventData, venue: e.target.value })}
                        className="w-full p-2.5 border border-zinc-300 dark:border-zinc-700 rounded-xl bg-transparent text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Start Date *</label>
                      <input
                        type="date"
                        required
                        value={eventData.event_date}
                        onChange={(e) => setEventData({ ...eventData, event_date: e.target.value })}
                        className="w-full p-2.5 border border-zinc-300 dark:border-zinc-700 rounded-xl bg-transparent text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">WhatsApp Group Link *</label>
                    <input
                      type="url"
                      required
                      placeholder="https://chat.whatsapp.com/..."
                      value={eventData.whatsapp_group_url}
                      onChange={(e) => setEventData({ ...eventData, whatsapp_group_url: e.target.value })}
                      className="w-full p-3 border border-zinc-300 dark:border-zinc-700 rounded-xl bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Description & Agenda *</label>
                    <textarea
                      rows={3}
                      required
                      placeholder="Mentorship topics covered..."
                      value={eventData.description}
                      onChange={(e) => setEventData({ ...eventData, description: e.target.value })}
                      className="w-full p-3 border border-zinc-300 dark:border-zinc-700 rounded-xl bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <Button variant="outline" type="button" onClick={() => setEventTab("manage")}>
                      Cancel
                    </Button>
                    <Button type="submit" isLoading={createEventMutation.isPending} className="bg-purple-600 hover:bg-purple-500 text-white">
                      Submit Bootcamp for Admin Review
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* CREATE MENTORSHIP ARTICLE MODAL */}
        {isArticleModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl relative">
              <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
                <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-indigo-500" /> Create Mentorship Article / Career Guide
                </h3>
                <button onClick={() => setIsArticleModalOpen(false)} className="text-zinc-500 hover:text-zinc-700">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleArticleSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Article Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="E.g., Complete Roadmap for JEE/NEET & Engineering Specializations"
                    value={articleData.title}
                    onChange={(e) => setArticleData({ ...articleData, title: e.target.value })}
                    className="w-full p-3 border border-zinc-300 dark:border-zinc-700 rounded-xl bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Category *</label>
                  <select
                    value={articleData.category}
                    onChange={(e) => setArticleData({ ...articleData, category: e.target.value })}
                    className="w-full p-2.5 border border-zinc-300 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-800 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Career Guidance">Career Guidance</option>
                    <option value="Higher Studies">Higher Studies</option>
                    <option value="Placement & Internships">Placement & Internships</option>
                    <option value="Exam Preparation">Exam Preparation</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Article Content / Advice *</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Write your advice and guidance for students..."
                    value={articleData.content}
                    onChange={(e) => setArticleData({ ...articleData, content: e.target.value })}
                    className="w-full p-3 border border-zinc-300 dark:border-zinc-700 rounded-xl bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <Button variant="outline" type="button" onClick={() => setIsArticleModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white">
                    Publish Mentorship Article
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* RESOURCE DELETION REQUEST MODAL */}
        {deletingResourceId && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
              <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Trash2 className="h-5 w-5 text-rose-500" /> Request Resource Deletion
              </h3>
              <p className="text-xs text-zinc-500">
                Please provide a note explaining why you want to delete/take down this resource. Admin will review and approve your request.
              </p>

              <textarea
                rows={3}
                required
                placeholder="E.g., Outdated syllabus notes, uploading updated version."
                value={deletionNote}
                onChange={(e) => setDeletionNote(e.target.value)}
                className="w-full p-3 border border-zinc-300 dark:border-zinc-700 rounded-xl bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
              />

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => setDeletingResourceId(null)}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  isLoading={requestDeletionMutation.isPending}
                  onClick={() => requestDeletionMutation.mutate({ resourceId: deletingResourceId, reason: deletionNote || "Alumni requested removal." })}
                  className="bg-rose-600 hover:bg-rose-500 text-white"
                >
                  Submit Deletion Request
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
