"use client";

import React from "react";
import { Calendar, MapPin, Users, Video } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function EventsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Workshops & Educational Events
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400 text-sm">
          Register for free live workshops, mentoring sessions, and career orientation bootcamps.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="space-y-4">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-sky-600 dark:text-sky-400">
            <span>Upcoming Workshop</span>
            <span className="px-2 py-0.5 bg-sky-50 dark:bg-sky-950 rounded border border-sky-200 dark:border-sky-800">Online</span>
          </div>

          <h3 className="text-xl font-bold">Python Programming & Data Science Fundamentals Bootcamp</h3>
          <p className="text-sm text-zinc-500 leading-relaxed">
            A comprehensive 2-day hands-on bootcamp organized by SAMIDHA volunteers for school and college learners introducing Python programming fundamentals.
          </p>

          <div className="space-y-2 text-xs text-zinc-500 border-t border-zinc-100 dark:border-zinc-800 pt-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-zinc-400" />
              <span>Saturday, August 15, 2026 • 5:00 PM IST</span>
            </div>
            <div className="flex items-center gap-2">
              <Video className="h-4 w-4 text-zinc-400" />
              <span>Google Meet (Link sent upon registration)</span>
            </div>
          </div>

          <Button className="w-full mt-2">Register Now</Button>
        </Card>
      </div>
    </div>
  );
}
