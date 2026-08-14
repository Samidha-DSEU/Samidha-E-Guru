"use client";

import React, { useEffect, useState } from "react";
import { Download, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function PWAInstaller() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Register Service Worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => console.log("SAMIDHA PWA Service Worker Registered:", reg.scope))
        .catch((err) => console.error("SAMIDHA PWA SW Registration Failed:", err));
    }

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      console.log("PWA Installed by user");
    }
    setDeferredPrompt(null);
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-5 right-5 z-[99999] max-w-sm w-full bg-zinc-900/95 dark:bg-zinc-950/95 backdrop-blur-xl border border-sky-500/30 p-4 rounded-2xl shadow-2xl animate-in slide-in-from-bottom-5 text-white flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center border border-sky-500/30 shrink-0">
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <h4 className="text-xs font-extrabold text-zinc-100">Install SAMIDHA App</h4>
          <p className="text-[11px] text-zinc-400">Add to home screen for fast mobile LMS access</p>
        </div>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <Button size="sm" onClick={handleInstallClick} className="bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs py-1.5 px-3 rounded-xl">
          <Download className="h-3.5 w-3.5 mr-1" /> Install
        </Button>
        <button onClick={() => setShowBanner(false)} className="text-zinc-400 hover:text-white p-1">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
