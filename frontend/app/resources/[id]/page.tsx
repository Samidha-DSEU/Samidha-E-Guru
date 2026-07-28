"use client";

import React, { use } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, ExternalLink, Bookmark, Eye, ArrowLeft, Share2, CheckCircle2, ShieldCheck } from "lucide-react";
import { resourceService } from "@/features/resources/services/resourceService";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Card";
import { ErrorState } from "@/components/ui/ErrorState";
import { formatDate } from "@/lib/utils";

export default function ResourceDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["resource", id],
    queryFn: () => resourceService.getResourceById(id)
  });

  const resource = data?.data;

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

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-4">
      {/* Back Link */}
      <Link href="/resources" className="inline-flex items-center text-sm text-zinc-500 hover:text-sky-600 font-medium transition-colors">
        <ArrowLeft className="h-4 w-4 mr-1.5" /> Back to Resources
      </Link>

      {/* Main Resource Card */}
      <Card className="space-y-6">
        <div className="h-64 sm:h-80 w-full rounded-xl bg-zinc-100 dark:bg-zinc-800 overflow-hidden relative border border-zinc-200 dark:border-zinc-800">
          {resource.thumbnail_url ? (
            <img src={resource.thumbnail_url} alt={resource.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-zinc-400 gap-2">
              <BookOpen className="h-16 w-16 opacity-40" />
              <span className="text-xs font-medium">Educational Material</span>
            </div>
          )}
          <span className="absolute top-4 right-4 px-3 py-1 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md rounded-lg text-xs font-semibold uppercase text-sky-600 dark:text-sky-400 border border-zinc-200 dark:border-zinc-800 flex items-center gap-1">
            <ShieldCheck className="h-3.5 w-3.5 text-sky-500" />
            Verified Content
          </span>
        </div>

        <div className="space-y-3">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            {resource.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-500">
            <span className="flex items-center gap-1">
              <Eye className="h-3.5 w-3.5" />
              {resource.views_count} Views
            </span>
            <span className="flex items-center gap-1">
              <Bookmark className="h-3.5 w-3.5" />
              {resource.bookmarks_count} Bookmarks
            </span>
            <span>Added on {formatDate(resource.created_at)}</span>
          </div>
        </div>

        <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed border-t border-zinc-100 dark:border-zinc-800 pt-4">
          {resource.description || "Structured educational material verified by SAMIDHA for academic excellence."}
        </p>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
          <a href={resource.external_url} target="_blank" rel="noopener noreferrer">
            <Button size="lg">
              Open Official Resource
              <ExternalLink className="h-4 w-4 ml-2" />
            </Button>
          </a>

          <Button variant="outline" size="lg">
            <Bookmark className="h-4 w-4 mr-2" /> Bookmark Resource
          </Button>

          <Button variant="ghost" size="lg">
            <Share2 className="h-4 w-4 mr-2" /> Share
          </Button>
        </div>
      </Card>
    </div>
  );
}
