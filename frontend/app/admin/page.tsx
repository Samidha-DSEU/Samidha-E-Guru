"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ShieldCheck, Users, FileCheck, Activity, Database, Check, X, Clock, AlertCircle } from "lucide-react";
import { apiClient } from "@/services/apiClient";
import { StandardResponse } from "@/types/api";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Card";
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

export default function AdminDashboardPage() {
  const queryClient = useQueryClient();
  const [rejectingUserId, setRejectingUserId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

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

  const approveMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await apiClient.post(`/admin/volunteers/${userId}/approve`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminMetrics"] });
      queryClient.invalidateQueries({ queryKey: ["pendingVolunteers"] });
    }
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ userId, reason }: { userId: string; reason: string }) => {
      const res = await apiClient.post(`/admin/volunteers/${userId}/reject`, { reason });
      return res.data;
    },
    onSuccess: () => {
      setRejectingUserId(null);
      setRejectionReason("");
      queryClient.invalidateQueries({ queryKey: ["adminMetrics"] });
      queryClient.invalidateQueries({ queryKey: ["pendingVolunteers"] });
    }
  });

  const metrics = data?.data;
  const pendingVolunteers = volunteersData?.data || [];

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
              <span className="text-xs font-semibold uppercase tracking-wider">Approved Volunteers</span>
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="text-3xl font-bold text-emerald-600">{isLoading ? <Skeleton className="h-8 w-16" /> : metrics?.approved_volunteers ?? 0}</div>
          </Card>

          <Card className="space-y-2">
            <div className="flex items-center justify-between text-zinc-500">
              <span className="text-xs font-semibold uppercase tracking-wider">System Health</span>
              <Database className="h-4 w-4 text-indigo-600" />
            </div>
            <div className="text-xl font-bold text-emerald-600">Healthy</div>
          </Card>
        </div>

        {/* Pending Volunteer Verification Queue */}
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
                          isLoading={approveMutation.isPending}
                          onClick={() => approveMutation.mutate(v.user_id)}
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

        {/* REJECTION REASON MODAL */}
        {rejectingUserId && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
              <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-rose-500" /> Specify Rejection Reason
              </h3>
              <p className="text-xs text-zinc-500">
                This reason will be sent in an email notification to the applicant.
              </p>
              <textarea
                rows={3}
                required
                placeholder="E.g., Organization details could not be verified."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full p-3 border border-zinc-300 dark:border-zinc-700 rounded-xl bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => setRejectingUserId(null)}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  isLoading={rejectMutation.isPending}
                  onClick={() => rejectMutation.mutate({ userId: rejectingUserId, reason: rejectionReason || "Application criteria not met." })}
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
