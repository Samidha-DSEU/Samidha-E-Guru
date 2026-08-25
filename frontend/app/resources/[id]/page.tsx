"use client";

import React, { use, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { BookOpen, ExternalLink, Bookmark, Eye, ArrowLeft, Share2, ShieldCheck, Sparkles, Check } from "lucide-react";
import { resourceService } from "@/features/resources/services/resourceService";
import { PdfPreviewTab } from "@/features/learn_ai/components/PdfPreviewTab";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Card";
import { ErrorState } from "@/components/ui/ErrorState";
import { formatDate } from "@/lib/utils";
import { toast } from "react-hot-toast";

function ResourceDetailsContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const searchParams = useSearchParams();

  const fromSource = searchParams.get("fromSource");
  const fromClass = searchParams.get("fromClass");
  const fromSubject = searchParams.get("fromSubject");
  const fromCategory = searchParams.get("fromCategory");

  const backParams = new URLSearchParams();
  if (fromSource) backParams.set("source", fromSource);
  if (fromClass) backParams.set("class", fromClass);
  if (fromSubject) backParams.set("subject", fromSubject);
  if (fromCategory) backParams.set("category", fromCategory);

  const backHref = backParams.toString() ? `/resources?${backParams.toString()}` : "/resources";
  const backLabel = fromClass && fromSubject
    ? `Back to ${fromSource ? fromSource.toUpperCase() : ''} ${fromClass} (${fromSubject})`
    : fromClass
    ? `Back to ${fromClass}`
    : "Back to Resources Hub";

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["resource", id],
    queryFn: () => resourceService.getResourceById(id)
  });

  const bookmarkMutation = useMutation({
    mutationFn: () => resourceService.bookmarkResource(id),
    onSuccess: (res) => {
      refetch();
      if (res.data?.bookmarked) {
        toast.success("Added to bookmarks!");
      } else {
        toast.success("Removed from bookmarks.");
      }
    },
    onError: () => {
      toast.error("Failed to update bookmark. Please try again or login.");
    }
  });

  const resource = data?.data;

  const router = useRouter();

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 py-6">
        <Skeleton className="h-8 w-1/4" />
        <Skeleton className="h-64 w-full rounded-2xl" />
        <Skeleton className="h-10 w-3/4" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  if (isError || !resource) {
    return (
      <div className="max-w-4xl mx-auto py-12">
        <ErrorState message="Could not load resource details." onRetry={refetch} />
      </div>
    );
  }

  const pdfUrl = resource.external_url;
  const isNcert = resource.source_type === "ncert" || resource.title.toLowerCase().includes("ncert");

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-4">
      {/* Back Link */}
      <Link 
        href={backHref} 
        className="inline-flex items-center text-sm text-zinc-500 hover:text-sky-600 font-medium transition-colors cursor-pointer bg-transparent border-0 p-0"
      >
        <ArrowLeft className="h-4 w-4 mr-1.5" /> {backLabel}
      </Link>

      {/* Main Resource Card */}
      <Card className="space-y-6">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="px-3 py-1 bg-sky-500/10 text-sky-600 dark:text-sky-400 backdrop-blur-md rounded-lg text-xs font-semibold uppercase border border-sky-200 dark:border-sky-800 flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5 text-sky-500" />
              {isNcert ? "Verified NCERT Content" : `Verified ${resource.source_type?.toUpperCase() || "SAMIDHA"} Content`}
            </span>

            {resource.external_url.includes("ncert.nic.in") || resource.external_url.includes("notopedia.com") ? (
              <div className="px-3 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 flex items-center gap-1.5">
                <span className="text-xs font-semibold text-rose-600 dark:text-rose-400">
                  Learn with AI not available with this PDF/link
                </span>
              </div>
            ) : (
              <Link href={`/resources/${id}/learn-ai`}>
                <Button size="sm" className="bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white font-semibold text-xs shadow-md">
                  <Sparkles className="h-3.5 w-3.5 mr-1.5 text-amber-300" /> Open Learn With AI Workspace
                </Button>
              </Link>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            {resource.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-500">
            <span className="flex items-center gap-1">
              <Eye className="h-3.5 w-3.5" />
              {resource.views_count} Views
            </span>
            <button 
              onClick={() => bookmarkMutation.mutate()}
              disabled={bookmarkMutation.isPending}
              className={`flex items-center gap-1 px-2 py-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors ${bookmarkMutation.isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
              title="Bookmark this resource"
            >
              <Bookmark className={`h-3.5 w-3.5 ${resource.is_bookmarked ? 'fill-sky-500 text-sky-500' : ''}`} />
              <span>{resource.bookmarks_count} Bookmarks</span>
            </button>
            <span>Added on {formatDate(resource.created_at)}</span>
          </div>
        </div>

        <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed border-t border-zinc-100 dark:border-zinc-800 pt-4">
          {resource.description || "Structured educational material verified by SAMIDHA for academic excellence."}
        </p>

        {/* Official Document PDF Viewer */}
        <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800">
          <PdfPreviewTab pdfUrl={pdfUrl} title={resource.title} />
        </div>
      </Card>
    </div>
  );
}

export default function ResourceDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={
      <div className="max-w-4xl mx-auto space-y-6 py-6">
        <Skeleton className="h-8 w-1/4" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    }>
      <ResourceDetailsContent params={params} />
    </Suspense>
  );
}
