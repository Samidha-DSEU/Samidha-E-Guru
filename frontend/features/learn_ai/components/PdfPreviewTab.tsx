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
  const [isLoading, setIsLoading] = useState(true);

  // API Base URL for SAMIDHA High-Speed Stream Proxy
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "https://samidha-e-guru.onrender.com/api/v1";
  const proxyStreamUrl = `${apiBaseUrl}/resources/pdf-proxy/stream?url=${encodeURIComponent(pdfUrl)}`;

  const embedSrc = proxyStreamUrl;

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

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 p-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-xs">
            <span className="px-3 py-1.5 rounded-md font-semibold bg-sky-600 text-white shadow-sm flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5" /> Document Preview
            </span>
          </div>

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 hover:text-sky-600 transition-colors"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Viewer"}
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>

          <a href={proxyStreamUrl} download={`${title}.pdf`} target="_blank" rel="noopener noreferrer">
            <Button size="sm" className="bg-sky-600 hover:bg-sky-500 text-white">
              <Download className="h-3.5 w-3.5 mr-1.5" /> Download PDF
            </Button>
          </a>
        </div>
      </div>

      {/* Professional Theme PDF Preview Container */}
      <div
        className={`w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 overflow-hidden relative transition-all duration-300 ${
          isFullscreen ? "fixed inset-4 z-50 h-[calc(100vh-32px)] shadow-2xl" : "h-[680px]"
        }`}
      >
        {isLoading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-zinc-50/80 dark:bg-zinc-950/80 backdrop-blur-md">
            <RefreshCw className="h-10 w-10 text-sky-500 animate-spin mb-4" />
            <p className="text-base font-bold text-zinc-700 dark:text-zinc-300">Loading Document...</p>
            <p className="text-xs text-zinc-500 mt-2 font-medium">Establishing secure stream with NCERT servers</p>
          </div>
        )}
        <iframe
          src={embedSrc}
          onLoad={() => {
            // Ensure loading state is visible for at least 1.5s to avoid flashing on quick errors
            setTimeout(() => setIsLoading(false), 1500);
          }}
          title={`PDF Preview - ${title}`}
          className={`w-full h-full border-0 bg-white transition-opacity duration-1000 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
        />
      </div>
    </div>
  );
}
