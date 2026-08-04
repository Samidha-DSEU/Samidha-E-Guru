"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Calendar, MapPin, Users, Video, Clock, CheckCircle2, MessageSquare, ExternalLink, X, AlertCircle } from "lucide-react";
import { apiClient } from "@/services/apiClient";
import { StandardResponse } from "@/types/api";
import { Card, Skeleton } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { useAuth } from "@/features/auth/context/AuthContext";

interface EventItem {
  id: string;
  title: string;
  description: string;
  mode: string;
  venue: string;
  poster_url?: string;
  event_date: string;
  start_time?: string;
  whatsapp_group_url?: string;
  max_participants?: number;
  registrations_count: number;
  organizer_name: string;
}

export default function EventsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  const [formData, setFormData] = useState({
    full_name: user?.profile?.full_name || "",
    class_or_college: "",
    mobile_number: "",
    address: ""
  });
  const [registrationSuccess, setRegistrationSuccess] = useState<{
    whatsapp_group_url?: string;
  } | null>(null);
  const [regError, setRegError] = useState<string | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["events"],
    queryFn: async () => {
      const res = await apiClient.get<StandardResponse<EventItem[]>>("/events");
      return res.data;
    }
  });

  const registerMutation = useMutation({
    mutationFn: async ({ eventId, data }: { eventId: string; data: typeof formData }) => {
      const res = await apiClient.post(`/events/${eventId}/register`, data);
      return res.data;
    },
    onSuccess: (res: any) => {
      setRegistrationSuccess({
        whatsapp_group_url: res.data?.whatsapp_group_url
      });
      setRegError(null);
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
    onError: (err: any) => {
      setRegError(err.response?.data?.detail || err.response?.data?.message || "Failed to complete registration.");
    }
  });

  const events = data?.data || [];

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent) return;
    if (!formData.full_name || !formData.mobile_number || !formData.class_or_college) {
      setRegError("Please fill out all required fields.");
      return;
    }
    registerMutation.mutate({ eventId: selectedEvent.id, data: formData });
  };

  const handleCloseModal = () => {
    setSelectedEvent(null);
    setRegistrationSuccess(null);
    setRegError(null);
    setFormData({
      full_name: user?.profile?.full_name || "",
      class_or_college: "",
      mobile_number: "",
      address: ""
    });
  };

  return (
    <ProtectedRoute>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 flex items-center gap-3">
            <Calendar className="h-8 w-8 text-indigo-500" /> Workshops & Educational Events
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400 text-sm">
            Register for free live workshops, mentoring sessions, and career orientation bootcamps organized by SAMIDHA volunteers.
          </p>
        </div>

        {/* EVENTS GRID / STATES */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="space-y-4">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-4 w-1/2" />
              </Card>
            ))}
          </div>
        ) : isError ? (
          <ErrorState onRetry={refetch} />
        ) : events.length === 0 ? (
          <EmptyState
            title="No upcoming events scheduled right now"
            description="Check back soon! SAMIDHA volunteers frequently organize free workshops and bootcamps."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {events.map((evt) => (
              <Card key={evt.id} className="flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                    <span className="flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5 text-zinc-400" /> Organized by {evt.organizer_name}
                    </span>
                    <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 rounded border border-indigo-200 dark:border-indigo-800">
                      {evt.mode}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{evt.title}</h3>
                  <p className="text-xs text-zinc-500 leading-relaxed line-clamp-3">
                    {evt.description}
                  </p>

                  <div className="space-y-2 text-xs text-zinc-600 dark:text-zinc-400 border-t border-zinc-100 dark:border-zinc-800 pt-3">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-indigo-500 shrink-0" />
                      <span>{new Date(evt.event_date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })} {evt.start_time ? `• ${evt.start_time}` : ""}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {evt.mode === "online" ? <Video className="h-4 w-4 text-indigo-500 shrink-0" /> : <MapPin className="h-4 w-4 text-indigo-500 shrink-0" />}
                      <span className="truncate">{evt.venue}</span>
                    </div>

                    <div className="flex items-center gap-2 text-zinc-500">
                      <Users className="h-4 w-4 text-zinc-400 shrink-0" />
                      <span>{evt.registrations_count} Registered Students</span>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={() => setSelectedEvent(evt)}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white"
                >
                  Register Now
                </Button>
              </Card>
            ))}
          </div>
        )}

        {/* REGISTRATION & WHATSAPP MODAL */}
        {selectedEvent && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative">
              <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
                <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-indigo-500" /> Event Registration
                </h3>
                <button onClick={handleCloseModal} className="text-zinc-500 hover:text-zinc-700">
                  <X className="h-5 w-5" />
                </button>
              </div>

              {registrationSuccess ? (
                <div className="text-center py-6 space-y-4">
                  <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 className="h-10 w-10" />
                  </div>
                  <h4 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                    Registration Successful! 🎉
                  </h4>
                  <p className="text-xs text-zinc-500 leading-relaxed max-w-sm mx-auto">
                    You have successfully registered for <strong>{selectedEvent.title}</strong>. Join the official WhatsApp group below to receive live class updates & session links!
                  </p>

                  {registrationSuccess.whatsapp_group_url ? (
                    <a
                      href={registrationSuccess.whatsapp_group_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/20 text-sm transition-all"
                    >
                      <MessageSquare className="h-5 w-5" />
                      Join WhatsApp Group
                    </a>
                  ) : (
                    <p className="text-xs text-zinc-400 italic">WhatsApp group link will be sent to your registered mobile number.</p>
                  )}

                  <Button variant="outline" className="w-full" onClick={handleCloseModal}>
                    Close
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleRegisterSubmit} className="space-y-4">
                  <div className="p-3 bg-zinc-50 dark:bg-zinc-800/60 rounded-xl text-xs space-y-1">
                    <div className="font-bold text-zinc-900 dark:text-zinc-100">{selectedEvent.title}</div>
                    <div className="text-zinc-500">{new Date(selectedEvent.event_date).toLocaleDateString()} {selectedEvent.start_time ? `• ${selectedEvent.start_time}` : ""}</div>
                  </div>

                  {regError && (
                    <div className="p-3 text-xs bg-rose-50 dark:bg-rose-950 text-rose-600 rounded-xl border border-rose-200">
                      {regError}
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="Enter your full name"
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      className="w-full p-2.5 border border-zinc-300 dark:border-zinc-700 rounded-xl bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Class / College Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="E.g., Class 10th - DSEU Delhi"
                      value={formData.class_or_college}
                      onChange={(e) => setFormData({ ...formData, class_or_college: e.target.value })}
                      className="w-full p-2.5 border border-zinc-300 dark:border-zinc-700 rounded-xl bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Mobile / WhatsApp Number *</label>
                    <input
                      type="tel"
                      required
                      placeholder="+91 98765 43210"
                      value={formData.mobile_number}
                      onChange={(e) => setFormData({ ...formData, mobile_number: e.target.value })}
                      className="w-full p-2.5 border border-zinc-300 dark:border-zinc-700 rounded-xl bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Address / City *</label>
                    <input
                      type="text"
                      required
                      placeholder="E.g., Rohini, New Delhi"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full p-2.5 border border-zinc-300 dark:border-zinc-700 rounded-xl bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <Button variant="outline" type="button" onClick={handleCloseModal}>
                      Cancel
                    </Button>
                    <Button type="submit" isLoading={registerMutation.isPending} className="bg-indigo-600 hover:bg-indigo-500 text-white">
                      Confirm Registration
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
