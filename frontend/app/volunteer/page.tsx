"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Upload, Clock, AlertTriangle, ShieldCheck, CheckCircle2, Lock, Plus, FileText, X } from "lucide-react";
import { apiClient } from "@/services/apiClient";
import { StandardResponse } from "@/types/api";
import { Card, Skeleton } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { useAuth } from "@/features/auth/context/AuthContext";

export default function VolunteerDashboardPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const volunteerProfile = user?.volunteer_profile;
  const status = volunteerProfile?.approval_status || "PENDING";
  const isApproved = status === "APPROVED";

  const [timeLeft, setTimeLeft] = useState<string>("");
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    external_url: ""
  });
  const [uploadError, setUploadError] = useState<string | null>(null);

  // DYNAMICALLY FETCH REAL VOLUNTEER RESOURCE STATS FROM BACKEND
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

  const uploadMutation = useMutation({
    mutationFn: async (data: { title: string; description: string; external_url: string }) => {
      const res = await apiClient.post("/resources", data);
      return res.data;
    },
    onSuccess: () => {
      setIsUploadModalOpen(false);
      setFormData({ title: "", description: "", external_url: "" });
      setUploadError(null);
      queryClient.invalidateQueries({ queryKey: ["volunteerStats"] });
    },
    onError: (err: any) => {
      setUploadError(err.response?.data?.detail || err.response?.data?.message || "Failed to submit resource.");
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

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.external_url) {
      setUploadError("Please provide a title and document/external link.");
      return;
    }
    uploadMutation.mutate(formData);
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
              SAMIDHA Volunteer Portal
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400 text-sm">
              Upload educational resources, track verification status, and organize student bootcamps.
            </p>
          </div>

          <Button
            disabled={!isApproved}
            onClick={() => setIsUploadModalOpen(true)}
            title={!isApproved ? "Account verification pending approval" : ""}
            className={!isApproved ? "opacity-60 cursor-not-allowed bg-zinc-400 text-zinc-200" : "bg-emerald-600 hover:bg-emerald-500 text-white"}
          >
            {!isApproved ? <Lock className="h-4 w-4 mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
            Upload New Resource
          </Button>
        </div>

        {/* DYNAMIC GENERIC STAT CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <Card className="space-y-2">
            <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Uploaded Resources</div>
            <div className="text-3xl font-bold">
              {isStatsLoading ? <Skeleton className="h-8 w-16" /> : stats?.total_uploaded ?? 0}
            </div>
          </Card>

          <Card className="space-y-2">
            <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Approved & Live</div>
            <div className="text-3xl font-bold text-emerald-600">
              {isStatsLoading ? <Skeleton className="h-8 w-16" /> : stats?.approved_and_live ?? 0}
            </div>
          </Card>

          <Card className="space-y-2">
            <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Pending Review</div>
            <div className="text-3xl font-bold text-amber-600">
              {isStatsLoading ? <Skeleton className="h-8 w-16" /> : stats?.pending_review ?? 0}
            </div>
          </Card>
        </div>

        {/* UPLOAD RESOURCE MODAL */}
        {isUploadModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative">
              <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
                <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <Upload className="h-5 w-5 text-emerald-500" /> Upload Educational Resource
                </h3>
                <button onClick={() => setIsUploadModalOpen(false)} className="text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300">
                  <X className="h-5 w-5" />
                </button>
              </div>

              {uploadError && (
                <div className="p-3 text-xs bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-300 rounded-xl border border-rose-200 dark:border-rose-800">
                  {uploadError}
                </div>
              )}

              <form onSubmit={handleUploadSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Resource Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="E.g., Class 10 Physics Motion Chapter Notes & PYQs"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full p-3 border border-zinc-300 dark:border-zinc-700 rounded-xl bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Document URL / File Drive Link *</label>
                  <input
                    type="url"
                    required
                    placeholder="https://drive.google.com/... or PDF link"
                    value={formData.external_url}
                    onChange={(e) => setFormData({ ...formData, external_url: e.target.value })}
                    className="w-full p-3 border border-zinc-300 dark:border-zinc-700 rounded-xl bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <p className="text-[11px] text-zinc-500">Paste Google Drive, PDF, DIKSHA, NPTEL, or YouTube study link.</p>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Description / Topic Summary</label>
                  <textarea
                    rows={3}
                    placeholder="Brief description of topics covered in this resource..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full p-3 border border-zinc-300 dark:border-zinc-700 rounded-xl bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <Button variant="outline" type="button" onClick={() => setIsUploadModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" isLoading={uploadMutation.isPending} className="bg-emerald-600 hover:bg-emerald-500 text-white">
                    Submit for Approval
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
