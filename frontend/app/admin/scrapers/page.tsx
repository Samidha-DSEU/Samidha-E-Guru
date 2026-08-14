"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { TerminalLogStream } from "./Terminal";
import {
  ArrowLeft,
  Play,
  RefreshCw,
  Trash2,
  Database,
  CheckCircle2,
  XCircle,
  Clock,
  BookOpen,
  Layers,
  FileSpreadsheet,
  AlertTriangle,
  ExternalLink,
  Search,
  Filter
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { apiClient } from "@/services/apiClient";
import { StandardResponse } from "@/types/api";

interface ScraperJob {
  id: string;
  source_name: string;
  status: string;
  class_code: string;
  total_subjects_found: number;
  total_chapters_found: number;
  scraped_success_count: number;
  scraped_failed_count: number;
  resources_found: number;
  resources_added: number;
  duration_seconds: number;
  telemetry_details: any;
  scraped_sheet: Array<{
    class: string;
    subject: string;
    chapter_no: string;
    chapter_name: string;
    pdf_url: string;
    status: string;
    message: string;
  }>;
  created_at: string;
}

export default function ScraperManagerPage() {
  const [jobs, setJobs] = useState<ScraperJob[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [scrapingClass, setScrapingClass] = useState<string | null>(null);
  const [purging, setPurging] = useState<boolean>(false);
  const [selectedJob, setSelectedJob] = useState<ScraperJob | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const fetchJobs = async () => {
    try {
      const res = await apiClient.get<StandardResponse<ScraperJob[]>>("/scraper/jobs");
      if (res.data?.success && Array.isArray(res.data.data)) {
        setJobs(res.data.data);
        if (res.data.data.length > 0 && !selectedJob) {
          setSelectedJob(res.data.data[0]);
        }
      }
    } catch (err) {
      console.error("Failed fetching scraper jobs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
    const interval = setInterval(fetchJobs, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleTriggerScrape = async (classCode: string) => {
    setScrapingClass(classCode);
    setMessage(null);
    try {
      const res = await apiClient.post<StandardResponse<any>>("/scraper/trigger", {
        source_name: "NCERT Metadata Scraper",
        target_class: classCode,
        subject_name: "All Subjects",
        max_items: 100
      });
      if (res.data?.success) {
        setMessage({
          text: `Scraping process launched for Class ${classCode}! Telemetry will update in real time.`,
          type: "success"
        });
        fetchJobs();
      } else {
        setMessage({ text: res.data?.message || "Scraping trigger failed.", type: "error" });
      }
    } catch (err: any) {
      setMessage({ text: err.response?.data?.detail || "API Error launching scraper job.", type: "error" });
    } finally {
      setScrapingClass(null);
    }
  };

  const handlePurgeNCERT = async () => {
    if (!confirm("Are you sure you want to PURGE all NCERT resources and folders from the database? This cannot be undone.")) {
      return;
    }
    setPurging(true);
    setMessage(null);
    try {
      const res = await apiClient.delete<StandardResponse<any>>("/scraper/purge-ncert");
      if (res.data?.success) {
        setMessage({
          text: `Database Purged Successfully! Removed ${res.data.data?.deleted_resources || 0} NCERT entries.`,
          type: "success"
        });
        fetchJobs();
      } else {
        setMessage({ text: res.data?.message || "Failed purging database.", type: "error" });
      }
    } catch (err: any) {
      setMessage({ text: err.response?.data?.detail || "Error connecting to backend for database purge.", type: "error" });
    } finally {
      setPurging(false);
    }
  };

  const latestJob = jobs.length > 0 ? jobs[0] : null;
  const activeSheet = selectedJob ? selectedJob.scraped_sheet : (latestJob ? latestJob.scraped_sheet : []);

  const filteredSheet = activeSheet.filter(item => {
    const matchesSearch =
      item.class.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.chapter_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const classesList = Array.from({ length: 12 }, (_, i) => (i + 1).toString());

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link href="/admin" className="inline-flex items-center text-xs text-zinc-500 hover:text-sky-600 font-medium mb-1">
            <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Back to Admin Dashboard
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
            <Database className="h-7 w-7 text-sky-500" /> NCERT Scraper & Telemetry Control Center
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400 text-sm mt-0.5">
            Class-wise multi-threaded scraper, execution telemetry sheets, and database purge manager.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={fetchJobs}
            disabled={loading}
            className="text-xs border-zinc-200 dark:border-zinc-800"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} /> Refresh
          </Button>

          <Button
            variant="outline"
            onClick={handlePurgeNCERT}
            disabled={purging}
            className="text-xs bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800 hover:bg-rose-100"
          >
            <Trash2 className={`h-3.5 w-3.5 mr-1.5 ${purging ? "animate-spin" : ""}`} /> Purge NCERT DB Data
          </Button>
        </div>
      </div>

      {/* Alert Banner */}
      {message && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between text-sm ${
            message.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200"
              : "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {message.type === "success" ? <CheckCircle2 className="h-5 w-5 text-emerald-500" /> : <AlertTriangle className="h-5 w-5 text-rose-500" />}
            <span>{message.text}</span>
          </div>
          <button onClick={() => setMessage(null)} className="text-xs font-semibold hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* STEP 1: CLASS-WISE SCRAPER LAUNCHER */}
      <Card className="p-5 space-y-4 border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Play className="h-4 w-4 text-sky-500" /> Step 1: Select Class to Scrape
            </h3>
            <p className="text-xs text-zinc-500">Trigger individual class scrapers or launch full 1-12 curriculum scraping.</p>
          </div>
          
          <Button
            size="sm"
            onClick={() => handleTriggerScrape("ALL")}
            disabled={scrapingClass !== null || jobs.some(j => (j.status === "running" || j.status === "pending") && j.class_code === "ALL")}
            className="bg-sky-600 hover:bg-sky-700 text-white text-xs disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {scrapingClass === "ALL" || jobs.some(j => (j.status === "running" || j.status === "pending") && j.class_code === "ALL") ? (
              <RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" />
            ) : (
              <Play className="h-3.5 w-3.5 mr-1.5" />
            )}

            Scrape All Classes (1-12)
          </Button>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-2 pt-2">
          {classesList.map(cNum => {
            const isScrapingThis = scrapingClass === cNum || jobs.some(j => (j.status === "running" || j.status === "pending") && j.class_code === cNum);
            return (
              <button
                key={cNum}
                onClick={() => handleTriggerScrape(cNum)}
                disabled={scrapingClass !== null || isScrapingThis}
                className={`py-3 px-2 rounded-xl text-xs font-bold transition-all border flex flex-col items-center justify-center gap-1 ${
                  isScrapingThis
                    ? "opacity-80 cursor-not-allowed bg-sky-500 text-white border-sky-600 ring-2 ring-sky-300"
                    : scrapingClass !== null
                    ? "opacity-50 cursor-not-allowed bg-zinc-50 dark:bg-zinc-900 text-zinc-400 border-zinc-200 dark:border-zinc-800"
                    : "bg-zinc-50 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 border-zinc-200 dark:border-zinc-800 hover:border-sky-500 hover:bg-sky-50/50 dark:hover:bg-sky-950/30"
                }`}
              >
                {isScrapingThis ? (
                  <RefreshCw className="h-4 w-4 animate-spin text-white" />
                ) : (
                  <BookOpen className="h-4 w-4 text-sky-500" />
                )}
                <span>Class {cNum}</span>
              </button>
            );
          })}

        </div>
      </Card>

      {/* LIVE TERMINAL */}
      <TerminalLogStream />

      {/* STEP 2: TELEMETRY DASHBOARD METRICS */}
      {latestJob && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <Card className="p-4 border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center text-xs font-medium text-zinc-500 mb-1">
              <Clock className="h-3.5 w-3.5 mr-1 text-amber-500" /> Duration
            </div>
            <div className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
              {latestJob.duration_seconds || 0}s
            </div>
            <div className="text-[10px] text-zinc-400 mt-0.5">Execution Time</div>
          </Card>

          <Card className="p-4 border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center text-xs font-medium text-zinc-500 mb-1">
              <Layers className="h-3.5 w-3.5 mr-1 text-sky-500" /> Subjects
            </div>
            <div className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
              {latestJob.total_subjects_found || 0}
            </div>
            <div className="text-[10px] text-zinc-400 mt-0.5">Total Subjects Found</div>
          </Card>

          <Card className="p-4 border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center text-xs font-medium text-zinc-500 mb-1">
              <BookOpen className="h-3.5 w-3.5 mr-1 text-indigo-500" /> Chapters
            </div>
            <div className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
              {latestJob.total_chapters_found || 0}
            </div>
            <div className="text-[10px] text-zinc-400 mt-0.5">Total Chapters Scraped</div>
          </Card>

          <Card className="p-4 border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center text-xs font-medium text-zinc-500 mb-1">
              <CheckCircle2 className="h-3.5 w-3.5 mr-1 text-emerald-500" /> Success Rate
            </div>
            <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
              {latestJob.scraped_success_count || 0}
            </div>
            <div className="text-[10px] text-zinc-400 mt-0.5">Stored Resources</div>
          </Card>

          <Card className="p-4 border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center text-xs font-medium text-zinc-500 mb-1">
              <XCircle className="h-3.5 w-3.5 mr-1 text-rose-500" /> Failures
            </div>
            <div className="text-xl font-bold text-rose-600 dark:text-rose-400">
              {latestJob.scraped_failed_count || 0}
            </div>
            <div className="text-[10px] text-zinc-400 mt-0.5">Failed Resources</div>
          </Card>

          <Card className="p-4 border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center text-xs font-medium text-zinc-500 mb-1">
              <Database className="h-3.5 w-3.5 mr-1 text-purple-500" /> Target Class
            </div>
            <div className="text-xl font-bold text-purple-600 dark:text-purple-400">
              Class {latestJob.class_code}
            </div>
            <div className="text-[10px] text-zinc-400 mt-0.5">Active Job Filter</div>
          </Card>
        </div>
      )}

      {/* STEP 3: SCRAPING RECORD EXECUTION SHEET */}
      <Card className="p-5 space-y-4 border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 dark:border-zinc-800 pb-4">
          <div>
            <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4 text-emerald-500" /> Scraping Record Execution Sheet
            </h3>
            <p className="text-xs text-zinc-500">Live detailed log of all scraped chapters, subjects, and PDF download URLs.</p>
          </div>

          <div className="flex items-center gap-2">
            {/* Search Input */}
            <div className="relative">
              <Search className="h-3.5 w-3.5 absolute left-2.5 top-2.5 text-zinc-400" />
              <input
                type="text"
                placeholder="Search sheet..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500 w-44"
              />
            </div>

            {/* Filter Dropdown */}
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="py-1.5 px-2.5 text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:outline-none text-zinc-700 dark:text-zinc-300"
            >
              <option value="ALL">All Status</option>
              <option value="SUCCESS">Success Only</option>
              <option value="FAILED">Failed Only</option>
            </select>
          </div>
        </div>

        {/* Interactive Spreadsheet Table */}
        <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-zinc-100 dark:bg-zinc-900/80 text-zinc-600 dark:text-zinc-400 font-semibold border-b border-zinc-200 dark:border-zinc-800">
                <th className="py-2.5 px-3">#</th>
                <th className="py-2.5 px-3">Target Class</th>
                <th className="py-2.5 px-3">Subject</th>
                <th className="py-2.5 px-3">Chapter No.</th>
                <th className="py-2.5 px-3">Chapter Name</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">PDF File Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 text-zinc-800 dark:text-zinc-200">
              {filteredSheet.length > 0 ? (
                filteredSheet.map((item, index) => (
                  <tr key={index} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
                    <td className="py-2.5 px-3 font-mono text-zinc-400">{index + 1}</td>
                    <td className="py-2.5 px-3 font-medium text-purple-600 dark:text-purple-400">{item.class}</td>
                    <td className="py-2.5 px-3 font-semibold">{item.subject}</td>
                    <td className="py-2.5 px-3 font-mono">Ch. {item.chapter_no}</td>
                    <td className="py-2.5 px-3">{item.chapter_name}</td>
                    <td className="py-2.5 px-3">
                      {item.status === "SUCCESS" ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950 text-emerald-600 border border-emerald-200 dark:border-emerald-800">
                          <CheckCircle2 className="h-3 w-3 mr-1 text-emerald-500" /> SUCCESS
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 dark:bg-rose-950 text-rose-600 border border-rose-200 dark:border-rose-800">
                          <XCircle className="h-3 w-3 mr-1 text-rose-500" /> FAILED
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      {item.pdf_url && item.pdf_url !== "N/A" ? (
                        <a
                          href={item.pdf_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-sky-600 hover:text-sky-700 font-semibold hover:underline"
                        >
                          View PDF <ExternalLink className="h-3 w-3 ml-1" />
                        </a>
                      ) : (
                        <span className="text-zinc-400 text-[10px]">No Link</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-zinc-400">
                    No scraping records found. Click a class button above to launch scraping.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
