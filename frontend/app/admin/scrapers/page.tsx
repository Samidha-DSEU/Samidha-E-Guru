"use client";

import React from "react";
import Link from "next/link";
import { Cpu, ArrowLeft, Play, RefreshCw, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function ScraperManagerPage() {
  return (
    <div className="space-y-6">
      <Link href="/admin" className="inline-flex items-center text-sm text-zinc-500 hover:text-sky-600 font-medium">
        <ArrowLeft className="h-4 w-4 mr-1.5" /> Back to Admin Dashboard
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Educational Scraper Engine
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400 text-sm">
            Monitor metadata scrapers for NCERT, DIKSHA, SWAYAM, NPTEL, and trigger automated duplicate-checked crawlers.
          </p>
        </div>

        <Button>
          <Play className="h-4 w-4 mr-2" /> Run All Scrapers
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-lg">NCERT Portal Scraper</h3>
            <span className="px-2.5 py-0.5 bg-emerald-50 dark:bg-emerald-950 text-emerald-600 text-xs font-semibold rounded border border-emerald-200 dark:border-emerald-800">
              Active
            </span>
          </div>

          <p className="text-xs text-zinc-500">Crawls official NCERT digital textbook links and chapter PDF metadata.</p>

          <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs text-zinc-500">
            <span>Last Run: 2 hours ago</span>
            <span className="text-emerald-600 font-medium">14 New Resources Added</span>
          </div>

          <Button size="sm" variant="outline" className="w-full">
            <RefreshCw className="h-3.5 w-3.5 mr-1" /> Trigger Scraper Now
          </Button>
        </Card>

        <Card className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-lg">DIKSHA Metadata Scraper</h3>
            <span className="px-2.5 py-0.5 bg-emerald-50 dark:bg-emerald-950 text-emerald-600 text-xs font-semibold rounded border border-emerald-200 dark:border-emerald-800">
              Active
            </span>
          </div>

          <p className="text-xs text-zinc-500">Crawls DIKSHA portal educational videos and interactive worksheets.</p>

          <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs text-zinc-500">
            <span>Last Run: 5 hours ago</span>
            <span className="text-emerald-600 font-medium">8 New Resources Added</span>
          </div>

          <Button size="sm" variant="outline" className="w-full">
            <RefreshCw className="h-3.5 w-3.5 mr-1" /> Trigger Scraper Now
          </Button>
        </Card>
      </div>
    </div>
  );
}
