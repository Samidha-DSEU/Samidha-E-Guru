"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { ShieldCheck, Users, FileCheck, Activity, Database, Check, X } from "lucide-react";
import { apiClient } from "@/services/apiClient";
import { StandardResponse } from "@/types/api";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Card";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";

export default function AdminDashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["adminMetrics"],
    queryFn: async () => {
      const res = await apiClient.get<StandardResponse<{
        total_users: number;
        total_resources: number;
        pending_resources: number;
        system_status: string;
      }>>("/admin/dashboard");
      return res.data;
    }
  });

  const metrics = data?.data;

  return (
    <ProtectedRoute allowedRoles={["admin", "super_admin"]}>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Admin Control Panel
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400 text-sm">
            Platform statistics, pending resource verification queues, scrapers, and activity audit logs.
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
              <span className="text-xs font-semibold uppercase tracking-wider">Approved Resources</span>
              <FileCheck className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="text-3xl font-bold">{isLoading ? <Skeleton className="h-8 w-16" /> : metrics?.total_resources ?? 0}</div>
          </Card>

          <Card className="space-y-2">
            <div className="flex items-center justify-between text-zinc-500">
              <span className="text-xs font-semibold uppercase tracking-wider">Pending Approvals</span>
              <Activity className="h-4 w-4 text-amber-600" />
            </div>
            <div className="text-3xl font-bold">{isLoading ? <Skeleton className="h-8 w-16" /> : metrics?.pending_resources ?? 0}</div>
          </Card>

          <Card className="space-y-2">
            <div className="flex items-center justify-between text-zinc-500">
              <span className="text-xs font-semibold uppercase tracking-wider">System Health</span>
              <Database className="h-4 w-4 text-indigo-600" />
            </div>
            <div className="text-xl font-bold text-emerald-600">Healthy</div>
          </Card>
        </div>

        {/* Pending Resource Approval Queue */}
        <Card className="space-y-4">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Pending Resource Approval Queue</h2>
          <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-50 dark:bg-zinc-900/50 text-zinc-500 text-xs font-semibold uppercase border-b border-zinc-200 dark:border-zinc-800">
                <tr>
                  <th className="px-4 py-3">Resource Title</th>
                  <th className="px-4 py-3">Source URL</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                <tr>
                  <td className="px-4 py-3 font-medium">Class 10 Physics Motion Formula Sheet & PYQs</td>
                  <td className="px-4 py-3 text-zinc-500 text-xs truncate max-w-xs">https://ncert.nic.in/physics-motion.pdf</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 bg-amber-50 dark:bg-amber-950 text-amber-600 text-xs rounded border border-amber-200 dark:border-amber-800 font-medium">
                      Pending Review
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <Button size="sm" variant="primary">
                      <Check className="h-3.5 w-3.5 mr-1" /> Approve
                    </Button>
                    <Button size="sm" variant="outline">
                      <X className="h-3.5 w-3.5 mr-1" /> Reject
                    </Button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </ProtectedRoute>
  );
}
