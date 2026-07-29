"use client";

import React, { useState, useEffect } from "react";
import { Upload, Clock, AlertTriangle, ShieldCheck, CheckCircle2, Lock } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { useAuth } from "@/features/auth/context/AuthContext";

export default function VolunteerDashboardPage() {
  const { user } = useAuth();
  const volunteerProfile = user?.volunteer_profile;
  const status = volunteerProfile?.approval_status || "PENDING";
  const isApproved = status === "APPROVED";

  const [timeLeft, setTimeLeft] = useState<string>("");

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
            title={!isApproved ? "Account verification pending approval" : ""}
            className={!isApproved ? "opacity-60 cursor-not-allowed bg-zinc-400 text-zinc-200" : "bg-emerald-600 hover:bg-emerald-500 text-white"}
          >
            {!isApproved ? <Lock className="h-4 w-4 mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
            Upload New Resource
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <Card className="space-y-2">
            <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Uploaded Resources</div>
            <div className="text-3xl font-bold">14</div>
          </Card>

          <Card className="space-y-2">
            <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Approved & Live</div>
            <div className="text-3xl font-bold text-emerald-600">12</div>
          </Card>

          <Card className="space-y-2">
            <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Pending Review</div>
            <div className="text-3xl font-bold text-amber-600">2</div>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
}
