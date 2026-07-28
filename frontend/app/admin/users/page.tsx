"use client";

import React from "react";
import Link from "next/link";
import { Users, ArrowLeft, ShieldCheck, UserCheck, Search } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function UserManagementPage() {
  return (
    <div className="space-y-6">
      <Link href="/admin" className="inline-flex items-center text-sm text-zinc-500 hover:text-sky-600 font-medium">
        <ArrowLeft className="h-4 w-4 mr-1.5" /> Back to Admin Dashboard
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            User Role Management
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400 text-sm">
            Manage user accounts, assign RBAC permissions (`Student`, `Volunteer`, `Alumni`, `Admin`), and verify volunteer credentials.
          </p>
        </div>

        <Button>
          <UserCheck className="h-4 w-4 mr-2" /> Add User
        </Button>
      </div>

      <Card className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search users by name, email, or role..."
              className="w-full pl-10 pr-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm"
            />
          </div>
        </div>

        <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden text-sm">
          <table className="w-full text-left">
            <thead className="bg-zinc-50 dark:bg-zinc-900/50 text-zinc-500 text-xs uppercase border-b border-zinc-200 dark:border-zinc-800 font-semibold">
              <tr>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              <tr>
                <td className="px-4 py-3 font-medium">Rahul Verma</td>
                <td className="px-4 py-3 text-zinc-500">rahul@example.com</td>
                <td className="px-4 py-3">
                  <span className="px-2 py-0.5 bg-sky-50 dark:bg-sky-950 text-sky-600 text-xs font-semibold rounded border border-sky-200 dark:border-sky-800">
                    student
                  </span>
                </td>
                <td className="px-4 py-3 text-emerald-600 font-medium text-xs">Active</td>
                <td className="px-4 py-3 text-right">
                  <Button size="sm" variant="ghost">Promote to Volunteer</Button>
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-medium">Priya Singh</td>
                <td className="px-4 py-3 text-zinc-500">priya@samidha.org</td>
                <td className="px-4 py-3">
                  <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950 text-emerald-600 text-xs font-semibold rounded border border-emerald-200 dark:border-emerald-800">
                    volunteer
                  </span>
                </td>
                <td className="px-4 py-3 text-emerald-600 font-medium text-xs">Verified</td>
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
