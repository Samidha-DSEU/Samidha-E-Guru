"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Filter, BookOpen, ExternalLink, Bookmark, Eye, CheckCircle } from "lucide-react";
import { apiClient } from "@/services/apiClient";
import { StandardResponse, ResourceItem } from "@/types/api";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";

export default function ResourcesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["resources", searchTerm, page],
    queryFn: async () => {
      const res = await apiClient.get<StandardResponse<ResourceItem[]>>("/resources", {
        params: { search: searchTerm, page, limit: 12 }
      });
      return res.data;
    }
  });

  const resources = data?.data || [];
  const meta = data?.meta;

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Educational Resource Hub
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400 text-sm">
          Browse verified NCERT, DIKSHA, SWAYAM, NPTEL, and SAMIDHA study materials.
        </p>
      </div>

      {/* Search Bar & Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search by topic, chapter, or keyword..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>

        <Button variant="outline" className="sm:w-auto">
          <Filter className="h-4 w-4 mr-2" />
          Filters
        </Button>
      </div>

      {/* Resource Grid / UI States */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="space-y-4">
              <Skeleton className="h-40 w-full rounded-lg" />
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </Card>
          ))}
        </div>
      ) : isError ? (
        <ErrorState onRetry={refetch} />
      ) : resources.length === 0 ? (
        <EmptyState
          title="No educational resources found"
          description="Try adjusting your search keywords or clearing filters."
          actionText="Clear Search"
          onAction={() => setSearchTerm("")}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {resources.map((res) => (
            <Card key={res.id} className="flex flex-col justify-between space-y-4 group">
              <div className="space-y-3">
                <div className="h-40 w-full rounded-lg bg-zinc-100 dark:bg-zinc-800 overflow-hidden relative border border-zinc-200/50 dark:border-zinc-800">
                  {res.thumbnail_url ? (
                    <img src={res.thumbnail_url} alt={res.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-400">
                      <BookOpen className="h-10 w-10 opacity-50" />
                    </div>
                  )}
                  <span className="absolute top-3 right-3 px-2.5 py-1 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md rounded-md text-[10px] font-semibold tracking-wide uppercase text-sky-600 dark:text-sky-400 border border-zinc-200 dark:border-zinc-800">
                    Verified
                  </span>
                </div>

                <h3 className="font-semibold text-base text-zinc-900 dark:text-zinc-100 line-clamp-2 group-hover:text-sky-600 transition-colors">
                  {res.title}
                </h3>
                <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed">
                  {res.description || "Structured study material verified for student preparation."}
                </p>
              </div>

              <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-xs text-zinc-500">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <Eye className="h-3.5 w-3.5" />
                    {res.views_count}
                  </span>
                  <span className="flex items-center gap-1">
                    <Bookmark className="h-3.5 w-3.5" />
                    {res.bookmarks_count}
                  </span>
                </div>

                <a
                  href={res.external_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center font-medium text-sky-600 hover:text-sky-500"
                >
                  Open Resource
                  <ExternalLink className="h-3.5 w-3.5 ml-1" />
                </a>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
