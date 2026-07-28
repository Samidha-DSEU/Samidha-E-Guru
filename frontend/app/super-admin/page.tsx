"use client";

import React from "react";
import Link from "next/link";
import { ShieldAlert, Users, Server, FileText, Database, Settings, Key, Cpu } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function SuperAdminDashboardPage() {
  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 border border-zinc-800 rounded-3xl p-8 text-white space-y-3 shadow-xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-semibold uppercase tracking-wider">
          <ShieldAlert className="h-3.5 w-3.5" /> Super Admin Access
        </div>
        <h1 className="text-3xl font-bold">Platform Master Control</h1>
        <p className="text-zinc-400 text-sm max-w-xl">
          Full system authority: manage admins, assign user RBAC roles, inspect system audit logs, and monitor scraper execution pipelines.
        </p>
      </div>

      {/* Master Control Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="space-y-3">
          <Users className="h-6 w-6 text-sky-500" />
          <h3 className="font-semibold text-base">User & Role Management</h3>
          <p className="text-xs text-zinc-500">Assign admin rights, promote volunteers, manage user status.</p>
          <Link href="/admin/users" className="block pt-2">
            <Button size="sm" variant="outline" className="w-full">Manage Users</Button>
          </Link>
        </Card>

        <Card className="space-y-3">
          <Cpu className="h-6 w-6 text-emerald-500" />
          <h3 className="font-semibold text-base">Scraper Jobs Engine</h3>
          <p className="text-xs text-zinc-500">Monitor NCERT, DIKSHA, SWAYAM, NPTEL metadata crawlers.</p>
          <Link href="/admin/scrapers" className="block pt-2">
            <Button size="sm" variant="outline" className="w-full">Manage Scrapers</Button>
          </Link>
        </Card>

        <Card className="space-y-3">
          <FileText className="h-6 w-6 text-amber-500" />
          <h3 className="font-semibold text-base">Audit Logs & Traces</h3>
          <p className="text-xs text-zinc-500">Inspect security events, admin actions, login attempts.</p>
          <Link href="/admin/logs" className="block pt-2">
            <Button size="sm" variant="outline" className="w-full">View Audit Logs</Button>
          </Link>
        </Card>

        <Card className="space-y-3">
          <Server className="h-6 w-6 text-indigo-500" />
          <h3 className="font-semibold text-base">System Diagnostics</h3>
          <p className="text-xs text-zinc-500">PostgreSQL database health, active sessions, performance.</p>
          <Button size="sm" variant="outline" className="w-full">System Health</Button>
        </Card>
      </div>

      {/* System Admin Users List */}
      <Card className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Platform Administrators</h2>
          <Button size="sm">
            <Key className="h-3.5 w-3.5 mr-1" /> Add New Admin
          </Button>
        </div>

        <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden text-sm">
          <table className="w-full text-left">
            <thead className="bg-zinc-50 dark:bg-zinc-900/50 text-zinc-500 text-xs uppercase border-b border-zinc-200 dark:border-zinc-800 font-semibold">
              <tr>
                <th className="px-4 py-3">Admin Email</th>
                <th className="px-4 py-3">Assigned Role</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              <tr>
                <td className="px-4 py-3 font-medium">superadmin@samidha.org</td>
                <td className="px-4 py-3">
                  <span className="px-2.5 py-0.5 bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400 text-xs font-semibold rounded border border-rose-200 dark:border-rose-800">
                    super_admin
                  </span>
                </td>
                <td className="px-4 py-3 text-emerald-600 font-medium text-xs">Active</td>
                <td className="px-4 py-3 text-right">
                  <Button size="sm" variant="ghost">Edit</Button>
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-medium">admin_moderator@samidha.org</td>
                <td className="px-4 py-3">
                  <span className="px-2.5 py-0.5 bg-sky-50 dark:bg-sky-950 text-sky-600 dark:text-sky-400 text-xs font-semibold rounded border border-sky-200 dark:border-sky-800">
                    admin
                  </span>
                </td>
                <td className="px-4 py-3 text-emerald-600 font-medium text-xs">Active</td>
                <td className="px-4 py-3 text-right">
                  <Button size="sm" variant="ghost">Edit</Button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
