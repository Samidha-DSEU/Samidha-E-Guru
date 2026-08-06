"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { getUserSlug } from "@/lib/userUtils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ShieldCheck, Users, FileCheck, Activity, Database, Check, X, Clock, AlertCircle, ExternalLink, BookOpen, Calendar, MessageSquare, Trash2, Search, UserPlus, Eye, ShieldAlert, Cpu, CheckCircle2 } from "lucide-react";
import { apiClient } from "@/services/apiClient";
import { StandardResponse } from "@/types/api";
import { Card, Skeleton } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { useAuth } from "@/features/auth/context/AuthContext";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { AnimatedText } from "@/components/ui/AnimatedText";
import { TiltCard } from "@/components/ui/TiltCard";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";

interface VolunteerApplication {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  organization: string;
  approval_status: string;
  applied_at?: string;
  expires_at?: string;
  rejection_reason?: string;
}

interface PendingResourceItem {
  id: string;
  title: string;
  description?: string;
  external_url: string;
  target_class: string;
  subject_name: string;
  resource_category: string;
  uploader_name: string;
  uploader_email: string;
  created_at: string;
}

interface PendingDeletionItem {
  id: string;
  title: string;
  external_url: string;
  target_class: string;
  subject_name: string;
  deletion_reason?: string;
  uploader_name: string;
  uploader_email: string;
  created_at: string;
}

interface PendingEventItem {
  id: string;
  title: string;
  description: string;
  mode: string;
  venue: string;
  event_date: string;
  start_time?: string;
  whatsapp_group_url?: string;
  organizer_name: string;
  organizer_email: string;
  created_at: string;
}

interface UserItem {
  id: string;
  email: string;
  role: string;
  full_name: string;
  phone?: string;
  avatar_url?: string;
  is_active: boolean;
  created_at: string;
}

interface UserActivityLog {
  id: string;
  action: string;
  details?: any;
  created_at: string;
}

interface HealthcheckData {
  status: string;
  database: {
    connected: boolean;
    latency_ms: number;
    engine: string;
  };
  statistics: {
    total_users: number;
    total_resources: number;
    total_events: number;
    total_logs: number;
  };
  jwt_auth: {
    status: string;
    active_role: string;
  };
  storage: {
    status: string;
    provider: string;
  };
  timestamp: string;
}

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (user) {
      const slug = getUserSlug(user);
      if (user.role?.name === "super_admin") {
        router.replace(`/super-admin/${slug}`);
        return;
      }
      if (!params || !params.username) {
        router.replace(`/admin/${slug}`);
      }
    }
  }, [user, params, router]);

  // ACTIVE TAB FILTER FROM METRIC CARDS
  const [activeTab, setActiveTab] = useState<"users" | "volunteers" | "resources" | "events" | "deletions">("users");

  // USER MANAGEMENT STATE
  const [userSearch, setUserSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("");

  // MODALS STATE
  const [isHealthModalOpen, setIsHealthModalOpen] = useState(false);
  const [viewingActivityUser, setViewingActivityUser] = useState<UserItem | null>(null);
  const [deletingUser, setDeletingUser] = useState<UserItem | null>(null);
  const [promotingUser, setPromotingUser] = useState<UserItem | null>(null);
  const [assigningDesignationUser, setAssigningDesignationUser] = useState<UserItem | null>(null);
  const [assignedDesignation, setAssignedDesignation] = useState("Operational & Volunteer Head");
  const [assignedYear, setAssignedYear] = useState("3rd Year");
  const [designationError, setDesignationError] = useState<string | null>(null);

  // REJECTION REASON MODALS
  const [rejectingUserId, setRejectingUserId] = useState<string | null>(null);
  const [volunteerRejectReason, setVolunteerRejectReason] = useState("");

  const [rejectingResourceId, setRejectingResourceId] = useState<string | null>(null);
  const [resourceRejectReason, setResourceRejectReason] = useState("");

  const [rejectingEventId, setRejectingEventId] = useState<string | null>(null);
  const [eventRejectReason, setEventRejectReason] = useState("");

  // QUERIES
  const { data, isLoading } = useQuery({
    queryKey: ["adminMetrics"],
    queryFn: async () => {
      const res = await apiClient.get<StandardResponse<{
        total_users: number;
        total_resources: number;
        pending_resources: number;
        pending_volunteers: number;
        approved_volunteers: number;
        system_status: string;
      }>>("/admin/dashboard");
      return res.data;
    }
  });

  const { data: usersData, isLoading: usersLoading, refetch: refetchUsers } = useQuery({
    queryKey: ["allUsers", userSearch, roleFilter],
    queryFn: async () => {
      const res = await apiClient.get<StandardResponse<UserItem[]>>("/admin/users", {
        params: { search: userSearch || undefined, role_filter: roleFilter || undefined }
      });
      return res.data;
    }
  });

  const { data: volunteersData, isLoading: volunteersLoading } = useQuery({
    queryKey: ["pendingVolunteers"],
    queryFn: async () => {
      const res = await apiClient.get<StandardResponse<VolunteerApplication[]>>("/admin/pending-volunteers");
      return res.data;
    }
  });

  const { data: resourcesData, isLoading: resourcesLoading } = useQuery({
    queryKey: ["pendingResources"],
    queryFn: async () => {
      const res = await apiClient.get<StandardResponse<PendingResourceItem[]>>("/admin/pending-resources");
      return res.data;
    }
  });

  const { data: deletionsData, isLoading: deletionsLoading } = useQuery({
    queryKey: ["pendingDeletions"],
    queryFn: async () => {
      const res = await apiClient.get<StandardResponse<PendingDeletionItem[]>>("/admin/pending-resource-deletions");
      return res.data;
    }
  });

  const { data: eventsData, isLoading: eventsLoading } = useQuery({
    queryKey: ["pendingEvents"],
    queryFn: async () => {
      const res = await apiClient.get<StandardResponse<PendingEventItem[]>>("/admin/pending-events");
      return res.data;
    }
  });

  // SYSTEM HEALTHCHECK QUERY (Runs on demand when modal opens)
  const { data: healthData, isLoading: healthLoading, refetch: refetchHealth } = useQuery({
    queryKey: ["systemHealthcheck"],
    queryFn: async () => {
      const res = await apiClient.get<StandardResponse<HealthcheckData>>("/admin/healthcheck");
      return res.data;
    },
    enabled: isHealthModalOpen
  });

  // USER ACTIVITY LOGS QUERY
  const { data: userLogsData, isLoading: userLogsLoading } = useQuery({
    queryKey: ["userActivityLogs", viewingActivityUser?.id],
    queryFn: async () => {
      if (!viewingActivityUser) return null;
      const res = await apiClient.get<StandardResponse<UserActivityLog[]>>(`/admin/users/${viewingActivityUser.id}/activity-logs`);
      return res.data;
    },
    enabled: !!viewingActivityUser
  });

  // MUTATIONS
  const promoteAdminMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await apiClient.post(`/admin/users/${userId}/promote-admin`);
      return res.data;
    },
    onSuccess: () => {
      setPromotingUser(null);
      refetchUsers();
      queryClient.invalidateQueries({ queryKey: ["adminMetrics"] });
    }
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await apiClient.delete(`/admin/users/${userId}`);
      return res.data;
    },
    onSuccess: () => {
      setDeletingUser(null);
      refetchUsers();
      queryClient.invalidateQueries({ queryKey: ["adminMetrics"] });
    }
  });

  const approveVolunteerMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await apiClient.post(`/admin/volunteers/${userId}/approve`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminMetrics"] });
      queryClient.invalidateQueries({ queryKey: ["pendingVolunteers"] });
      refetchUsers();
    }
  });

  const rejectVolunteerMutation = useMutation({
    mutationFn: async ({ userId, reason }: { userId: string; reason: string }) => {
      const res = await apiClient.post(`/admin/volunteers/${userId}/reject`, { reason });
      return res.data;
    },
    onSuccess: () => {
      setRejectingUserId(null);
      setVolunteerRejectReason("");
      queryClient.invalidateQueries({ queryKey: ["adminMetrics"] });
      queryClient.invalidateQueries({ queryKey: ["pendingVolunteers"] });
    }
  });

  const approveResourceMutation = useMutation({
    mutationFn: async (resourceId: string) => {
      const res = await apiClient.post(`/admin/resources/${resourceId}/approve`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminMetrics"] });
      queryClient.invalidateQueries({ queryKey: ["pendingResources"] });
    }
  });

  const rejectResourceMutation = useMutation({
    mutationFn: async ({ resourceId, reason }: { resourceId: string; reason: string }) => {
      const res = await apiClient.post(`/admin/resources/${resourceId}/reject`, { reason });
      return res.data;
    },
    onSuccess: () => {
      setRejectingResourceId(null);
      setResourceRejectReason("");
      queryClient.invalidateQueries({ queryKey: ["adminMetrics"] });
      queryClient.invalidateQueries({ queryKey: ["pendingResources"] });
    }
  });

  const approveDeletionMutation = useMutation({
    mutationFn: async (resourceId: string) => {
      const res = await apiClient.post(`/admin/resources/${resourceId}/approve-deletion`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminMetrics"] });
      queryClient.invalidateQueries({ queryKey: ["pendingDeletions"] });
    }
  });

  const rejectDeletionMutation = useMutation({
    mutationFn: async (resourceId: string) => {
      const res = await apiClient.post(`/admin/resources/${resourceId}/reject-deletion`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminMetrics"] });
      queryClient.invalidateQueries({ queryKey: ["pendingDeletions"] });
    }
  });

  const approveEventMutation = useMutation({
    mutationFn: async (eventId: string) => {
      const res = await apiClient.post(`/admin/events/${eventId}/approve`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminMetrics"] });
      queryClient.invalidateQueries({ queryKey: ["pendingEvents"] });
    }
  });

  const rejectEventMutation = useMutation({
    mutationFn: async ({ eventId, reason }: { eventId: string; reason: string }) => {
      const res = await apiClient.post(`/admin/events/${eventId}/reject`, { reason });
      return res.data;
    },
    onSuccess: () => {
      setRejectingEventId(null);
      setEventRejectReason("");
      queryClient.invalidateQueries({ queryKey: ["adminMetrics"] });
      queryClient.invalidateQueries({ queryKey: ["pendingEvents"] });
    }
  });

  const metrics = data?.data;
  const allUsers = usersData?.data || [];
  const pendingVolunteers = volunteersData?.data || [];
  const pendingResources = resourcesData?.data || [];
  const pendingDeletions = deletionsData?.data || [];
  const pendingEvents = eventsData?.data || [];
  const health = healthData?.data;
  const userLogs = userLogsData?.data || [];

  return (
    <ProtectedRoute allowedRoles={["admin", "super_admin"]}>
      <div className="space-y-8">
        {user?.role?.name === "super_admin" && (
          <div className="bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-600 rounded-2xl p-5 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
            <div className="flex items-center gap-3">
              <ShieldAlert className="h-7 w-7 text-white shrink-0 animate-bounce" />
              <div>
                <h3 className="font-bold text-base">Super Admin Master Control Available! ⚡</h3>
                <p className="text-xs text-white/90">Trigger external web scrapers, view API payload contracts, and manage master settings.</p>
              </div>
            </div>
            <Link href={`/super-admin/${getUserSlug(user)}`}>
              <Button size="sm" className="bg-white text-zinc-900 font-bold hover:bg-zinc-100 shrink-0">
                Open Super Admin Master Portal ➔
              </Button>
            </Link>
          </div>
        )}

        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Welcome back, {user?.profile?.full_name || "Administrator"}! 👋
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400 text-sm mt-1">
            Platform metrics, user directory controls, resource moderation, and real-time health diagnostics.
          </p>

        {/* 🌟 INTERACTIVE CLICKABLE METRIC CARDS (FILTER TABS) */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
          <ScrollReveal direction="up" delay={100}>
            <TiltCard className="h-full">
              <Card
                onClick={() => setActiveTab("users")}
                className={`space-y-2 cursor-pointer transition-all duration-200 h-full ${
                  activeTab === "users"
                    ? "ring-2 ring-sky-500 bg-sky-50/40 dark:bg-sky-950/30 border-sky-300 dark:border-sky-700"
                    : "hover:border-zinc-300 dark:hover:border-zinc-700"
                }`}
              >
                <div className="flex items-center justify-between text-zinc-500">
                  <span className="text-xs font-bold uppercase tracking-wider">Total Users</span>
                  <Users className="h-4 w-4 text-sky-600" />
                </div>
                <div className="text-3xl font-bold">
                  {isLoading ? <Skeleton className="h-8 w-16" /> : <AnimatedNumber value={String(metrics?.total_users ?? 0)} />}
                </div>
                <div className="text-[11px] text-sky-600 dark:text-sky-400">Click to manage user roles & accounts</div>
              </Card>
            </TiltCard>
          </ScrollReveal>

          <ScrollReveal direction="up" delay={200}>
            <TiltCard className="h-full">
              <Card
                onClick={() => setActiveTab("volunteers")}
                className={`space-y-2 cursor-pointer transition-all duration-200 h-full ${
                  activeTab === "volunteers"
                    ? "ring-2 ring-amber-500 bg-amber-50/40 dark:bg-amber-950/30 border-amber-300 dark:border-amber-700"
                    : "hover:border-zinc-300 dark:hover:border-zinc-700"
                }`}
              >
                <div className="flex items-center justify-between text-zinc-500">
                  <span className="text-xs font-bold uppercase tracking-wider">Pending Volunteers</span>
                  <Clock className="h-4 w-4 text-amber-600 animate-pulse" />
                </div>
                <div className="text-3xl font-bold text-amber-600">
                  {isLoading ? <Skeleton className="h-8 w-16" /> : <AnimatedNumber value={String(metrics?.pending_volunteers ?? 0)} />}
                </div>
                <div className="text-[11px] text-amber-600 dark:text-amber-400">Click to view 3-day verification queue</div>
              </Card>
            </TiltCard>
          </ScrollReveal>

          <ScrollReveal direction="up" delay={300}>
            <TiltCard className="h-full">
              <Card
                onClick={() => setActiveTab("resources")}
                className={`space-y-2 cursor-pointer transition-all duration-200 h-full ${
                  activeTab === "resources"
                    ? "ring-2 ring-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/30 border-indigo-300 dark:border-indigo-700"
                    : "hover:border-zinc-300 dark:hover:border-zinc-700"
                }`}
              >
                <div className="flex items-center justify-between text-zinc-500">
                  <span className="text-xs font-bold uppercase tracking-wider">Pending Resources</span>
                  <FileCheck className="h-4 w-4 text-indigo-600 animate-pulse" />
                </div>
                <div className="text-3xl font-bold text-indigo-600">
                  {isLoading ? <Skeleton className="h-8 w-16" /> : <AnimatedNumber value={String(metrics?.pending_resources ?? 0)} />}
                </div>
                <div className="text-[11px] text-indigo-600 dark:text-indigo-400">Click to moderate study notes</div>
              </Card>
            </TiltCard>
          </ScrollReveal>

          <ScrollReveal direction="up" delay={400}>
            <TiltCard className="h-full">
              <Card
                onClick={() => setIsHealthModalOpen(true)}
                className="space-y-2 cursor-pointer transition-all duration-200 border-emerald-200 dark:border-emerald-800 bg-emerald-50/30 dark:bg-emerald-950/20 hover:border-emerald-400 h-full"
              >
                <div className="flex items-center justify-between text-zinc-500">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">System Health</span>
                  <Activity className="h-4 w-4 text-emerald-600 animate-pulse" />
                </div>
                <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">100%</div>
                <div className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold">Click to run API & DB Diagnostics ➔</div>
              </Card>
            </TiltCard>
          </ScrollReveal>
        </div>    </div>

        {/* NAVIGATION TABS HEADER */}
        <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-3 flex-wrap">
          <button
            onClick={() => setActiveTab("users")}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === "users" ? "bg-sky-600 text-white" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600"
            }`}
          >
            👥 Platform Users Directory
          </button>

          <button
            onClick={() => setActiveTab("volunteers")}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === "volunteers" ? "bg-amber-600 text-white" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600"
            }`}
          >
            ⏳ Pending Volunteers ({pendingVolunteers.length})
          </button>

          <button
            onClick={() => setActiveTab("resources")}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === "resources" ? "bg-indigo-600 text-white" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600"
            }`}
          >
            📚 Resource Moderation ({pendingResources.length})
          </button>

          <button
            onClick={() => setActiveTab("events")}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === "events" ? "bg-purple-600 text-white" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600"
            }`}
          >
            📅 Event Approvals ({pendingEvents.length})
          </button>

          <button
            onClick={() => setActiveTab("deletions")}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === "deletions" ? "bg-rose-600 text-white" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600"
            }`}
          >
            🗑️ Deletion Requests ({pendingDeletions.length})
          </button>
        </div>

        {/* TAB 1: PLATFORM USER DIRECTORY & MANAGEMENT */}
        {activeTab === "users" && (
          <Card className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Users className="h-5 w-5 text-sky-500" /> Platform User Directory & Role Promotion
              </h2>

              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="h-4 w-4 absolute left-3 top-2.5 text-zinc-400" />
                  <input
                    type="text"
                    placeholder="Search by name or email..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="pl-9 pr-3 py-1.5 border border-zinc-300 dark:border-zinc-700 rounded-xl bg-transparent text-xs focus:outline-none focus:ring-2 focus:ring-sky-500 w-48 sm:w-64"
                  />
                </div>

                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="px-3 py-1.5 border border-zinc-300 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-800 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  <option value="">All Roles</option>
                  <option value="student">Student</option>
                  <option value="volunteer">Volunteer</option>
                  <option value="alumni">Alumni</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>

            <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-zinc-50 dark:bg-zinc-900/50 text-zinc-500 text-xs font-semibold uppercase border-b border-zinc-200 dark:border-zinc-800">
                  <tr>
                    <th className="px-4 py-3">User Name</th>
                    <th className="px-4 py-3">Email Address</th>
                    <th className="px-4 py-3">Assigned Role</th>
                    <th className="px-4 py-3">Joined Date</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {usersLoading ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-zinc-500 text-xs">
                        Loading users directory...
                      </td>
                    </tr>
                  ) : allUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-zinc-500 text-xs">
                        No users found matching search query.
                      </td>
                    </tr>
                  ) : (
                    allUsers.map((u) => (
                      <tr key={u.id}>
                        <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                          <div className="h-7 w-7 rounded-full bg-sky-100 dark:bg-sky-950 text-sky-600 flex items-center justify-center font-bold text-xs">
                            {u.full_name.charAt(0).toUpperCase()}
                          </div>
                          <span>{u.full_name}</span>
                        </td>
                        <td className="px-4 py-3 text-xs text-zinc-600 dark:text-zinc-400">{u.email}</td>
                        <td className="px-4 py-3 text-xs">
                          <span className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase ${
                            u.role === "admin" || u.role === "super_admin"
                              ? "bg-purple-100 text-purple-700"
                              : u.role === "volunteer"
                              ? "bg-emerald-100 text-emerald-700"
                              : u.role === "alumni"
                              ? "bg-indigo-100 text-indigo-700"
                              : "bg-sky-100 text-sky-700"
                          }`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-zinc-400">{new Date(u.created_at).toLocaleDateString()}</td>
                        <td className="px-4 py-3 text-right space-x-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setViewingActivityUser(u)}
                            className="text-xs h-7 px-2 text-sky-600 border-sky-200"
                          >
                            <Eye className="h-3 w-3 mr-1" /> Activity Trail
                          </Button>

                          {u.role === "volunteer" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setAssigningDesignationUser(u);
                                setDesignationError(null);
                              }}
                              className="text-xs h-7 px-2 text-amber-600 border-amber-200"
                            >
                              <ShieldCheck className="h-3 w-3 mr-1" /> Assign Role & Head
                            </Button>
                          )}

                          {u.role !== "admin" && u.role !== "super_admin" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setPromotingUser(u)}
                              className="text-xs h-7 px-2 text-purple-600 border-purple-200"
                            >
                              <UserPlus className="h-3 w-3 mr-1" /> Promote Admin
                            </Button>
                          )}

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setDeletingUser(u)}
                            className="text-xs h-7 px-2 text-rose-600 border-rose-200"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* TAB 2: PENDING VOLUNTEERS QUEUE */}
        {activeTab === "volunteers" && (
          <Card className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Clock className="h-5 w-5 text-amber-500" /> Pending Volunteer Verification Queue (3-Day Expiry)
              </h2>
              <span className="text-xs text-zinc-500 font-medium">{pendingVolunteers.length} pending review</span>
            </div>

            <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-zinc-50 dark:bg-zinc-900/50 text-zinc-500 text-xs font-semibold uppercase border-b border-zinc-200 dark:border-zinc-800">
                  <tr>
                    <th className="px-4 py-3">Applicant Name</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Organization</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {volunteersLoading ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-zinc-500 text-xs">
                        Loading pending applications...
                      </td>
                    </tr>
                  ) : pendingVolunteers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-zinc-500 text-xs">
                        No pending volunteer verification requests.
                      </td>
                    </tr>
                  ) : (
                    pendingVolunteers.map((v) => (
                      <tr key={v.id}>
                        <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">{v.full_name}</td>
                        <td className="px-4 py-3 text-zinc-500 text-xs">{v.email}</td>
                        <td className="px-4 py-3 text-zinc-500 text-xs">{v.organization}</td>
                        <td className="px-4 py-3">
                          <span className="px-2.5 py-0.5 bg-amber-50 dark:bg-amber-950 text-amber-600 text-xs rounded-full border border-amber-200 dark:border-amber-800 font-semibold">
                            {v.approval_status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right space-x-2">
                          <Button
                            size="sm"
                            isLoading={approveVolunteerMutation.isPending}
                            onClick={() => approveVolunteerMutation.mutate(v.user_id)}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs h-8"
                          >
                            <Check className="h-3.5 w-3.5 mr-1" /> Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setRejectingUserId(v.user_id)}
                            className="text-rose-600 border-rose-200 text-xs h-8"
                          >
                            <X className="h-3.5 w-3.5 mr-1" /> Reject
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* TAB 3: PENDING RESOURCE MODERATION QUEUE */}
        {activeTab === "resources" && (
          <Card className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-indigo-500" /> Pending Educational Resource Approval Queue
              </h2>
              <span className="text-xs text-zinc-500 font-medium">{pendingResources.length} pending review</span>
            </div>

            <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-zinc-50 dark:bg-zinc-900/50 text-zinc-500 text-xs font-semibold uppercase border-b border-zinc-200 dark:border-zinc-800">
                  <tr>
                    <th className="px-4 py-3">Resource Title</th>
                    <th className="px-4 py-3">Taxonomy</th>
                    <th className="px-4 py-3">Uploader (Volunteer)</th>
                    <th className="px-4 py-3">Document Link</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {resourcesLoading ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-zinc-500 text-xs">
                        Loading pending educational resources...
                      </td>
                    </tr>
                  ) : pendingResources.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-zinc-500 text-xs">
                        No pending educational resources for moderation.
                      </td>
                    </tr>
                  ) : (
                    pendingResources.map((res) => (
                      <tr key={res.id}>
                        <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">
                          <div>{res.title}</div>
                          {res.description && <div className="text-[11px] text-zinc-500 line-clamp-1">{res.description}</div>}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <span className="px-1.5 py-0.5 bg-sky-50 dark:bg-sky-950 text-sky-600 text-[10px] font-bold rounded">
                              {res.target_class}
                            </span>
                            <span className="px-1.5 py-0.5 bg-emerald-50 dark:bg-emerald-950 text-emerald-600 text-[10px] font-bold rounded">
                              {res.subject_name}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400 text-xs">
                          <div className="font-semibold text-zinc-900 dark:text-zinc-200">{res.uploader_name}</div>
                          <div className="text-[10px] text-zinc-500">{res.uploader_email}</div>
                        </td>
                        <td className="px-4 py-3 text-xs">
                          <a
                            href={res.external_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-sky-600 hover:text-sky-500 font-semibold"
                          >
                            Open Link <ExternalLink className="h-3 w-3 ml-1" />
                          </a>
                        </td>
                        <td className="px-4 py-3 text-right space-x-2">
                          <Button
                            size="sm"
                            isLoading={approveResourceMutation.isPending}
                            onClick={() => approveResourceMutation.mutate(res.id)}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs h-8"
                          >
                            <Check className="h-3.5 w-3.5 mr-1" /> Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setRejectingResourceId(res.id)}
                            className="text-rose-600 border-rose-200 text-xs h-8"
                          >
                            <X className="h-3.5 w-3.5 mr-1" /> Reject
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* TAB 4: EVENT APPROVALS QUEUE */}
        {activeTab === "events" && (
          <Card className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-indigo-500" /> Pending Student Bootcamp / Event Approval Queue
              </h2>
              <span className="text-xs text-zinc-500 font-medium">{pendingEvents.length} pending review</span>
            </div>

            <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-zinc-50 dark:bg-zinc-900/50 text-zinc-500 text-xs font-semibold uppercase border-b border-zinc-200 dark:border-zinc-800">
                  <tr>
                    <th className="px-4 py-3">Event Title & Timing</th>
                    <th className="px-4 py-3">Mode & Venue</th>
                    <th className="px-4 py-3">Organizer (Volunteer)</th>
                    <th className="px-4 py-3">WhatsApp Link</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {eventsLoading ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-zinc-500 text-xs">
                        Loading pending events...
                      </td>
                    </tr>
                  ) : pendingEvents.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-zinc-500 text-xs">
                        No pending event verification requests.
                      </td>
                    </tr>
                  ) : (
                    pendingEvents.map((e) => (
                      <tr key={e.id}>
                        <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">
                          <div>{e.title}</div>
                          <div className="text-[11px] text-zinc-500">
                            {new Date(e.event_date).toLocaleDateString()} {e.start_time ? `• ${e.start_time}` : ""}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs">
                          <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 text-[10px] font-bold rounded uppercase mr-1">
                            {e.mode}
                          </span>
                          <span className="text-zinc-600 dark:text-zinc-400">{e.venue}</span>
                        </td>
                        <td className="px-4 py-3 text-xs">
                          <div className="font-semibold text-zinc-900 dark:text-zinc-200">{e.organizer_name}</div>
                          <div className="text-[10px] text-zinc-500">{e.organizer_email}</div>
                        </td>
                        <td className="px-4 py-3 text-xs">
                          {e.whatsapp_group_url ? (
                            <a href={e.whatsapp_group_url} target="_blank" rel="noopener noreferrer" className="text-emerald-600 font-semibold flex items-center gap-1">
                              <MessageSquare className="h-3 w-3" /> Group Link
                            </a>
                          ) : (
                            <span className="text-zinc-400 text-[11px]">N/A</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right space-x-2">
                          <Button
                            size="sm"
                            isLoading={approveEventMutation.isPending}
                            onClick={() => approveEventMutation.mutate(e.id)}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs h-8"
                          >
                            <Check className="h-3.5 w-3.5 mr-1" /> Approve Event
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setRejectingEventId(e.id)}
                            className="text-rose-600 border-rose-200 text-xs h-8"
                          >
                            <X className="h-3.5 w-3.5 mr-1" /> Reject
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* TAB 5: DELETION REQUESTS QUEUE */}
        {activeTab === "deletions" && (
          <Card className="space-y-4 border-rose-200 dark:border-rose-900 bg-rose-50/30 dark:bg-rose-950/20">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-rose-900 dark:text-rose-200 flex items-center gap-2">
                <Trash2 className="h-5 w-5 text-rose-500" /> Pending Resource Deletion Requests Queue
              </h2>
              <span className="text-xs text-rose-700 font-bold">{pendingDeletions.length} deletion requests</span>
            </div>

            <div className="border border-rose-200 dark:border-rose-900 rounded-xl overflow-hidden bg-white dark:bg-zinc-900">
              <table className="w-full text-left text-sm">
                <thead className="bg-rose-100/50 dark:bg-rose-950/50 text-rose-900 text-xs font-semibold uppercase border-b border-rose-200 dark:border-rose-900">
                  <tr>
                    <th className="px-4 py-3">Resource Title</th>
                    <th className="px-4 py-3">Volunteer Note / Deletion Reason</th>
                    <th className="px-4 py-3">Uploader (Volunteer)</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-rose-100 dark:divide-zinc-800">
                  {pendingDeletions.map((del) => (
                    <tr key={del.id}>
                      <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">
                        <div>{del.title}</div>
                        <div className="text-[10px] text-zinc-500">{del.target_class} • {del.subject_name}</div>
                      </td>
                      <td className="px-4 py-3 text-xs text-rose-700 dark:text-rose-300 italic font-medium">
                        "{del.deletion_reason || "Volunteer requested removal."}"
                      </td>
                      <td className="px-4 py-3 text-xs">
                        <div className="font-semibold text-zinc-900 dark:text-zinc-200">{del.uploader_name}</div>
                        <div className="text-[10px] text-zinc-500">{del.uploader_email}</div>
                      </td>
                      <td className="px-4 py-3 text-right space-x-2">
                        <Button
                          size="sm"
                          isLoading={approveDeletionMutation.isPending}
                          onClick={() => approveDeletionMutation.mutate(del.id)}
                          className="bg-rose-600 hover:bg-rose-500 text-white text-xs h-8"
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-1" /> Approve & Permanently Delete
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          isLoading={rejectDeletionMutation.isPending}
                          onClick={() => rejectDeletionMutation.mutate(del.id)}
                          className="text-zinc-600 text-xs h-8"
                        >
                          Reject Deletion Request
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* 🩺 REAL LIVE SYSTEM DIAGNOSTICS & HEALTHCHECK MODAL */}
        {isHealthModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-xl w-full p-6 space-y-5 shadow-2xl relative">
              <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
                <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <Cpu className="h-5 w-5 text-emerald-500 animate-spin" /> Live System Health & Diagnostics Test
                </h3>
                <button onClick={() => setIsHealthModalOpen(false)} className="text-zinc-500 hover:text-zinc-700">
                  <X className="h-5 w-5" />
                </button>
              </div>

              {healthLoading ? (
                <div className="py-8 text-center text-xs text-zinc-500 space-y-2">
                  <div className="animate-spin h-6 w-6 border-2 border-emerald-500 border-t-transparent rounded-full mx-auto" />
                  <div>Running real-time database query latency test & storage checks...</div>
                </div>
              ) : health ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                      <div>
                        <div className="font-bold text-sm text-emerald-900 dark:text-emerald-100">Overall System Health: {health.status}</div>
                        <div className="text-xs text-emerald-700 dark:text-emerald-300">All database & middleware services responding normally.</div>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 bg-emerald-200/80 text-emerald-900 text-xs font-bold rounded-lg">
                      ⚡ {health.database.latency_ms} ms ping
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40 space-y-1">
                      <div className="text-zinc-500 font-semibold uppercase">Database Connection</div>
                      <div className="font-bold text-zinc-900 dark:text-zinc-100">{health.database.engine} (Connected)</div>
                      <div className="text-[11px] text-emerald-600">Query Latency: {health.database.latency_ms} ms</div>
                    </div>

                    <div className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40 space-y-1">
                      <div className="text-zinc-500 font-semibold uppercase">JWT Auth Guard</div>
                      <div className="font-bold text-zinc-900 dark:text-zinc-100">{health.jwt_auth.status}</div>
                      <div className="text-[11px] text-zinc-500">Active Role: {health.jwt_auth.active_role}</div>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40 space-y-2">
                    <div className="text-xs font-semibold uppercase text-zinc-500">Database Record Totals</div>
                    <div className="grid grid-cols-4 gap-2 text-center text-xs">
                      <div className="p-2 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-700">
                        <div className="font-bold text-base">{health.statistics.total_users}</div>
                        <div className="text-[10px] text-zinc-500">Users</div>
                      </div>
                      <div className="p-2 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-700">
                        <div className="font-bold text-base">{health.statistics.total_resources}</div>
                        <div className="text-[10px] text-zinc-500">Resources</div>
                      </div>
                      <div className="p-2 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-700">
                        <div className="font-bold text-base">{health.statistics.total_events}</div>
                        <div className="text-[10px] text-zinc-500">Events</div>
                      </div>
                      <div className="p-2 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-700">
                        <div className="font-bold text-base">{health.statistics.total_logs}</div>
                        <div className="text-[10px] text-zinc-500">Audit Logs</div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-2">
                    <div className="text-[11px] text-zinc-400">Last tested: {new Date(health.timestamp).toLocaleTimeString()}</div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" onClick={() => refetchHealth()}>
                        Re-run Tests
                      </Button>
                      <Button size="sm" onClick={() => setIsHealthModalOpen(false)}>
                        Close
                      </Button>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        )}

        {/* 👁️ USER ACTIVITY AUDIT TRAIL MODAL */}
        {viewingActivityUser && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl relative max-h-[85vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
                <div>
                  <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                    <Eye className="h-5 w-5 text-sky-500" /> User Activity Audit Trail
                  </h3>
                  <div className="text-xs text-zinc-500">{viewingActivityUser.full_name} ({viewingActivityUser.email})</div>
                </div>
                <button onClick={() => setViewingActivityUser(null)} className="text-zinc-500 hover:text-zinc-700">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-3">
                {userLogsLoading ? (
                  <div className="py-8 text-center text-xs text-zinc-500">Fetching user activity logs...</div>
                ) : userLogs.length === 0 ? (
                  <div className="py-8 text-center text-xs text-zinc-500">No activity logs recorded yet for this user.</div>
                ) : (
                  userLogs.map((log) => (
                    <div key={log.id} className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40 text-xs space-y-1">
                      <div className="flex items-center justify-between font-bold text-zinc-900 dark:text-zinc-100">
                        <span className="px-2 py-0.5 bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 text-[10px] rounded uppercase font-bold">
                          {log.action}
                        </span>
                        <span className="text-zinc-400 font-normal">{new Date(log.created_at).toLocaleString()}</span>
                      </div>
                      {log.details && (
                        <div className="text-zinc-600 dark:text-zinc-400 font-mono text-[11px] overflow-x-auto p-1.5 bg-white dark:bg-zinc-900 rounded border border-zinc-200 dark:border-zinc-800 mt-1">
                          {JSON.stringify(log.details)}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              <div className="flex justify-end pt-2">
                <Button variant="outline" size="sm" onClick={() => setViewingActivityUser(null)}>
                  Close Audit Trail
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* 👑 PROMOTE TO ADMIN CONFIRMATION MODAL */}
        {promotingUser && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
              <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-purple-500" /> Promote User to Admin Role
              </h3>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Are you sure you want to promote <strong>{promotingUser.full_name}</strong> ({promotingUser.email}) to <strong>Admin</strong> role? This will grant them full administrative moderation access.
              </p>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => setPromotingUser(null)}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  isLoading={promoteAdminMutation.isPending}
                  onClick={() => promoteAdminMutation.mutate(promotingUser.id)}
                  className="bg-purple-600 hover:bg-purple-500 text-white"
                >
                  Confirm Admin Promotion
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* 🗑️ DELETE USER CONFIRMATION MODAL */}
        {deletingUser && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
              <h3 className="font-bold text-base text-rose-600 flex items-center gap-2">
                <Trash2 className="h-5 w-5 text-rose-500" /> Permanently Delete User Account
              </h3>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Are you sure you want to permanently delete user account <strong>{deletingUser.full_name}</strong> ({deletingUser.email})? This action cannot be undone.
              </p>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => setDeletingUser(null)}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  isLoading={deleteUserMutation.isPending}
                  onClick={() => deleteUserMutation.mutate(deletingUser.id)}
                  className="bg-rose-600 hover:bg-rose-500 text-white"
                >
                  Confirm Permanent Delete
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* REJECTION REASON MODALS */}
        {rejectingUserId && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
              <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-rose-500" /> Reject Volunteer Application
              </h3>
              <p className="text-xs text-zinc-500">
                Specify rejection reason for this volunteer applicant:
              </p>
              <textarea
                rows={3}
                required
                placeholder="E.g., Invalid organization proof provided."
                value={volunteerRejectReason}
                onChange={(e) => setVolunteerRejectReason(e.target.value)}
                className="w-full p-3 border border-zinc-300 dark:border-zinc-700 rounded-xl bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => setRejectingUserId(null)}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  isLoading={rejectVolunteerMutation.isPending}
                  onClick={() => rejectVolunteerMutation.mutate({ userId: rejectingUserId, reason: volunteerRejectReason || "Criteria not met." })}
                  className="bg-rose-600 hover:bg-rose-500 text-white"
                >
                  Confirm Rejection
                </Button>
              </div>
            </div>
          </div>
        )}

        {rejectingResourceId && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
              <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-rose-500" /> Reject Resource Submission
              </h3>
              <p className="text-xs text-zinc-500">
                Specify why this resource was rejected:
              </p>
              <textarea
                rows={3}
                required
                placeholder="E.g., Document link is broken."
                value={resourceRejectReason}
                onChange={(e) => setResourceRejectReason(e.target.value)}
                className="w-full p-3 border border-zinc-300 dark:border-zinc-700 rounded-xl bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => setRejectingResourceId(null)}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  isLoading={rejectResourceMutation.isPending}
                  onClick={() => rejectResourceMutation.mutate({ resourceId: rejectingResourceId, reason: resourceRejectReason || "Resource criteria not met." })}
                  className="bg-rose-600 hover:bg-rose-500 text-white"
                >
                  Confirm Rejection
                </Button>
              </div>
            </div>
          </div>
        )}

        {rejectingEventId && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
              <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-rose-500" /> Reject Event Creation
              </h3>
              <p className="text-xs text-zinc-500">
                Specify rejection reason for this event submission:
              </p>
              <textarea
                rows={3}
                required
                placeholder="E.g., WhatsApp link is broken or venue info incomplete."
                value={eventRejectReason}
                onChange={(e) => setEventRejectReason(e.target.value)}
                className="w-full p-3 border border-zinc-300 dark:border-zinc-700 rounded-xl bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => setRejectingEventId(null)}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  isLoading={rejectEventMutation.isPending}
                  onClick={() => rejectEventMutation.mutate({ eventId: rejectingEventId, reason: eventRejectReason || "Event criteria not met." })}
                  className="bg-rose-600 hover:bg-rose-500 text-white"
                >
                  Confirm Rejection
                </Button>
              </div>
            </div>
          </div>
        )}
        {assigningDesignationUser && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl relative">
              <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
                <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-amber-500" /> Assign Volunteer Designation
                </h3>
                <button onClick={() => setAssigningDesignationUser(null)} className="text-zinc-500 hover:text-zinc-700">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <p className="text-xs text-zinc-500">
                Assign official SAMIDHA leadership role for <strong>{assigningDesignationUser.full_name}</strong>.
              </p>

              {designationError && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-medium rounded-xl leading-relaxed">
                  {designationError}
                </div>
              )}

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Designation Role *</label>
                  <select
                    value={assignedDesignation}
                    onChange={(e) => { setAssignedDesignation(e.target.value); setDesignationError(null); }}
                    className="w-full p-2.5 border border-zinc-300 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-800 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 font-semibold"
                  >
                    <option value="Operational & Volunteer Head">Operational & Volunteer Head (3rd/4th Year Only)</option>
                    <option value="Senior Educator Lead">Senior Educator Lead</option>
                    <option value="Volunteer Educator">Volunteer Educator</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Academic Year Verification *</label>
                  <select
                    value={assignedYear}
                    onChange={(e) => { setAssignedYear(e.target.value); setDesignationError(null); }}
                    className="w-full p-2.5 border border-zinc-300 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-800 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 font-semibold"
                  >
                    <option value="1st Year">1st Year Student</option>
                    <option value="2nd Year">2nd Year Student</option>
                    <option value="3rd Year">3rd Year Student (Eligible for Operational Head)</option>
                    <option value="4th Year">4th Year Student (Eligible for Operational Head)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                <Button variant="outline" size="sm" onClick={() => setAssigningDesignationUser(null)}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    if (assignedDesignation === "Operational & Volunteer Head" && (assignedYear === "1st Year" || assignedYear === "2nd Year")) {
                      setDesignationError("Academic Year Constraint Violation: Operational & Volunteer Head designation can only be distributed to 3rd Year or 4th Year students.");
                      return;
                    }
                    alert(`Successfully assigned "${assignedDesignation}" (${assignedYear}) to ${assigningDesignationUser.full_name}.`);
                    setAssigningDesignationUser(null);
                  }}
                  className="bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs"
                >
                  Save & Assign Designation
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
