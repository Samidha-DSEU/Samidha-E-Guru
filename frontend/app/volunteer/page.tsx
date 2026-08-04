"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { getUserSlug } from "@/lib/userUtils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Upload, Calendar, Clock, ShieldCheck, CheckCircle2, Lock, Plus, FileText, X, MessageSquare, Users, Eye, Ban, Edit, Sparkles, Trash2, ExternalLink, AlertTriangle } from "lucide-react";
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

  // DYNAMIC VOLUNTEER RESOURCE STATS
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

  // MY UPLOADED RESOURCES QUERY
  const { data: myUploadsData, isLoading: myUploadsLoading, refetch: refetchMyUploads } = useQuery({
    queryKey: ["myUploads"],
    queryFn: async () => {
      const res = await apiClient.get<StandardResponse<MyUploadItem[]>>("/resources/my-uploads");
      return res.data;
    },
    enabled: isApproved
  });

  // MY CREATED EVENTS QUERY
  const { data: myEventsData, isLoading: myEventsLoading, refetch: refetchMyEvents } = useQuery({
    queryKey: ["myCreatedEvents"],
    queryFn: async () => {
      const res = await apiClient.get<StandardResponse<MyEventItem[]>>("/events/my-events");
      return res.data;
    },
    enabled: isApproved
  });

  // STUDENT ROSTER QUERY
  const { data: rosterData, isLoading: rosterLoading } = useQuery({
    queryKey: ["eventRoster", viewingRosterEventId],
    queryFn: async () => {
      if (!viewingRosterEventId) return null;
      const res = await apiClient.get<StandardResponse<StudentRosterItem[]>>(`/events/${viewingRosterEventId}/registrations`);
      return res.data;
    },
    enabled: !!viewingRosterEventId
  });

  const uploadResourceMutation = useMutation({
    mutationFn: async (data: typeof resourceData) => {
      const res = await apiClient.post("/resources", data);
      return res.data;
    },
    onSuccess: () => {
      setIsUploadModalOpen(false);
      setResourceData({
        title: "",
        target_class: "Class 9",
        subject_name: "Science",
        resource_category: "Notes",
        external_url: "",
        description: ""
      });
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
      setEventData({
        title: "",
        description: "",
        mode: "online",
        venue: "",
        event_date: "",
        start_time: "5:00 PM",
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

  useEffect(() => {
    if (!volunteerProfile?.expires_at || isApproved) return;

    const calculateTimeLeft = () => {
      const expires = new Date(volunteerProfile.expires_at!).getTime();
      const now = new Date().getTime();
      const diff = expires - now;

      if (diff <= 0) {
        setTimeLeft("0 Hours (Purge Pending)");
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (days > 0) {
        setTimeLeft(`${days}d ${hours}h ${minutes}m remaining`);
      } else {
        setTimeLeft(`${hours}h ${minutes}m remaining`);
      }
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 60000);
    return () => clearInterval(interval);
  }, [volunteerProfile, isApproved]);

  const stats = statsData?.data;
  const myUploads = myUploadsData?.data || [];
  const filteredUploads = myUploads.filter((item) => {
    if (resourceFilter === "approved") return item.verification_status === "approved";
    if (resourceFilter === "pending") return item.verification_status === "pending";
    return true;
  });
  const myEvents = myEventsData?.data || [];
  const rosterStudents = rosterData?.data || [];

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

  return (
    <ProtectedRoute allowedRoles={["volunteer", "admin", "super_admin"]}>
      <div className="space-y-8">
        {/* STATUS BANNER */}
        {!isApproved && (
          <div className="p-5 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 space-y-2 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-sm">
                <Clock className="h-4 w-4 text-amber-600 animate-pulse" />
                <span>Verification Pending</span>
              </div>
              {timeLeft && (
                <span className="px-2.5 py-1 bg-amber-200/60 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 text-xs font-bold rounded-lg border border-amber-300 dark:border-amber-700">
                  ⏳ {timeLeft}
                </span>
              )}
            </div>
            <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
              Your SAMIDHA volunteer application is currently under 3-day verification review by Admins. You have full read-only access to browse your portal. Interactive features (resource uploads & bootcamp creation) will be enabled once approved.
            </p>
          </div>
        )}

        {isApproved && (
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            <div className="text-xs">
              <span className="font-bold text-emerald-900 dark:text-emerald-100">Verified Volunteer Account:</span> You have full creation & upload permissions!
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              Welcome back, {user?.profile?.full_name || "Volunteer"}! 👋
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400 text-sm mt-1">
              Track your uploaded study materials, verification status, and organize student bootcamps.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              disabled={!isApproved}
              onClick={() => setIsEventModalOpen(true)}
              className={!isApproved ? "opacity-60 cursor-not-allowed bg-zinc-400 text-zinc-200" : "bg-indigo-600 hover:bg-indigo-500 text-white"}
            >
              {!isApproved ? <Lock className="h-4 w-4 mr-2" /> : <Calendar className="h-4 w-4 mr-2" />}
              Organize / Manage Events
            </Button>

            <Button
              disabled={!isApproved}
              onClick={() => setIsUploadModalOpen(true)}
              className={!isApproved ? "opacity-60 cursor-not-allowed bg-zinc-400 text-zinc-200" : "bg-emerald-600 hover:bg-emerald-500 text-white"}
            >
              {!isApproved ? <Lock className="h-4 w-4 mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
              Upload New Resource
            </Button>
          </div>
        </div>

        {/* INTERACTIVE CLICKABLE METRIC CARDS (FILTER TABS) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <Card
            onClick={() => setResourceFilter("all")}
            className={`space-y-2 cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-lg ${
              resourceFilter === "all"
                ? "ring-2 ring-sky-500 bg-sky-50/40 dark:bg-sky-950/30 border-sky-300 dark:border-sky-700"
                : "hover:border-zinc-300 dark:hover:border-zinc-700"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">Uploaded Resources</span>
              {resourceFilter === "all" && <span className="px-2 py-0.5 bg-sky-500 text-white text-[10px] font-bold rounded-full">ACTIVE TAB</span>}
            </div>
            <div className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
              {isStatsLoading ? <Skeleton className="h-8 w-16" /> : stats?.total_uploaded ?? 0}
            </div>
            <div className="text-[11px] text-zinc-500">Click to view all uploaded materials</div>
          </Card>

          <Card
            onClick={() => setResourceFilter("approved")}
            className={`space-y-2 cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-lg ${
              resourceFilter === "approved"
                ? "ring-2 ring-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-700"
                : "hover:border-zinc-300 dark:hover:border-zinc-700"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">Approved & Live</span>
              {resourceFilter === "approved" && <span className="px-2 py-0.5 bg-emerald-500 text-white text-[10px] font-bold rounded-full">ACTIVE TAB</span>}
            </div>
            <div className="text-3xl font-bold text-emerald-600">
              {isStatsLoading ? <Skeleton className="h-8 w-16" /> : stats?.approved_and_live ?? 0}
            </div>
            <div className="text-[11px] text-emerald-600 dark:text-emerald-400">Click to filter live published materials</div>
          </Card>

          <Card
            onClick={() => setResourceFilter("pending")}
            className={`space-y-2 cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-lg ${
              resourceFilter === "pending"
                ? "ring-2 ring-amber-500 bg-amber-50/40 dark:bg-amber-950/30 border-amber-300 dark:border-amber-700"
                : "hover:border-zinc-300 dark:hover:border-zinc-700"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">Pending Review</span>
              {resourceFilter === "pending" && <span className="px-2 py-0.5 bg-amber-500 text-white text-[10px] font-bold rounded-full">ACTIVE TAB</span>}
            </div>
            <div className="text-3xl font-bold text-amber-600">
              {isStatsLoading ? <Skeleton className="h-8 w-16" /> : stats?.pending_review ?? 0}
            </div>
            <div className="text-[11px] text-amber-600 dark:text-amber-400">Click to filter items under admin review</div>
          </Card>
        </div>

        {/* MY UPLOADED RESOURCES TRACKING TABLE */}
        <Card className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <FileText className="h-5 w-5 text-emerald-500" /> My Uploaded Educational Resources
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
                      Loading your uploaded resources...
                    </td>
                  </tr>
                ) : filteredUploads.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-zinc-500 text-xs">
                      {resourceFilter === "all"
                        ? 'No study resources uploaded yet. Click "Upload New Resource" to add one!'
                        : `No resources found matching "${resourceFilter.toUpperCase()}" filter.`}
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
                        {res.rejection_reason && (
                          <div className="text-[10px] text-rose-500 italic mt-0.5">Note: {res.rejection_reason}</div>
                        )}
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

        {/* UPLOAD RESOURCE MODAL */}
        {isUploadModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-xl w-full p-6 space-y-5 shadow-2xl relative">
              <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
                <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <Upload className="h-5 w-5 text-emerald-500" /> SAMIDHA Shiksha Library Upload
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
                    placeholder="E.g., Ch-1 Real Numbers Complete Formula Sheet & PYQs"
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

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Description / Topic Summary</label>
                  <textarea
                    rows={2}
                    placeholder="Brief summary of topics covered..."
                    value={resourceData.description}
                    onChange={(e) => setResourceData({ ...resourceData, description: e.target.value })}
                    className="w-full p-3 border border-zinc-300 dark:border-zinc-700 rounded-xl bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <Button variant="outline" type="button" onClick={() => setIsUploadModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" isLoading={uploadResourceMutation.isPending} className="bg-emerald-600 hover:bg-emerald-500 text-white">
                    Submit for Admin Review
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
                  onClick={() => requestDeletionMutation.mutate({ resourceId: deletingResourceId, reason: deletionNote || "Volunteer requested resource removal." })}
                  className="bg-rose-600 hover:bg-rose-500 text-white"
                >
                  Submit Deletion Request
                </Button>
              </div>
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
                    <Calendar className="h-5 w-5 text-indigo-500" /> Volunteer Event Control Center
                  </h3>
                  <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold rounded-full border border-emerald-300">
                    🎁 100% FREE EVENTS BY DEFAULT
                  </span>
                </div>
                <button onClick={() => setIsEventModalOpen(false)} className="text-zinc-500 hover:text-zinc-700">
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* TABS HEADER */}
              <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-2">
                <button
                  onClick={() => setEventTab("manage")}
                  className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                    eventTab === "manage"
                      ? "bg-indigo-600 text-white"
                      : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                  }`}
                >
                  📋 My Organized Events & Rosters ({myEvents.length})
                </button>
                <button
                  onClick={() => setEventTab("create")}
                  className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                    eventTab === "create"
                      ? "bg-indigo-600 text-white"
                      : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                  }`}
                >
                  ➕ Organize New Event
                </button>
              </div>

              {/* TAB 1: MANAGE EVENTS */}
              {eventTab === "manage" && (
                <div className="space-y-4">
                  {myEventsLoading ? (
                    <div className="p-8 text-center text-xs text-zinc-500">Loading your events...</div>
                  ) : myEvents.length === 0 ? (
                    <div className="p-8 text-center text-xs text-zinc-500 space-y-3">
                      <div>No events created yet. Click "Organize New Event" to create your first free bootcamp!</div>
                      <Button size="sm" onClick={() => setEventTab("create")} className="bg-indigo-600 text-white">
                        + Organize New Event
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {myEvents.map((e) => (
                        <div key={e.id} className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">{e.title}</h4>
                              <span className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase ${
                                e.verification_status === "approved"
                                  ? "bg-emerald-100 text-emerald-700"
                                  : e.verification_status === "pending"
                                  ? "bg-amber-100 text-amber-700"
                                  : "bg-rose-100 text-rose-700"
                              }`}>
                                {e.verification_status}
                              </span>
                              {e.event_status === "closed" && (
                                <span className="px-2 py-0.5 bg-zinc-200 text-zinc-700 text-[10px] font-bold rounded">
                                  CLOSED
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-zinc-500">
                              {new Date(e.event_date).toLocaleDateString()} {e.start_time ? `• ${e.start_time}` : ""} • {e.mode.toUpperCase()} ({e.venue})
                            </div>
                            <div className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
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
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: CREATE NEW EVENT */}
              {eventTab === "create" && (
                <form onSubmit={handleEventSubmit} className="space-y-4">
                  {eventError && (
                    <div className="p-3 text-xs bg-rose-50 dark:bg-rose-950 text-rose-600 rounded-xl border border-rose-200">
                      {eventError}
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Bootcamp / Event Title *</label>
                    <input
                      type="text"
                      required
                      placeholder="E.g., Free 3-Day Class 10 Science Revision & Doubt Solver"
                      value={eventData.title}
                      onChange={(e) => setEventData({ ...eventData, title: e.target.value })}
                      className="w-full p-3 border border-zinc-300 dark:border-zinc-700 rounded-xl bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Mode of Class *</label>
                      <select
                        value={eventData.mode}
                        onChange={(e) => setEventData({ ...eventData, mode: e.target.value })}
                        className="w-full p-2.5 border border-zinc-300 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-800 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="online">🌐 Online (Google Meet / Zoom)</option>
                        <option value="offline">🏫 Offline (Physical Location)</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Venue / Meeting Link *</label>
                      <input
                        type="text"
                        required
                        placeholder={eventData.mode === "online" ? "https://meet.google.com/..." : "Campus Auditorium, Block A"}
                        value={eventData.venue}
                        onChange={(e) => setEventData({ ...eventData, venue: e.target.value })}
                        className="w-full p-2.5 border border-zinc-300 dark:border-zinc-700 rounded-xl bg-transparent text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Start Date *</label>
                      <input
                        type="date"
                        required
                        value={eventData.event_date}
                        onChange={(e) => setEventData({ ...eventData, event_date: e.target.value })}
                        className="w-full p-2.5 border border-zinc-300 dark:border-zinc-700 rounded-xl bg-transparent text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Class Timing *</label>
                      <input
                        type="text"
                        placeholder="E.g., 5:00 PM - 6:30 PM IST"
                        value={eventData.start_time}
                        onChange={(e) => setEventData({ ...eventData, start_time: e.target.value })}
                        className="w-full p-2.5 border border-zinc-300 dark:border-zinc-700 rounded-xl bg-transparent text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">WhatsApp Group Link (For Student Updates) *</label>
                    <input
                      type="url"
                      required
                      placeholder="https://chat.whatsapp.com/..."
                      value={eventData.whatsapp_group_url}
                      onChange={(e) => setEventData({ ...eventData, whatsapp_group_url: e.target.value })}
                      className="w-full p-3 border border-zinc-300 dark:border-zinc-700 rounded-xl bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Bootcamp Description & Schedule *</label>
                    <textarea
                      rows={3}
                      required
                      placeholder="Detailed topics covered..."
                      value={eventData.description}
                      onChange={(e) => setEventData({ ...eventData, description: e.target.value })}
                      className="w-full p-3 border border-zinc-300 dark:border-zinc-700 rounded-xl bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <Button variant="outline" type="button" onClick={() => setEventTab("manage")}>
                      Cancel
                    </Button>
                    <Button type="submit" isLoading={createEventMutation.isPending} className="bg-indigo-600 hover:bg-indigo-500 text-white">
                      Submit Event for Admin Review
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* STUDENT ROSTER INSPECTION MODAL */}
        {viewingRosterEventId && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl relative max-h-[85vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
                <div>
                  <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                    <Users className="h-5 w-5 text-sky-500" /> Registered Student Roster
                  </h3>
                  <div className="text-xs text-zinc-500">{viewingRosterEventTitle}</div>
                </div>
                <button onClick={() => setViewingRosterEventId(null)} className="text-zinc-500 hover:text-zinc-700">
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
                    {rosterLoading ? (
                      <tr>
                        <td colSpan={5} className="px-3 py-6 text-center text-zinc-500">
                          Loading student roster...
                        </td>
                      </tr>
                    ) : rosterStudents.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-3 py-6 text-center text-zinc-500">
                          No students registered yet for this event.
                        </td>
                      </tr>
                    ) : (
                      rosterStudents.map((st) => (
                        <tr key={st.id}>
                          <td className="px-3 py-2.5 font-bold text-zinc-900 dark:text-zinc-100">{st.full_name}</td>
                          <td className="px-3 py-2.5 text-zinc-600 dark:text-zinc-400">{st.class_or_college}</td>
                          <td className="px-3 py-2.5 text-indigo-600 font-semibold">{st.mobile_number}</td>
                          <td className="px-3 py-2.5 text-zinc-500">{st.address}</td>
                          <td className="px-3 py-2.5 text-zinc-400">{new Date(st.registered_at).toLocaleDateString()}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end pt-2">
                <Button variant="outline" size="sm" onClick={() => setViewingRosterEventId(null)}>
                  Close Roster
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
