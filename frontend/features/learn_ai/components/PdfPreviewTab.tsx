"use client";

import React, { useState } from "react";
import { FileText, Download, ExternalLink, Maximize2, Minimize2, ShieldCheck, Sparkles, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface PdfPreviewTabProps {
  pdfUrl: string;
  title: string;
}

export function PdfPreviewTab({ pdfUrl, title }: PdfPreviewTabProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [iframeError, setIframeError] = useState(false);

  // Google Docs viewer wrapper fallback for cross-origin NCERT PDFs
  const googleDocsViewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(pdfUrl)}&embedded=true`;
  const embedSrc = iframeError ? googleDocsViewerUrl : pdfUrl;

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
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIframeError(!iframeError)}
            className="text-xs px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 hover:border-sky-500 transition-all"
          >
            {iframeError ? "Use Direct Viewer" : "Use Google Viewer Mode"}
          </button>

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

          <a href={pdfUrl} download target="_blank" rel="noopener noreferrer">
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
          onError={() => setIframeError(true)}
        />
      </div>
    </div>
  );
}
