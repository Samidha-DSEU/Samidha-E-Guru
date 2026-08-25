"use client";

import React, { useState, useEffect, Suspense, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useInView } from "react-intersection-observer";
import { Search, BookOpen, ExternalLink, Star, Folder, ChevronRight, User, Calendar, X, Sparkles, Loader2, Bot } from "lucide-react";
import { apiClient } from "@/services/apiClient";
import { StandardResponse } from "@/types/api";
import { Button } from "@/components/ui/Button";
import { Card, Skeleton } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { CursorDotsCanvas } from "@/components/ui/CursorDotsCanvas";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { AnimatedText } from "@/components/ui/AnimatedText";
import { TypewriterText } from "@/components/ui/TypewriterText";

interface ResourceLibraryItem {
  id: string;
  title: string;
  description?: string;
  thumbnail_url?: string;
  external_url: string;
  target_class?: string;
  subject_name?: string;
  resource_category?: string;
  source_type: string;
  uploader_name: string;
  uploader_role: string;
  rating_avg: number;
  rating_count: number;
  views_count: number;
  bookmarks_count: number;
  created_at: string;
}

interface ResourcesPaginated {
  data: ResourceLibraryItem[];
  meta: {
    page?: number;
    limit?: number;
    total_items?: number;
    total_pages?: number;
    has_next?: boolean;
  };
}

interface FolderClass { class: string; }
interface FolderSubject { subject: string; }

function ResourcesPageContent() {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();

  const paramSource = searchParams.get("source") || "all";
  const paramClass = searchParams.get("class");
  const paramSubject = searchParams.get("subject");
  const paramCategory = searchParams.get("category");

  const [activeSource, setActiveSource] = useState<string>(paramSource);
  const [selectedClass, setSelectedClass] = useState<string | null>(paramClass);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(paramSubject);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(paramCategory);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<string>("latest");

  // Sync state to URL
  useEffect(() => {
    const params = new URLSearchParams();
    if (activeSource !== "all") params.set("source", activeSource);
    if (selectedClass) params.set("class", selectedClass);
    if (selectedSubject) params.set("subject", selectedSubject);
    if (selectedCategory) params.set("category", selectedCategory);
    
    const queryStr = params.toString();
    const newUrl = queryStr ? `/resources?${queryStr}` : "/resources";
    window.history.replaceState(null, "", newUrl);
  }, [activeSource, selectedClass, selectedSubject, selectedCategory]);

  // RATING MODAL
  const [ratingResourceId, setRatingResourceId] = useState<string | null>(null);
  const [stars, setStars] = useState<number>(5);
  const [feedback, setFeedback] = useState<string>("");
  const [ratingError, setRatingError] = useState<string | null>(null);

  // 1. Independent Query for Folders (Classes)
  const { data: classesData, isLoading: isLoadingClasses } = useQuery({
    queryKey: ["folders", activeSource],
    queryFn: async () => {
      const res = await apiClient.get<StandardResponse<FolderClass[]>>("/resources/folders", {
        params: { source_type: activeSource }
      });
      return res.data.data || [];
    },
    enabled: activeSource !== "all" && !selectedClass,
    staleTime: 30 * 60 * 1000 // 30 minutes
  });

  // 2. Independent Query for Folders (Subjects)
  const { data: subjectsData, isLoading: isLoadingSubjects } = useQuery({
    queryKey: ["folders", activeSource, selectedClass],
    queryFn: async () => {
      const res = await apiClient.get<StandardResponse<FolderSubject[]>>("/resources/folders", {
        params: { source_type: activeSource, target_class: selectedClass }
      });
      return res.data.data || [];
    },
    enabled: !!selectedClass && !selectedSubject,
    staleTime: 30 * 60 * 1000 // 30 minutes
  });

  // 3. Infinite Query for Resources (PDFs)
  // Only fetch if "all" is active, OR if search is active, OR if specific folders are selected
  const shouldFetchResources = activeSource === "all" || searchTerm.length > 0 || (activeSource === "ncert" && !!selectedClass && !!selectedSubject) || (activeSource !== "all" && activeSource !== "ncert" && !!selectedClass && !!selectedSubject && !!selectedCategory);

  const {
    data: resourcesData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isLoadingResources,
    isError,
    refetch
  } = useInfiniteQuery<ResourcesPaginated>({
    queryKey: ["resources", activeSource, selectedClass, selectedSubject, selectedCategory, searchTerm, sortBy],
    queryFn: async ({ pageParam = 1 }) => {
      const sourceTypeParam = activeSource === "all" ? undefined : activeSource;
      const res = await apiClient.get<StandardResponse<ResourceLibraryItem[]>>("/resources", {
        params: {
          source_type: sourceTypeParam,
          target_class: selectedClass || undefined,
          subject_name: selectedSubject || undefined,
          resource_category: selectedCategory || undefined,
          search: searchTerm || undefined,
          sort_by: sortBy,
          page: pageParam,
          limit: 20
        }
      });
      return { data: res.data.data || [], meta: res.data.meta! };
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.meta?.has_next && lastPage.meta?.page ? lastPage.meta.page + 1 : undefined,
    enabled: shouldFetchResources,
    staleTime: 5 * 60 * 1000 // 5 minutes
  });

  const resources = useMemo(() => {
    if (!resourcesData) return [];
    return resourcesData.pages.flatMap((page) => page.data);
  }, [resourcesData]);

  // Intersection Observer for Infinite Scroll
  const { ref: loadMoreRef, inView } = useInView({
    rootMargin: '200px',
  });

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const rateMutation = useMutation({
    mutationFn: async ({ resourceId, stars, feedback }: { resourceId: string; stars: number; feedback?: string }) => {
      const res = await apiClient.post(`/resources/${resourceId}/rate`, { stars, feedback });
      return res.data;
    },
    onSuccess: () => {
      setRatingResourceId(null);
      setFeedback("");
      setStars(5);
      queryClient.invalidateQueries({ queryKey: ["resources"] });
    },
    onError: (err: any) => {
      setRatingError(err.response?.data?.detail || err.response?.data?.message || "Failed to submit rating.");
    }
  });

  const handleResetFolders = () => {
    setSelectedClass(null);
    setSelectedSubject(null);
    setSelectedCategory(null);
  };

  return (
    <div className="relative overflow-hidden min-h-screen space-y-8 selection:bg-sky-500 selection:text-white">
      <CursorDotsCanvas />

      <div className="relative z-10 space-y-8">
        {/* Header Banner */}
      <ScrollReveal direction="zoom" delay={0}>
        <div className="space-y-3">
          <AnimatedText
            text="Educational Resource Hub"
            gradientWords={["Resource", "Hub"]}
            className="text-3xl sm:text-5xl font-extrabold tracking-tight justify-start"
          />
          <TypewriterText
            text="Browse verified NCERT, KVS, and SAMIDHA Shiksha Library materials 100% free."
            highlightWords={["NCERT", "KVS", "SAMIDHA", "free"]}
            speedMs={15}
            className="text-xs sm:text-base text-zinc-600 dark:text-zinc-400"
          />
        </div>
      </ScrollReveal>

      {/* TALK SAMIDHA ACTION CARD */}
      <a 
        href={process.env.NEXT_PUBLIC_TALK_SAMIDHA_URL || "https://talksamidha.vercel.app/"}
        target="_blank" 
        rel="noopener noreferrer"
        className="block w-full p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-sky-500/5 to-indigo-500/5 dark:from-sky-950/30 dark:to-indigo-950/30 border border-sky-200/50 dark:border-sky-800/50 hover:border-sky-400 dark:hover:border-sky-600 transition-colors group cursor-pointer"
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-sky-500/10 text-sky-600 dark:text-sky-400 rounded-xl group-hover:scale-110 transition-transform">
              <Bot className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                Talk Samidha
                <span className="text-[10px] sm:text-xs font-bold px-2 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded border border-emerald-500/20">
                  AI Powered
                </span>
              </h3>
              <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed mt-0.5">
                Master new languages with interactive voice exercises and real-time pronunciation feedback.
              </p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-sky-600 dark:text-sky-400 shrink-0">
            Open App <ExternalLink className="h-3.5 w-3.5" />
          </div>
        </div>
      </a>

      {/* SOURCE TABS */}
      <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800/80 pb-3 overflow-x-auto scrollbar-none snap-x sm:flex-wrap">
        <button
          onClick={() => { setActiveSource("all"); handleResetFolders(); }}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shrink-0 whitespace-nowrap snap-start cursor-pointer ${
            activeSource === "all"
              ? "bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-md shadow-sky-500/25 ring-2 ring-sky-400/30"
              : "bg-zinc-100 dark:bg-zinc-900/80 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-800"
          }`}
        >
          <Sparkles className="h-3.5 w-3.5" /> ALL RESOURCES
        </button>

        <button
          onClick={() => { setActiveSource("ncert"); handleResetFolders(); }}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all shrink-0 whitespace-nowrap snap-start cursor-pointer ${
            activeSource === "ncert"
              ? "bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-md shadow-sky-500/25 ring-2 ring-sky-400/30"
              : "bg-zinc-100 dark:bg-zinc-900/80 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-800"
          }`}
        >
          🏛️ NCERT Official
        </button>

        <button
          onClick={() => { setActiveSource("samidha"); handleResetFolders(); }}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shrink-0 whitespace-nowrap snap-start cursor-pointer ${
            activeSource === "samidha"
              ? "bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-md shadow-sky-500/25 ring-2 ring-sky-400/30"
              : "bg-zinc-100 dark:bg-zinc-900/80 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-800"
          }`}
        >
          ⭐ SAMIDHA SHIKSHA LIBRARY
        </button>

        <button
          onClick={() => { setActiveSource("kvs"); handleResetFolders(); }}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all shrink-0 whitespace-nowrap snap-start cursor-pointer ${
            activeSource === "kvs"
              ? "bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-md shadow-sky-500/25 ring-2 ring-sky-400/30"
              : "bg-zinc-100 dark:bg-zinc-900/80 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-800"
          }`}
        >
          🏫 KVS / Kendriya Vidyalaya
        </button>
      </div>



      {/* BREADCRUMB NAVIGATION */}
      <div className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-300 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md p-3.5 rounded-xl border border-zinc-200/80 dark:border-zinc-800 shadow-sm flex-wrap">
        <button onClick={handleResetFolders} className="font-semibold text-sky-600 dark:text-sky-400 hover:underline cursor-pointer">
          Home
        </button>
        <ChevronRight className="h-3.5 w-3.5 text-zinc-400" />
        <button onClick={handleResetFolders} className={`font-semibold capitalize hover:underline cursor-pointer ${selectedClass ? 'text-sky-600 dark:text-sky-400' : 'text-zinc-800 dark:text-zinc-200'}`}>
          {activeSource === "all" ? "All Educational Materials" : activeSource === "samidha" ? "SAMIDHA Shiksha Library" : activeSource.toUpperCase()}
        </button>

        {selectedClass && (
          <>
            <ChevronRight className="h-3.5 w-3.5 text-zinc-400" />
            <button onClick={() => { setSelectedSubject(null); setSelectedCategory(null); }} className="font-semibold text-sky-600 dark:text-sky-400 hover:underline cursor-pointer">
              {selectedClass}
            </button>
          </>
        )}

        {selectedSubject && (
          <>
            <ChevronRight className="h-3.5 w-3.5 text-zinc-400" />
            <button onClick={() => setSelectedCategory(null)} className="font-semibold text-sky-600 dark:text-sky-400 hover:underline cursor-pointer">
              {selectedSubject}
            </button>
          </>
        )}

        {selectedCategory && (
          <>
            <ChevronRight className="h-3.5 w-3.5 text-zinc-400" />
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">{selectedCategory}</span>
          </>
        )}
      </div>

      {/* FOLDER SYSTEM EXPLORER */}
      {activeSource !== "all" && ((activeSource === "ncert" && !selectedSubject) || (activeSource !== "ncert" && !selectedCategory)) && (
        <div className="space-y-4">
          {!selectedClass ? (
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Step 1: Select Class Folder</h3>
              
              {isLoadingClasses ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="p-3 sm:p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 flex items-center gap-2.5">
                      <Skeleton className="h-6 w-6 sm:h-8 sm:w-8 rounded" />
                      <Skeleton className="h-4 w-16 rounded" />
                    </div>
                  ))}
                </div>
              ) : classesData?.length === 0 ? (
                <EmptyState
                  title="Resources Coming Soon 🚀"
                  description="We are actively indexing premium materials for this section. Check back shortly!"
                />
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                  {classesData?.map(({ class: cls }) => (
                    <button
                      key={cls}
                      onClick={() => setSelectedClass(cls)}
                      className="p-3 sm:p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 hover:border-sky-500 dark:hover:border-sky-500 hover:shadow-md flex items-center justify-between transition-transform duration-200 text-left group cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5 sm:gap-3">
                        <Folder className="h-6 w-6 sm:h-8 sm:w-8 text-sky-500 group-hover:scale-110 transition-transform shrink-0" />
                        <div>
                          <h4 className="font-bold text-xs sm:text-sm text-zinc-900 dark:text-zinc-100">{cls}</h4>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : !selectedSubject ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Step 2: Select Subject Folder in {selectedClass}</h3>
                <button onClick={() => setSelectedClass(null)} className="text-xs text-sky-600 dark:text-sky-400 hover:underline cursor-pointer">
                  ← Back to Classes
                </button>
              </div>

              {isLoadingSubjects ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="p-3 sm:p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 flex items-center gap-2.5">
                      <Skeleton className="h-6 w-6 sm:h-8 sm:w-8 rounded" />
                      <Skeleton className="h-4 w-20 rounded" />
                    </div>
                  ))}
                </div>
              ) : subjectsData?.length === 0 ? (
                <EmptyState
                  title="Resources Coming Soon 🚀"
                  description="We are actively preparing high-quality educational materials for this class. Check back shortly!"
                />
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                  {subjectsData?.map(({ subject: sub }) => (
                    <button
                      key={sub}
                      onClick={() => setSelectedSubject(sub)}
                      className="p-3 sm:p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 hover:border-emerald-500 dark:hover:border-emerald-500 hover:shadow-md flex items-center justify-between transition-transform duration-200 text-left group cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5 sm:gap-3">
                        <Folder className="h-6 w-6 sm:h-8 sm:w-8 text-emerald-500 group-hover:scale-110 transition-transform shrink-0" />
                        <div>
                          <h4 className="font-bold text-xs sm:text-sm text-zinc-900 dark:text-zinc-100">{sub}</h4>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : activeSource !== "ncert" ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Step 3: Select Material Type Folder in {selectedClass} ({selectedSubject})</h3>
                <button onClick={() => setSelectedSubject(null)} className="text-xs text-sky-600 dark:text-sky-400 hover:underline cursor-pointer">
                  ← Back to Subjects
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                {["Notes", "Question Paper / PYQ", "Sample Paper", "Worksheet"].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className="p-3 sm:p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 hover:border-indigo-500 dark:hover:border-indigo-500 hover:shadow-md flex items-center gap-2.5 sm:gap-3 transition-transform duration-200 text-left group cursor-pointer"
                  >
                    <Folder className="h-6 w-6 sm:h-8 sm:w-8 text-indigo-500 group-hover:scale-110 transition-transform shrink-0" />
                    <div>
                      <h4 className="font-bold text-xs sm:text-sm text-zinc-900 dark:text-zinc-100">{cat}</h4>
                      <span className="text-[10px] text-zinc-500 hidden sm:inline">View Documents</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* SEARCH BAR & SORTING CONTROLS */}
      <div className="flex flex-col sm:flex-row gap-4 pt-2">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search resources by title or keyword..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-zinc-500 shrink-0">Sort By:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="p-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-medium focus:outline-none"
          >
            <option value="latest">📅 Latest Uploaded</option>
            <option value="top_rated">⭐ Top Rated</option>
            <option value="most_viewed">👁️ Most Viewed</option>
          </select>

          {(selectedClass || selectedSubject || selectedCategory) && (
            <Button variant="outline" size="sm" onClick={handleResetFolders}>
              Clear Filters
            </Button>
          )}
        </div>
      </div>

      {/* RESOURCE CARDS GRID */}
      {shouldFetchResources && (
        <>
          {isLoadingResources ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="space-y-4">
                  <Skeleton className="h-36 w-full rounded-lg" />
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </Card>
              ))}
            </div>
          ) : isError ? (
            <ErrorState onRetry={() => refetch()} />
          ) : resources.length === 0 ? (
            <EmptyState
              title="Resources Coming Soon 🚀"
              description="We are continuously adding new study materials. The resources for this folder will be available shortly!"
              actionText="Browse Available Materials"
              onAction={() => { setActiveSource("all"); handleResetFolders(); }}
            />
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {resources.map((res) => (
                    <Card key={res.id} className="flex flex-col justify-between space-y-4 group">
                    <div className="space-y-3">
                      {/* CLASSIFICATION BADGES */}
                      <div className="flex flex-wrap items-center justify-between gap-1.5">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {res.target_class && (
                            <span className="px-2 py-0.5 bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 text-[10px] font-bold rounded border border-sky-200 dark:border-sky-800">
                              {res.target_class}
                            </span>
                          )}
                          {res.subject_name && (
                            <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold rounded border border-emerald-200 dark:border-emerald-800">
                              {res.subject_name.replace(/\s*\((Hindi|English)\)/i, "")}
                            </span>
                          )}
                          <span className="px-2 py-0.5 bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 text-[10px] font-bold rounded border border-violet-200 dark:border-violet-800">
                            {`${res.title} ${res.subject_name || ''} ${res.description || ''}`.toLowerCase().includes("hindi") ? "Hindi" : "English"}
                          </span>
                          {res.resource_category && (
                            <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold rounded border border-indigo-200 dark:border-indigo-800">
                              {res.resource_category}
                            </span>
                          )}
                        </div>

                        <button
                          onClick={() => setRatingResourceId(res.id)}
                          className="flex items-center gap-1 text-amber-500 hover:scale-105 transition-transform text-[11px]"
                        >
                          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                          <span className="font-bold text-zinc-800 dark:text-zinc-200">
                            {res.rating_avg > 0 ? res.rating_avg.toFixed(1) : "New"}
                          </span>
                        </button>
                      </div>

                      <Link href={`/resources/${res.id}?fromSource=${activeSource}${selectedClass ? `&fromClass=${encodeURIComponent(selectedClass)}` : ''}${selectedSubject ? `&fromSubject=${encodeURIComponent(selectedSubject)}` : ''}${selectedCategory ? `&fromCategory=${encodeURIComponent(selectedCategory)}` : ''}`}>
                        <h3 className="font-semibold text-base text-zinc-900 dark:text-zinc-100 line-clamp-2 hover:text-sky-600 transition-colors cursor-pointer pt-1">
                          {res.title}
                        </h3>
                      </Link>
                      <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed">
                        {res.description || "Structured study material verified for student preparation."}
                      </p>

                      {/* CREDIT & DATE FOOTER */}
                      <div className="space-y-1 pt-1 text-[11px] text-zinc-500">
                        <div className="flex items-center gap-1.5 font-medium text-zinc-700 dark:text-zinc-300">
                          <User className="h-3.5 w-3.5 text-sky-500" />
                          <span>Uploaded by {res.uploader_name}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-zinc-400" />
                          <span>Date: {new Date(res.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    {/* ACTION BUTTONS */}
                    <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800/80 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link href={`/resources/${res.id}?fromSource=${activeSource}${selectedClass ? `&fromClass=${encodeURIComponent(selectedClass)}` : ''}${selectedSubject ? `&fromSubject=${encodeURIComponent(selectedSubject)}` : ''}${selectedCategory ? `&fromCategory=${encodeURIComponent(selectedCategory)}` : ''}`} className="flex-1 min-w-[100px]">
                          <Button variant="outline" size="sm" className="w-full text-xs font-semibold bg-zinc-50 dark:bg-zinc-800/60 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-700">
                            <BookOpen className="h-3 w-3 mr-1 text-zinc-500" /> PDF Preview
                          </Button>
                        </Link>

                        {res.source_type !== "ncert" && (
                          <Link href={`/resources/${res.id}/learn-ai?fromSource=${activeSource}${selectedClass ? `&fromClass=${encodeURIComponent(selectedClass)}` : ''}${selectedSubject ? `&fromSubject=${encodeURIComponent(selectedSubject)}` : ''}${selectedCategory ? `&fromCategory=${encodeURIComponent(selectedCategory)}` : ''}`} className="flex-1 min-w-[120px]">
                            <Button variant="primary" size="sm" className="w-full text-xs font-semibold bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white shadow-sm">
                              <Sparkles className="h-3 w-3 mr-1 text-amber-300" /> Learn With AI
                            </Button>
                          </Link>
                        )}

                        <a
                          href={res.external_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full sm:w-auto"
                        >
                          <Button variant="ghost" size="sm" className="w-full text-xs text-zinc-500 hover:text-sky-600 px-2">
                            Direct Open <ExternalLink className="h-3 w-3 ml-1" />
                          </Button>
                        </a>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
              
              {/* Intersection Observer Sentinel for Infinite Scroll */}
              <div ref={loadMoreRef} className="py-6 flex justify-center w-full">
                {isFetchingNextPage ? (
                  <div className="flex items-center gap-2 text-zinc-500 text-sm font-medium">
                    <Loader2 className="h-4 w-4 animate-spin" /> Loading more resources...
                  </div>
                ) : hasNextPage ? (
                  <div className="text-zinc-400 text-xs">Scroll for more</div>
                ) : (
                  <div className="text-zinc-400 text-sm font-medium pt-4 pb-12">You've reached the end!</div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* 5-STAR RATING & REVIEWS MODAL */}
      {ratingResourceId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
              <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Star className="h-5 w-5 fill-amber-400 text-amber-400" /> Rate Educational Resource
              </h3>
              <button onClick={() => setRatingResourceId(null)} className="text-zinc-500 hover:text-zinc-700">
                <X className="h-5 w-5" />
              </button>
            </div>

            {ratingError && (
              <div className="p-2.5 text-xs bg-rose-50 dark:bg-rose-950 text-rose-600 rounded-xl border border-rose-200">
                {ratingError}
              </div>
            )}

            <div className="space-y-4 text-center py-2">
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map((starVal) => (
                  <button
                    key={starVal}
                    type="button"
                    onClick={() => setStars(starVal)}
                    className="p-1 hover:scale-125 transition-transform"
                  >
                    <Star
                      className={`h-8 w-8 ${
                        starVal <= stars
                          ? "fill-amber-400 text-amber-400"
                          : "text-zinc-300 dark:text-zinc-700"
                      }`}
                    />
                  </button>
                ))}
              </div>

              <textarea
                rows={3}
                placeholder="Optional feedback: Was this resource helpful for your preparation?"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                className="w-full p-3 border border-zinc-300 dark:border-zinc-700 rounded-xl bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => setRatingResourceId(null)}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  isLoading={rateMutation.isPending}
                  onClick={() => rateMutation.mutate({ resourceId: ratingResourceId, stars, feedback })}
                  className="bg-amber-500 hover:bg-amber-400 text-white"
                >
                  Submit 5-Star Rating
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

export default function ResourcesPage() {
  return (
    <Suspense fallback={
      <div className="max-w-7xl mx-auto py-8 space-y-6">
        <Skeleton className="h-10 w-64 rounded-xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    }>
      <ResourcesPageContent />
    </Suspense>
  );
}
