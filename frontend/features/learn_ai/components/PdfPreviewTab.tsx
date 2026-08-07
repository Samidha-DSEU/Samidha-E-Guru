"use client";

import React, { useState } from "react";
import { FileText, Download, ExternalLink, Maximize2, Minimize2, ShieldCheck, Zap, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface PdfPreviewTabProps {
  pdfUrl: string;
  title: string;
}

export function PdfPreviewTab({ pdfUrl, title }: PdfPreviewTabProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [viewerMode, setViewerMode] = useState<"proxy" | "google" | "direct">("proxy");

  // API Base URL for SAMIDHA High-Speed Stream Proxy
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
  const proxyStreamUrl = `${apiBaseUrl}/resources/pdf-proxy/stream?url=${encodeURIComponent(pdfUrl)}`;
  const googleDocsViewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(pdfUrl)}&embedded=true`;

  const embedSrc = viewerMode === "proxy" ? proxyStreamUrl : viewerMode === "google" ? googleDocsViewerUrl : pdfUrl;

  return (
    <div className="space-y-4">
      {/* Top Action & Metadata Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-sky-500/20 to-indigo-500/20 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold border border-sky-200 dark:border-sky-800/60">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
              {title}
            </h3>
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                <ShieldCheck className="h-3.5 w-3.5" /> Official Verified NCERT PDF
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls & High-Speed Viewer Selector */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 p-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-xs">
            <button
              onClick={() => setViewerMode("proxy")}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all flex items-center gap-1 ${
                viewerMode === "proxy"
                  ? "bg-sky-600 text-white shadow-sm"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900"
              }`}
              title="Fast SAMIDHA Backend Stream Proxy bypassing slow NCERT servers"
            >
              <Zap className="h-3 w-3" /> Fast Proxy Engine
            </button>

            <button
              onClick={() => setViewerMode("google")}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                viewerMode === "google"
                  ? "bg-sky-600 text-white shadow-sm"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900"
              }`}
            >
              Google Cloud Mode
            </button>

            <button
              onClick={() => setViewerMode("direct")}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                viewerMode === "direct"
                  ? "bg-sky-600 text-white shadow-sm"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900"
              }`}
            >
              Direct Link
            </button>
          </div>

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 hover:text-sky-600 transition-colors"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Viewer"}
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>

          <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm">
              <ExternalLink className="h-3.5 w-3.5 mr-1.5" /> Open Direct
            </Button>
          </a>

          <a href={proxyStreamUrl} download={`${title}.pdf`} target="_blank" rel="noopener noreferrer">
            <Button size="sm" className="bg-sky-600 hover:bg-sky-500 text-white">
              <Download className="h-3.5 w-3.5 mr-1.5" /> Download PDF
            </Button>
          </a>
        </div>
      </div>

      {/* Professional Theme PDF Preview Container */}
      <div
        className={`w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-950 overflow-hidden relative transition-all duration-300 ${
          isFullscreen ? "fixed inset-4 z-50 h-[calc(100vh-32px)] shadow-2xl" : "h-[680px]"
        }`}
      >
        <iframe
          src={embedSrc}
          title={`PDF Preview - ${title}`}
          className="w-full h-full border-0 bg-white"
        />
      </div>
    </div>
  );
}
