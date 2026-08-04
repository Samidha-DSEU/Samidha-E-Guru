"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ShieldCheck, Users, FileCheck, Activity, Database, Check, X, Clock, AlertCircle, ExternalLink, BookOpen } from "lucide-react";
import { apiClient } from "@/services/apiClient";
import { StandardResponse } from "@/types/api";
import { Card, Skeleton } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";

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

export default function AdminDashboardPage() {
  const queryClient = useQueryClient();
  
  // Volunteer Rejection Modal State
  const [rejectingUserId, setRejectingUserId] = useState<string | null>(null);
  const [volunteerRejectReason, setVolunteerRejectReason] = useState("");

  // Resource Rejection Modal State
  const [rejectingResourceId, setRejectingResourceId] = useState<string | null>(null);
  const [resourceRejectReason, setResourceRejectReason] = useState("");

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

  // VOLUNTEER ACTIONS
  const approveVolunteerMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await apiClient.post(`/admin/volunteers/${userId}/approve`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminMetrics"] });
      queryClient.invalidateQueries({ queryKey: ["pendingVolunteers"] });
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

  // RESOURCE ACTIONS
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

  const metrics = data?.data;
  const pendingVolunteers = volunteersData?.data || [];
  const pendingResources = resourcesData?.data || [];

  return (
    <ProtectedRoute allowedRoles={["admin", "super_admin"]}>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Admin Control Panel
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400 text-sm">
            Platform metrics, volunteer verification queues, resource moderation, and audit logs.
          </p>
        </div>

        {/* Metrics Row */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
          <Card className="space-y-2">
            <div className="flex items-center justify-between text-zinc-500">
              <span className="text-xs font-semibold uppercase tracking-wider">Total Users</span>
              <Users className="h-4 w-4 text-sky-600" />
            </div>
            <div className="text-3xl font-bold">{isLoading ? <Skeleton className="h-8 w-16" /> : metrics?.total_users ?? 0}</div>
          </Card>

          <Card className="space-y-2">
            <div className="flex items-center justify-between text-zinc-500">
              <span className="text-xs font-semibold uppercase tracking-wider">Pending Volunteers</span>
              <Clock className="h-4 w-4 text-amber-600 animate-pulse" />
            </div>
            <div className="text-3xl font-bold text-amber-600">{isLoading ? <Skeleton className="h-8 w-16" /> : metrics?.pending_volunteers ?? 0}</div>
          </Card>

          <Card className="space-y-2">
            <div className="flex items-center justify-between text-zinc-500">
              <span className="text-xs font-semibold uppercase tracking-wider">Pending Resources</span>
              <FileCheck className="h-4 w-4 text-indigo-600 animate-pulse" />
            </div>
            <div className="text-3xl font-bold text-indigo-600">{isLoading ? <Skeleton className="h-8 w-16" /> : metrics?.pending_resources ?? 0}</div>
          </Card>

          <Card className="space-y-2">
            <div className="flex items-center justify-between text-zinc-500">
              <span className="text-xs font-semibold uppercase tracking-wider">System Health</span>
              <Database className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="text-xl font-bold text-emerald-600">Healthy</div>
          </Card>
        </div>

        {/* 1. PENDING RESOURCE MODERATION QUEUE */}
        <Card className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-indigo-500" /> Pending Educational Resource Approval Queue
            </h2>
            <span className="text-xs text-zinc-500 font-medium">{pendingResources.length} pending review</span>
          </div>

          <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
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
                          className="text-rose-600 border-rose-200 dark:border-rose-900 hover:bg-rose-50 text-xs h-8"
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

        {/* 2. PENDING VOLUNTEER VERIFICATION QUEUE */}
        <Card className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-500" /> Pending Volunteer Verification Queue (3-Day Expiry)
            </h2>
            <span className="text-xs text-zinc-500 font-medium">{pendingVolunteers.length} pending review</span>
          </div>

          <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
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
                          className="text-rose-600 border-rose-200 dark:border-rose-900 hover:bg-rose-50 text-xs h-8"
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

        {/* VOLUNTEER REJECTION MODAL */}
        {rejectingUserId && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
              <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-rose-500" /> Reject Volunteer Application
              </h3>
              <p className="text-xs text-zinc-500">
                Specify rejection reason (will be emailed to applicant):
              </p>
              <textarea
                rows={3}
                required
                placeholder="E.g., Organization details could not be verified."
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
                  onClick={() => rejectVolunteerMutation.mutate({ userId: rejectingUserId, reason: volunteerRejectReason || "Application criteria not met." })}
                  className="bg-rose-600 hover:bg-rose-500 text-white"
                >
                  Confirm Rejection
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* RESOURCE REJECTION MODAL */}
        {rejectingResourceId && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
              <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-rose-500" /> Reject Resource Submission
              </h3>
              <p className="text-xs text-zinc-500">
                Specify why this resource was rejected (e.g. Broken link, invalid content):
              </p>
              <textarea
                rows={3}
                required
                placeholder="E.g., Document link is broken or restricted."
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
                  onClick={() => rejectResourceMutation.mutate({ resourceId: rejectingResourceId, reason: resourceRejectReason || "Resource content criteria not met." })}
                  className="bg-rose-600 hover:bg-rose-500 text-white"
                >
                  Confirm Rejection
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
