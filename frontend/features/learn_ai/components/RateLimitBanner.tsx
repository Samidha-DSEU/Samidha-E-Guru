"use client";

import React from "react";
import { Clock, ShieldAlert, RefreshCw } from "lucide-react";

interface RateLimitBannerProps {
  remainingSeconds: number;
  onTimerFinished?: () => void;
}

export function RateLimitBanner({ remainingSeconds }: RateLimitBannerProps) {
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const progressPercent = Math.max(0, Math.min(100, (remainingSeconds / 60) * 100));

  return (
    <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-rose-500/10 border border-amber-500/30 dark:border-amber-500/40 shadow-sm space-y-3 my-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="p-2.5 bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-xl shrink-0">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-amber-900 dark:text-amber-200 flex items-center gap-2">
              <span>⏳ AI Request Limit Reached</span>
            </h4>
            <p className="text-xs text-amber-800/80 dark:text-amber-300/80 leading-relaxed mt-0.5">
              You have requested multiple AI workspace modules in a short time. Please wait before generating another module.
            </p>
          </div>
        </div>

        {/* Digital Countdown Badge */}
        <div className="px-3 py-1.5 bg-amber-500/20 border border-amber-500/40 rounded-xl flex items-center gap-1.5 shrink-0 text-amber-700 dark:text-amber-300 font-mono text-sm font-bold">
          <Clock className="h-4 w-4 animate-spin text-amber-600 dark:text-amber-400" />
          <span>{formatTime(remainingSeconds)}</span>
        </div>
      </div>

      {/* Animated Timer Progress Bar */}
      <div className="w-full bg-amber-200/50 dark:bg-amber-950/60 rounded-full h-1.5 overflow-hidden">
        <div
          className="bg-gradient-to-r from-amber-500 to-rose-500 h-full transition-all duration-1000 ease-linear rounded-full"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-[11px] text-amber-700/70 dark:text-amber-400/70 pt-0.5">
        <span className="flex items-center gap-1">
          <RefreshCw className="h-3 w-3 animate-spin" /> Retrying automatically when timer finishes...
        </span>
        <span>Other tabs & navigation remain active</span>
      </div>
    </div>
  );
}
