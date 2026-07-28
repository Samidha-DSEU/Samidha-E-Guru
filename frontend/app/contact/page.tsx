import React from "react";
import { Mail, Send } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function ContactPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-8 py-6">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Contact SAMIDHA Team
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400 text-xs">
          Have a question or want to contribute as a volunteer or mentor? Reach out to us.
        </p>
      </div>

      <Card className="space-y-4">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-zinc-500">Your Name</label>
          <input
            type="text"
            placeholder="John Doe"
            className="w-full px-3.5 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-zinc-500">Email Address</label>
          <input
            type="email"
            placeholder="john@example.com"
            className="w-full px-3.5 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-zinc-500">Message</label>
          <textarea
            rows={4}
            placeholder="How can we help you?"
            className="w-full px-3.5 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm"
          />
        </div>

        <Button className="w-full">
          <Send className="h-4 w-4 mr-2" /> Send Message
        </Button>
      </Card>
    </div>
  );
}
