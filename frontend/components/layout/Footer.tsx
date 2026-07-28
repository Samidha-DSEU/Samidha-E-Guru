import React from "react";
import Link from "next/link";
import { Heart } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 py-12 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          <div className="space-y-3">
            <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">SAMIDHA E-GURU</h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Empowering students, volunteers, and alumni through free, accessible, and high-quality educational resources.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-4">Platform</h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link href="/resources" className="text-zinc-600 dark:text-zinc-400 hover:text-sky-600">Educational Resources</Link></li>
              <li><Link href="/community" className="text-zinc-600 dark:text-zinc-400 hover:text-sky-600">Community & Mentorship</Link></li>
              <li><Link href="/events" className="text-zinc-600 dark:text-zinc-400 hover:text-sky-600">Upcoming Events</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-4">User Dashboards</h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link href="/dashboard" className="text-zinc-600 dark:text-zinc-400 hover:text-sky-600">Student Dashboard</Link></li>
              <li><Link href="/dashboard" className="text-zinc-600 dark:text-zinc-400 hover:text-sky-600">Volunteer Portal</Link></li>
              <li><Link href="/admin" className="text-zinc-600 dark:text-zinc-400 hover:text-sky-600">Admin Control Panel</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-4">Initiative</h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link href="/about" className="text-zinc-600 dark:text-zinc-400 hover:text-sky-600">About SAMIDHA</Link></li>
              <li><Link href="/contact" className="text-zinc-600 dark:text-zinc-400 hover:text-sky-600">Contact Us</Link></li>
              <li><Link href="/privacy" className="text-zinc-600 dark:text-zinc-400 hover:text-sky-600">Privacy Policy</Link></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
          <p>© {new Date().getFullYear()} SAMIDHA Initiative. All rights reserved.</p>
          <p className="flex items-center gap-1 mt-2 sm:mt-0">
            Built with <Heart className="h-3.5 w-3.5 text-rose-500 fill-rose-500" /> for accessible education.
          </p>
        </div>
      </div>
    </footer>
  );
}
