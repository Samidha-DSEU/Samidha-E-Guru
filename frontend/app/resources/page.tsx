"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Filter, BookOpen, ExternalLink, Bookmark, Eye, Star, Folder, ChevronRight, User, Calendar, X, Sparkles } from "lucide-react";
import { apiClient } from "@/services/apiClient";
import { StandardResponse } from "@/types/api";
import { Button } from "@/components/ui/Button";
import { Card, Skeleton } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { CursorDotsCanvas } from "@/components/ui/CursorDotsCanvas";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { AnimatedText } from "@/components/ui/AnimatedText";
import { TiltCard } from "@/components/ui/TiltCard";
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

const CLASSES = [
  "Class 1", "Class 2", "Class 3", "Class 4", "Class 5",
  "Class 6", "Class 7", "Class 8", "Class 9", "Class 10",
  "Class 11", "Class 12", "Undergraduate"
];
const SUBJECTS = [
  "Mathematics", "Science", "Environmental Studies", "Physics", "Chemistry",
  "Biology", "English", "Hindi", "Social Science", "Computer Science"
];
const CATEGORIES = ["Notes", "Question Paper / PYQ", "Sample Paper", "Worksheet"];

export default function ResourcesPage() {
  const queryClient = useQueryClient();
  const [activeSource, setActiveSource] = useState<string>("all"); // all, ncert, samidha, kvs, diksha
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<string>("latest"); // latest, top_rated, most_viewed

  // RATING MODAL STATE
  const [ratingResourceId, setRatingResourceId] = useState<string | null>(null);
  const [stars, setStars] = useState<number>(5);
  const [feedback, setFeedback] = useState<string>("");
  const [ratingError, setRatingError] = useState<string | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["resources", activeSource, selectedClass, selectedSubject, selectedCategory, searchTerm, sortBy],
    queryFn: async () => {
      const sourceTypeParam = activeSource === "all" ? undefined : activeSource;
      const res = await apiClient.get<StandardResponse<ResourceLibraryItem[]>>("/resources", {
        params: {
          source_type: sourceTypeParam,
          target_class: selectedClass || undefined,
          subject_name: selectedSubject || undefined,
          resource_category: selectedCategory || undefined,
          search: searchTerm || undefined,
          sort_by: sortBy,
          limit: 1000
        }
      });
      return res.data;
    }
  });

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

  const resources = data?.data || [];

  const handleResetFolders = () => {
    setSelectedClass(null);
    setSelectedSubject(null);
    setSelectedCategory(null);
  };

  return (
    <div className="relative overflow-hidden space-y-8 selection:bg-sky-500 selection:text-white">
      <CursorDotsCanvas />

      {/* Header Banner */}
      <ScrollReveal direction="zoom" delay={0}>
        <div className="space-y-3">
          <AnimatedText
            text="Educational Resource Hub"
            gradientWords={["Resource", "Hub"]}
            className="text-3xl sm:text-5xl font-extrabold tracking-tight justify-start"
          />
          <TypewriterText
            text="Browse verified NCERT, DIKSHA, SWAYAM, NPTEL, and SAMIDHA Shiksha Library materials 100% free."
            highlightWords={["NCERT", "SAMIDHA", "free"]}
            speedMs={15}
            className="text-xs sm:text-base text-zinc-600 dark:text-zinc-400"
          />
        </div>
      </ScrollReveal>

      {/* SOURCE TABS (HORIZONTAL SWIPE BAR ON MOBILE, FLEX WRAP ON DESKTOP) */}
      <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-3 overflow-x-auto scrollbar-none snap-x sm:flex-wrap">
        <button
          onClick={() => { setActiveSource("all"); handleResetFolders(); }}
          className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shrink-0 whitespace-nowrap snap-start ${
            activeSource === "all"
              ? "bg-sky-600 text-white shadow-md shadow-sky-500/20"
              : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200"
          }`}
        >
          <Sparkles className="h-4 w-4" /> 🌟 ALL RESOURCES
        </button>

        <button
          onClick={() => { setActiveSource("ncert"); handleResetFolders(); }}
          className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all shrink-0 whitespace-nowrap snap-start ${
            activeSource === "ncert"
              ? "bg-sky-600 text-white shadow-md shadow-sky-500/20"
              : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200"
          }`}
        >
          🏛️ NCERT Official
        </button>

        <button
          onClick={() => { setActiveSource("samidha"); handleResetFolders(); }}
          className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shrink-0 whitespace-nowrap snap-start ${
            activeSource === "samidha"
              ? "bg-sky-600 text-white shadow-md shadow-sky-500/20"
              : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200"
          }`}
        >
          ⭐ SAMIDHA SHIKSHA LIBRARY
        </button>

        <button
          onClick={() => { setActiveSource("kvs"); handleResetFolders(); }}
          className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all shrink-0 whitespace-nowrap snap-start ${
            activeSource === "kvs"
              ? "bg-sky-600 text-white shadow-md shadow-sky-500/20"
              : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200"
          }`}
        >
          🏫 KVS / Kendriya Vidyalaya
        </button>

        <button
          onClick={() => { setActiveSource("diksha"); handleResetFolders(); }}
          className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all shrink-0 whitespace-nowrap snap-start ${
            activeSource === "diksha"
              ? "bg-sky-600 text-white shadow-md shadow-sky-500/20"
              : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200"
          }`}
        >
          🌐 DIKSHA / SWAYAM / NPTEL
        </button>
      </div>

      {/* BREADCRUMB NAVIGATION */}
      <div className="flex items-center gap-2 text-xs text-zinc-500 bg-zinc-50 dark:bg-zinc-900/60 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 flex-wrap">
        <button onClick={handleResetFolders} className="font-semibold text-sky-600 hover:underline">
          Home
        </button>
        <ChevronRight className="h-3.5 w-3.5 text-zinc-400" />
        <span className="font-semibold text-zinc-700 dark:text-zinc-300 capitalize">
          {activeSource === "all" ? "All Educational Materials" : activeSource === "samidha" ? "SAMIDHA Shiksha Library" : activeSource.toUpperCase()}
        </span>

        {selectedClass && (
          <>
            <ChevronRight className="h-3.5 w-3.5 text-zinc-400" />
            <button onClick={() => { setSelectedSubject(null); setSelectedCategory(null); }} className="font-semibold text-sky-600 hover:underline">
              {selectedClass}
            </button>
          </>
        )}

        {selectedSubject && (
          <>
            <ChevronRight className="h-3.5 w-3.5 text-zinc-400" />
            <button onClick={() => setSelectedCategory(null)} className="font-semibold text-sky-600 hover:underline">
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
      {/* For NCERT Official: Class -> Subject -> Chapters */}
      {/* For SAMIDHA & Others: Class -> Subject -> Category -> Files */}
      {activeSource !== "all" && ((activeSource === "ncert" && !selectedSubject) || (activeSource !== "ncert" && !selectedCategory)) && (
        <div className="space-y-4">
          {!selectedClass ? (
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Step 1: Select Class Folder</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                {Array.from(new Set(resources.map(r => r.target_class).filter(Boolean)))
                  .sort((a, b) => {
                    const numA = parseInt(a!.match(/\d+/)?.[0] || "999");
                    const numB = parseInt(b!.match(/\d+/)?.[0] || "999");
                    return numA - numB;
                  })
                  .map((cls) => {
                  const count = resources.filter(r => r.target_class === cls).length;
                  return (
                    <button
                      key={cls}
                      onClick={() => setSelectedClass(cls!)}
                      className="p-3 sm:p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-sky-500 dark:hover:border-sky-500 hover:shadow-md flex items-center justify-between transition-all text-left group"
                    >
                      <div className="flex items-center gap-2.5 sm:gap-3">
                        <Folder className="h-6 w-6 sm:h-8 sm:w-8 text-sky-500 group-hover:scale-110 transition-transform shrink-0" />
                        <div>
                          <h4 className="font-bold text-xs sm:text-sm text-zinc-900 dark:text-zinc-100">{cls}</h4>
                          <span className="text-[10px] text-zinc-500 block">
                            {count > 0 ? `${count} Resources` : "Empty Folder"}
                          </span>
                        </div>
                      </div>
                      {count > 0 && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 dark:bg-sky-950 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-800">
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : !selectedSubject ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Step 2: Select Subject Folder in {selectedClass}</h3>
                <button onClick={() => setSelectedClass(null)} className="text-xs text-sky-600 hover:underline">
                  ← Back to Classes
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                {Array.from(new Set(
                  resources.filter(r => r.target_class === selectedClass && r.subject_name).map(r => r.subject_name)
                )).sort().map((sub) => {
                  const count = resources.filter(r => r.target_class === selectedClass && r.subject_name === sub).length;
                  return (
                    <button
                      key={sub}
                      onClick={() => setSelectedSubject(sub!)}
                      className="p-3 sm:p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-emerald-500 dark:hover:border-emerald-500 hover:shadow-md flex items-center justify-between transition-all text-left group"
                    >
                      <div className="flex items-center gap-2.5 sm:gap-3">
                        <Folder className="h-6 w-6 sm:h-8 sm:w-8 text-emerald-500 group-hover:scale-110 transition-transform shrink-0" />
                        <div>
                          <h4 className="font-bold text-xs sm:text-sm text-zinc-900 dark:text-zinc-100">{sub}</h4>
                          <span className="text-[10px] text-zinc-500 block">
                            {count > 0 ? `${count} Resources` : "Empty Folder"}
                          </span>
                        </div>
                      </div>
                      {count > 0 && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : activeSource !== "ncert" ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Step 3: Select Material Type Folder in {selectedClass} ({selectedSubject})</h3>
                <button onClick={() => setSelectedSubject(null)} className="text-xs text-sky-600 hover:underline">
                  ← Back to Subjects
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                {Array.from(new Set(
                  resources.filter(r => r.target_class === selectedClass && r.subject_name === selectedSubject && r.resource_category).map(r => r.resource_category)
                )).sort().map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat!)}
                    className="p-3 sm:p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-indigo-500 dark:hover:border-indigo-500 hover:shadow-md flex items-center gap-2.5 sm:gap-3 transition-all text-left group"
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
      {(searchTerm.length > 0 || activeSource === "all" || (activeSource === "ncert" && selectedClass && selectedSubject) || (activeSource !== "all" && activeSource !== "ncert" && selectedClass && selectedSubject && selectedCategory)) && (
        <>
          {isLoading ? (
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
            <ErrorState onRetry={refetch} />
          ) : resources.length === 0 ? (
            <EmptyState
              title="No educational resources found in this category"
              description="Try selecting a different tab or clearing search terms."
              actionText="View All Materials"
              onAction={() => { setActiveSource("all"); handleResetFolders(); }}
            />
          ) : (
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
                            {res.subject_name}
                          </span>
                        )}
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

                    <Link href={`/resources/${res.id}`}>
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
                    <div className="flex items-center gap-2">
                      <Link href={`/resources/${res.id}`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full text-xs font-semibold bg-sky-50 dark:bg-sky-900/10 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800 hover:bg-sky-100 dark:hover:bg-sky-900/20">
                          <Sparkles className="h-3 w-3 mr-1" /> AI Workspace
                        </Button>
                      </Link>

                      <a
                        href={res.external_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1"
                      >
                        <Button variant="ghost" size="sm" className="w-full text-xs text-zinc-500 hover:text-sky-600">
                          Direct Open <ExternalLink className="h-3 w-3 ml-1" />
                        </Button>
                      </a>
                    </div>
                  </div>
                </Card>
              ))}
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
  );
}
