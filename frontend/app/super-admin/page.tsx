"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { getUserSlug } from "@/lib/userUtils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ShieldAlert, Users, Server, FileText, Database, Settings, Key, Cpu, Play, CheckCircle2, Clock, AlertCircle, X, Code, RefreshCw, ExternalLink, UserPlus, Trash2 } from "lucide-react";
import { apiClient } from "@/services/apiClient";
import { StandardResponse } from "@/types/api";
import { Card, Skeleton } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { useAuth } from "@/features/auth/context/AuthContext";
import { CursorDotsCanvas } from "@/components/ui/CursorDotsCanvas";

interface ScraperJobItem {
  id: string;
  source_name: string;
  status: string;
  class_code?: string;
  total_subjects_found?: number;
  total_chapters_found?: number;
  resources_found: number;
  resources_added: number;
  duration_seconds?: number;
  error_log?: string;
  created_at: string;
}

interface PayloadContract {
  trigger_request_contract: {
    method: string;
    url: string;
    headers: any;
    sample_body: any;
  };
  webhook_callback_contract: {
    method: string;
    url: string;
    headers: any;
    sample_body: any;
  };
}

export default function SuperAdminDashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (user && (!params || !params.username)) {
      const slug = getUserSlug(user);
      router.replace(`/super-admin/${slug}`);
    }
  }, [user, params, router]);

  const [activeTab, setActiveTab] = useState<"scrapers" | "payloads" | "users" | "settings">("scrapers");

  // SCRAPER FORM STATE
  const [isTriggerModalOpen, setIsTriggerModalOpen] = useState(false);
  const [scraperForm, setScraperForm] = useState({
    source_name: "NCERT & CBSE Question Bank",
    target_class: "Class 10",
    subject_name: "Mathematics",
    max_items: 50,
    external_scraper_url: "https://external-scraper-server.com/api/scrape"
  });

  const [lastTriggerResult, setLastTriggerResult] = useState<any>(null);

  // QUERIES
  const { data: jobsData, isLoading: jobsLoading, refetch: refetchJobs } = useQuery({
    queryKey: ["allScraperJobs"],
    queryFn: async () => {
      const res = await apiClient.get<StandardResponse<ScraperJobItem[]>>("/scraper/jobs");
      return res.data;
    },
    refetchInterval: (query) => {
      const currentJobs = query.state.data?.data || [];
      return currentJobs.some((j: any) => j.status === "running") ? 2000 : false;
    }
  });


  const { data: contractData, isLoading: contractLoading } = useQuery({
    queryKey: ["scraperPayloadContract"],
    queryFn: async () => {
      const res = await apiClient.get<StandardResponse<PayloadContract>>("/scraper/payload-contract");
      return res.data;
    }
  });

  const { data: capsData } = useQuery({
    queryKey: ["scraperCapabilities"],
    queryFn: async () => {
      const res = await apiClient.get<StandardResponse<any[]>>("/scraper/capabilities");
      return res.data;
    }
  });
  const capabilities = capsData?.data || [];

  const { data: settingsData, refetch: refetchSettings } = useQuery({
    queryKey: ["systemSettings"],
    queryFn: async () => {
      const res = await apiClient.get<StandardResponse<any[]>>("/settings");
      return res.data;
    }
  });
  const systemSettings = settingsData?.data || [];

  const updateSettingMutation = useMutation({
    mutationFn: async (args: { key: string; value: any }) => {
      const res = await apiClient.patch(`/settings/${args.key}`, { value: args.value });
      return res.data;
    },
    onSuccess: () => {
      refetchSettings();
    }
  });

  // MUTATION TO TRIGGER EXTERNAL SCRAPER
  const triggerScraperMutation = useMutation({
    mutationFn: async (data: typeof scraperForm) => {
      const res = await apiClient.post("/scraper/trigger", data);
      return res.data;
    },
    onSuccess: (data: any) => {
      setLastTriggerResult(data?.data);
      refetchJobs();
    }
  });

  const jobs = jobsData?.data || [];
  const isAnyJobRunning = jobs.some(job => job.status === "running" || job.status === "pending");
  const isGlobalLoading = triggerScraperMutation.isPending;
  const contract = contractData?.data;

  const handleTriggerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    triggerScraperMutation.mutate(scraperForm);
  };

  return (
    <ProtectedRoute allowedRoles={["super_admin"]}>
      <CursorDotsCanvas />
      <div className="space-y-8 relative z-10">
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 border border-zinc-800 rounded-3xl p-8 text-white space-y-3 shadow-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-semibold uppercase tracking-wider">
            <ShieldAlert className="h-3.5 w-3.5" /> Super Admin Master Authority
          </div>
          <h1 className="text-3xl font-bold">
            Welcome back, Master Administrator ({user?.profile?.full_name || "Super Admin"})! 👋
          </h1>
          <p className="text-zinc-400 text-sm max-w-2xl">
            Full system authority: trigger external web scrapers, view request/response payload contracts, manage admin RBAC roles, and inspect security audit traces.
          </p>
        </div>

        {/* Master Control Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
          <Card
            onClick={() => setActiveTab("scrapers")}
            className={`space-y-2 cursor-pointer transition-all ${
              activeTab === "scrapers" ? "ring-2 ring-emerald-500 bg-emerald-50/40" : ""
            }`}
          >
            <div className="flex items-center justify-between text-zinc-500">
              <span className="text-xs font-bold uppercase tracking-wider">Scraper Jobs</span>
              <Cpu className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="text-3xl font-bold text-emerald-600">{jobs.length}</div>
            <div className="text-[11px] text-emerald-600 font-semibold">Click to trigger external scrapers</div>
          </Card>

          <Card
            onClick={() => setActiveTab("payloads")}
            className={`space-y-2 cursor-pointer transition-all ${
              activeTab === "payloads" ? "ring-2 ring-sky-500 bg-sky-50/40" : ""
            }`}
          >
            <div className="flex items-center justify-between text-zinc-500">
              <span className="text-xs font-bold uppercase tracking-wider">API Payload Contracts</span>
              <Code className="h-4 w-4 text-sky-600" />
            </div>
            <div className="text-lg font-bold text-sky-600">Request & Webhook Schemas</div>
            <div className="text-[11px] text-sky-600 font-semibold">Click to view integration payloads</div>
          </Card>

          <Card
            onClick={() => router.push(getUserSlug(user) ? `/admin/${getUserSlug(user)}` : "/admin")}
            className="space-y-2 cursor-pointer transition-all hover:border-purple-500"
          >
            <div className="flex items-center justify-between text-zinc-500">
              <span className="text-xs font-bold uppercase tracking-wider">Admin Controls</span>
              <Users className="h-4 w-4 text-purple-600" />
            </div>
            <div className="text-lg font-bold text-purple-600">Full Moderation Queue</div>
            <div className="text-[11px] text-purple-600 font-semibold">User directory, approvals & deletions ➔</div>
          </Card>

          <Card className="space-y-2 bg-gradient-to-br from-rose-50/50 to-zinc-50/50 border-rose-200">
            <div className="flex items-center justify-between text-zinc-500">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-700">Security Tier</span>
              <Key className="h-4 w-4 text-rose-600" />
            </div>
            <div className="text-lg font-bold text-rose-700">Level 5 Super Admin</div>
            <div className="text-[11px] text-rose-500">Full System Read / Write / Execute</div>
          </Card>
        </div>

        {/* NAVIGATION TABS */}
        <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-3">
          <button
            onClick={() => setActiveTab("scrapers")}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === "scrapers" ? "bg-emerald-600 text-white" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600"
            }`}
          >
            ⚡ External Scraper Engine & Trigger
          </button>

          <button
            onClick={() => setActiveTab("payloads")}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === "payloads" ? "bg-sky-600 text-white" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600"
            }`}
          >
            📜 Payload Contracts & Webhook Spec
          </button>

          <button
            onClick={() => setActiveTab("settings")}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === "settings" ? "bg-rose-600 text-white" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600"
            }`}
          >
            🔒 System Settings
          </button>
        </div>

        {/* TAB 1: EXTERNAL SCRAPER ENGINE & TRIGGER */}
        {activeTab === "scrapers" && (
          <div className="space-y-6">
            {/* Capability-driven Scraper Engine Cards */}
            <div className="space-y-4">
              {capabilities.map(cap => {
                const isEngineRunning = jobs.some(j => (j.status === "running" || j.status === "pending") && j.source_name === cap.display_name);
                const anyEngineRunning = jobs.some(j => j.status === "running" || j.status === "pending");
                
                return (
                  <Card key={cap.type} className="p-5 space-y-4 border-zinc-200 dark:border-zinc-800 shadow-sm relative overflow-hidden">
                    {/* Background Overlay if another engine is running to show the queue dependency visually */}
                    {anyEngineRunning && !isEngineRunning && (
                       <div className="absolute inset-0 bg-zinc-50/50 dark:bg-zinc-900/50 z-10 flex items-center justify-center backdrop-blur-[1px]">
                         <span className="bg-zinc-800 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">Queue Locked (Other Engine Active)</span>
                       </div>
                    )}
                    
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                          <Cpu className="h-5 w-5 text-emerald-500" /> {cap.display_name}
                        </h2>
                        <p className="text-xs text-zinc-500">
                          {cap.supports_class_filter ? "Parallel crawling for Classes 1 to 12." : "Scrapes all available hub resources simultaneously."}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          onClick={() => {
                            triggerScraperMutation.mutate({
                              scraper_type: cap.type,
                              target_class: "ALL",
                              subject_name: "All Subjects",
                              max_items: cap.supports_class_filter ? 200 : 5000,
                              external_scraper_url: ""
                            });
                          }}
                          disabled={isGlobalLoading || anyEngineRunning}
                          className="bg-sky-600 hover:bg-sky-500 text-white text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isGlobalLoading || isEngineRunning ? (
                            <RefreshCw className="h-3.5 w-3.5 mr-1 animate-spin" />
                          ) : (
                            <Play className="h-3.5 w-3.5 mr-1" />
                          )} {cap.supports_class_filter ? "Scrape All Classes (1-12)" : "Scrape Full Hub"}
                        </Button>
                      </div>
                    </div>

                    {/* Class 1 to 12 Grid Buttons (Only if supported) */}
                    {cap.supports_class_filter && (
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-2 pt-2">
                        {Array.from({ length: 12 }, (_, i) => (i + 1).toString()).map((cNum) => {
                          const isThisClassActive = jobs.some(j => (j.status === "running" || j.status === "pending") && j.class_code === cNum && j.source_name === cap.display_name);
                          const isButtonDisabled = isGlobalLoading || anyEngineRunning;
                          
                          return (
                            <button
                              key={cNum}
                              onClick={() => {
                                triggerScraperMutation.mutate({
                                  scraper_type: cap.type,
                                  target_class: cNum,
                                  subject_name: "All Subjects",
                                  max_items: 100,
                                  external_scraper_url: ""
                                });
                              }}
                              disabled={isButtonDisabled && !isThisClassActive}
                              className={`py-3 px-2 rounded-xl text-xs font-bold transition-all border flex flex-col items-center justify-center gap-1 ${
                                isThisClassActive
                                  ? "opacity-100 cursor-not-allowed bg-emerald-500 text-white border-emerald-600 ring-2 ring-emerald-300"
                                  : isButtonDisabled
                                  ? "opacity-50 cursor-not-allowed bg-zinc-100 dark:bg-zinc-800 border-zinc-200 text-zinc-400"
                                  : "bg-zinc-50 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 border-zinc-200 dark:border-zinc-800 hover:border-emerald-500 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30"
                              }`}
                            >
                              {isThisClassActive ? <RefreshCw className="h-4 w-4 text-white animate-spin" /> : <Code className="h-4 w-4 text-emerald-500" />}
                              <span>Class {cNum}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>

            {/* SCRAPER JOBS TABLE */}
            <Card className="space-y-4 border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
                <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-emerald-500" /> Scraper Execution & Telemetry History
                </h3>
                <Button size="sm" variant="outline" onClick={() => refetchJobs()} className="text-xs">
                  <RefreshCw className="h-3 w-3 mr-1" /> Refresh Telemetry
                </Button>
              </div>

              <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-zinc-50 dark:bg-zinc-900/50 text-zinc-500 text-xs font-semibold uppercase border-b border-zinc-200 dark:border-zinc-800">
                    <tr>
                      <th className="px-4 py-3">Job ID</th>
                      <th className="px-4 py-3">Target Class</th>
                      <th className="px-4 py-3">Source</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Subjects / Chapters Scraped</th>
                      <th className="px-4 py-3">Duration</th>
                      <th className="px-4 py-3">Triggered At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                    {jobsLoading ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-zinc-500 text-xs">
                          Loading scraper execution history...
                        </td>
                      </tr>
                    ) : jobs.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-zinc-500 text-xs">
                          No scraper jobs triggered yet. Click any Class button above to start scraping!
                        </td>
                      </tr>
                    ) : (
                      jobs.map((job) => (
                        <tr key={job.id}>
                          <td className="px-4 py-3 font-mono text-xs text-sky-600 font-bold">#{job.id.substring(0, 8)}</td>
                          <td className="px-4 py-3 font-bold text-purple-600 dark:text-purple-400">Class {job.class_code || "ALL"}</td>
                          <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">{job.source_name}</td>
                          <td className="px-4 py-3 text-xs">
                            <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full uppercase ${
                              job.status === "completed"
                                ? "bg-emerald-100 text-emerald-700"
                                : job.status === "running"
                                ? "bg-amber-100 text-amber-700 animate-pulse"
                                : "bg-rose-100 text-rose-700"
                            }`}>
                              {job.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-zinc-600 dark:text-zinc-400">
                            <div>Subjects: {job.total_subjects_found || 0} | Chapters: {job.total_chapters_found || 0}</div>
                            <div className="text-emerald-600 font-bold">Imported: {job.resources_added || 0}</div>
                          </td>
                          <td className="px-4 py-3 text-xs font-mono text-amber-600 font-bold">{job.duration_seconds || 0}s</td>
                          <td className="px-4 py-3 text-xs text-zinc-400">{new Date(job.created_at).toLocaleString()}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* LAST TRIGGER RESULT PAYLOAD INSPECTOR */}
            {lastTriggerResult && (
              <Card className="space-y-3 bg-zinc-900 text-zinc-100 border-zinc-800">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                  <h3 className="font-bold text-sm text-emerald-400 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" /> Trigger Response Payload Received (Job #{lastTriggerResult.job_id.substring(0, 8)})
                  </h3>
                  <button onClick={() => setLastTriggerResult(null)} className="text-zinc-400 hover:text-white">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <pre className="p-4 rounded-xl bg-black/60 text-xs font-mono overflow-x-auto text-emerald-400">
                  {JSON.stringify(lastTriggerResult, null, 2)}
                </pre>
              </Card>
            )}
          </div>
        )}

        {/* TAB 2: PAYLOAD CONTRACTS & WEBHOOK SPECIFICATION */}
        {activeTab === "payloads" && contract && (
          <div className="space-y-6">
            <Card className="space-y-4">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Code className="h-5 w-5 text-sky-500" /> External Scraper API & Webhook Payload Specification
              </h2>
              <p className="text-xs text-zinc-500">
                Share these exact JSON request and response contracts with external scraper microservice developers.
              </p>

              {/* CONTRACT 1: TRIGGER SCRAPER REQUEST PAYLOAD */}
              <div className="space-y-2">
                <div className="font-bold text-xs uppercase tracking-wider text-sky-600 flex items-center gap-2">
                  <span>1. Trigger Scraper Endpoint (POST /api/v1/scraper/trigger)</span>
                </div>
                <pre className="p-4 rounded-xl bg-zinc-900 text-zinc-100 text-xs font-mono overflow-x-auto">
                  {JSON.stringify(contract.trigger_request_contract, null, 2)}
                </pre>
              </div>

              {/* CONTRACT 2: WEBHOOK CALLBACK PAYLOAD */}
              <div className="space-y-2 pt-4">
                <div className="font-bold text-xs uppercase tracking-wider text-emerald-600 flex items-center gap-2">
                  <span>2. Webhook Callback Endpoint (POST /api/v1/scraper/webhook-callback)</span>
                </div>
                <pre className="p-4 rounded-xl bg-zinc-900 text-zinc-100 text-xs font-mono overflow-x-auto">
                  {JSON.stringify(contract.webhook_callback_contract, null, 2)}
                </pre>
              </div>
            </Card>
          </div>
        )}

        {/* TRIGGER SCRAPER MODAL */}
        {isTriggerModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-xl w-full p-6 space-y-5 shadow-2xl relative">
              <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
                <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <Play className="h-5 w-5 text-emerald-500" /> Trigger External Web Scraper Job
                </h3>
                <button onClick={() => setIsTriggerModalOpen(false)} className="text-zinc-500 hover:text-zinc-700">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleTriggerSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Scraper Source Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="E.g., NCERT & CBSE Official Question Bank"
                    value={scraperForm.source_name}
                    onChange={(e) => setScraperForm({ ...scraperForm, source_name: e.target.value })}
                    className="w-full p-3 border border-zinc-300 dark:border-zinc-700 rounded-xl bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Target Class *</label>
                    <select
                      value={scraperForm.target_class}
                      onChange={(e) => setScraperForm({ ...scraperForm, target_class: e.target.value })}
                      className="w-full p-2.5 border border-zinc-300 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-800 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="ALL">ALL (Full Curriculum 1-12)</option>
                      <option value="1">Class 1</option>
                      <option value="2">Class 2</option>
                      <option value="3">Class 3</option>
                      <option value="4">Class 4</option>
                      <option value="5">Class 5</option>
                      <option value="6">Class 6</option>
                      <option value="7">Class 7</option>
                      <option value="8">Class 8</option>
                      <option value="9">Class 9</option>
                      <option value="10">Class 10</option>
                      <option value="11">Class 11</option>
                      <option value="12">Class 12</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Subject *</label>
                    <select
                      value={scraperForm.subject_name}
                      onChange={(e) => setScraperForm({ ...scraperForm, subject_name: e.target.value })}
                      className="w-full p-2.5 border border-zinc-300 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-800 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="Mathematics">Mathematics</option>
                      <option value="Science">Science</option>
                      <option value="Physics">Physics</option>
                      <option value="Chemistry">Chemistry</option>
                      <option value="Biology">Biology</option>
                      <option value="Computer Science">Computer Science</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Max Items *</label>
                    <input
                      type="number"
                      value={scraperForm.max_items}
                      onChange={(e) => setScraperForm({ ...scraperForm, max_items: parseInt(e.target.value) || 50 })}
                      className="w-full p-2.5 border border-zinc-300 dark:border-zinc-700 rounded-xl bg-transparent text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">External Scraper Server Endpoint URL</label>
                  <input
                    type="url"
                    required
                    placeholder="https://external-scraper-server.com/api/scrape"
                    value={scraperForm.external_scraper_url}
                    onChange={(e) => setScraperForm({ ...scraperForm, external_scraper_url: e.target.value })}
                    className="w-full p-3 border border-zinc-300 dark:border-zinc-700 rounded-xl bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-xs"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <Button variant="outline" type="button" onClick={() => setIsTriggerModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" isLoading={triggerScraperMutation.isPending} className="bg-emerald-600 hover:bg-emerald-500 text-white">
                    Trigger Scraper & Generate Payload
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
        {/* TAB 3: SYSTEM SETTINGS */}
        {activeTab === "settings" && (
          <div className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <Settings className="w-5 h-5 text-rose-500" /> System Configurations
              </h2>
              <p className="text-zinc-500 text-sm">
                Manage global application settings, verification toggles, and security overrides.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-6 border-zinc-200 dark:border-zinc-800">
                <div className="flex justify-between items-start mb-4">
                  <div className="space-y-1">
                    <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                      <UserPlus className="w-4 h-4 text-emerald-500" />
                      Strict Volunteer Verification
                    </h3>
                    <p className="text-sm text-zinc-500">
                      If disabled, newly registered Volunteers/Alumni will be automatically approved and their uploaded resources bypass manual admin review.
                    </p>
                  </div>
                  <div>
                    {(() => {
                      const strictVerifySetting = systemSettings.find(s => s.key === "require_volunteer_verification");
                      const isStrict = strictVerifySetting ? strictVerifySetting.value === true : true;
                      
                      return (
                        <div className="flex items-center">
                           <button
                             onClick={() => updateSettingMutation.mutate({ key: "require_volunteer_verification", value: !isStrict })}
                             className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${isStrict ? 'bg-emerald-500' : 'bg-zinc-300 dark:bg-zinc-700'}`}
                           >
                             <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isStrict ? 'translate-x-6' : 'translate-x-1'}`} />
                           </button>
                        </div>
                      )
                    })()}
                  </div>
                </div>
                <div className="text-xs text-zinc-500 bg-zinc-50 dark:bg-zinc-800/50 p-3 rounded-lg flex items-center gap-2 border border-zinc-100 dark:border-zinc-800">
                   <ShieldAlert className="w-4 h-4 text-amber-500" />
                   Disabling this reduces onboarding friction but increases spam risk.
                </div>
              </Card>
            </div>
          </div>
        )}

      </div>
    </ProtectedRoute>
  );
}
