"use client";

import React from "react";
import { Upload } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";

export default function VolunteerDashboardPage() {
  return (
    <ProtectedRoute allowedRoles={["volunteer", "admin", "super_admin"]}>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              SAMIDHA Volunteer Portal
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400 text-sm">
              Upload educational resources, track verification status, and organize student bootcamps.
            </p>
          </div>

          <Button>
            <Upload className="h-4 w-4 mr-2" />
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
