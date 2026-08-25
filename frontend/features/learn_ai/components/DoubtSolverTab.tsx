"use client";

import React, { useState, useEffect } from "react";
import { MessageSquare, Send, Bot, User, Sparkles, BookOpen, AlertCircle, Clock } from "lucide-react";
import { learnAiService, DoubtResponse } from "../services/learnAiService";
import { Button } from "@/components/ui/Button";

interface DoubtMessage {
  id: string;
  sender: "user" | "bot";
  text: string;
  sources?: Array<{ page_number: number; content_snippet: string }>;
  timestamp: string;
}

export function DoubtSolverTab({ resourceId, title }: { resourceId: string; title: string }) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [rateLimitSeconds, setRateLimitSeconds] = useState<number>(0);
  const [messages, setMessages] = useState<DoubtMessage[]>([
    {
      id: "welcome",
      sender: "bot",
      text: `Hello! I'm your AI Chapter Tutor for **"${title}"**. Ask me any doubt about formulas, definitions, key concepts, or step-by-step problem-solving methods!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  // Countdown timer for rate limit window
  useEffect(() => {
    if (rateLimitSeconds <= 0) return;
    const interval = setInterval(() => {
      setRateLimitSeconds((prev) => (prev > 1 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [rateLimitSeconds]);

  const suggestedQuestions = [
    "What are the key formulas in this chapter?",
    "Explain the main concepts in simple terms.",
    "What are the most common exam questions from this topic?",
    "Can you clarify the step-by-step problem-solving approach?"
  ];

  const handleSend = async (questionText?: string) => {
    const query = (questionText || input).trim();
    if (!query || loading || rateLimitSeconds > 0) return;

    const userMsg: DoubtMessage = {
      id: Date.now().toString(),
      sender: "user",
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!questionText) setInput("");
    setLoading(true);

    try {
      const res: DoubtResponse = await learnAiService.askDoubt(resourceId, query);
      const botMsg: DoubtMessage = {
        id: (Date.now() + 1).toString(),
        sender: "bot",
        text: res.answer,
        sources: res.sources,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      const status = err?.response?.status;
      const realErrorText =
        err?.response?.data?.detail ||
        err?.message ||
        "An unexpected error occurred while contacting the LLM service.";
      
      const isRateLimit = status === 429 || realErrorText.includes("429") || realErrorText.toLowerCase().includes("limit reached") || realErrorText.toLowerCase().includes("wait");

      if (isRateLimit) {
        setRateLimitSeconds(60);
      }

      const errorMsg: DoubtMessage = {
        id: (Date.now() + 1).toString(),
        sender: "bot",
        text: isRateLimit
          ? "⚡ **AI Tutor Request Quota Reached**: You have reached the maximum allowed questions per minute. Please try again after 60 seconds."
          : "⚠️ **AI Tutor Service Offline**: The AI Tutor service is temporarily unavailable or sleeping. Please try again later.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-sky-500/10 via-indigo-500/10 to-purple-500/10 border border-sky-200 dark:border-sky-800/40 flex items-center gap-3">
        <div className="p-2.5 bg-sky-500/20 text-sky-600 dark:text-sky-400 rounded-lg">
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Interactive AI Chapter Doubt Solver (RAG Powered)
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Ask any question regarding {title}. Answers are generated using textbook context with page citations.
          </p>
        </div>
      </div>

      {/* Rate Limit Alert Banner */}
      {rateLimitSeconds > 0 && (
        <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/80 text-amber-900 dark:text-amber-200 text-xs flex items-center justify-between shadow-sm animate-pulse">
          <div className="flex items-center gap-2 font-medium">
            <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>⚡ ChatPDF / LLM request quota limit reached. Please wait <strong>{rateLimitSeconds}s</strong> before asking your next question.</span>
          </div>
          <span className="px-2.5 py-1 rounded-md bg-amber-200/80 dark:bg-amber-900/80 font-mono text-[11px] font-bold text-amber-900 dark:text-amber-100">
            {rateLimitSeconds}s
          </span>
        </div>
      )}

      {/* Chat Conversation Box */}
      <div className="border border-zinc-200 dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-900 overflow-hidden flex flex-col h-[520px]">
        {/* Messages Scroll Area */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.sender === "bot" && (
                <div className="h-8 w-8 rounded-full bg-sky-600 text-white flex items-center justify-center shrink-0 text-xs font-bold">
                  <Bot className="h-4 w-4" />
                </div>
              )}

              <div
                className={`max-w-[80%] rounded-2xl p-4 text-sm leading-relaxed ${
                  msg.sender === "user"
                    ? "bg-sky-600 text-white rounded-tr-none"
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700/60 rounded-tl-none"
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.text}</div>

                {/* Page Citations */}
                {msg.sources && msg.sources.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-zinc-200 dark:border-zinc-700/80 space-y-1">
                    <span className="text-[11px] font-semibold text-sky-600 dark:text-sky-400 flex items-center gap-1">
                      <BookOpen className="h-3 w-3" /> Cited Page Sources:
                    </span>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {msg.sources.map((s, idx) => (
                        <span
                          key={idx}
                          title={s.content_snippet}
                          className="px-2 py-0.5 rounded-md bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 text-[10px] font-medium border border-sky-200 dark:border-sky-800/60"
                        >
                          Page {s.page_number}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <span className={`block text-[10px] mt-1.5 ${msg.sender === "user" ? "text-sky-100 text-right" : "text-zinc-400"}`}>
                  {msg.timestamp}
                </span>
              </div>

              {msg.sender === "user" && (
                <div className="h-8 w-8 rounded-full bg-zinc-800 text-white flex items-center justify-center shrink-0 text-xs font-bold">
                  <User className="h-4 w-4" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-3 items-center text-zinc-400 text-xs py-2">
              <div className="h-8 w-8 rounded-full bg-sky-600/20 text-sky-600 flex items-center justify-center animate-pulse">
                <Bot className="h-4 w-4" />
              </div>
              <span className="animate-pulse font-medium">Searching textbook chunks & generating response...</span>
            </div>
          )}
        </div>

        {/* Suggested Chips */}
        <div className="px-4 py-2 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 flex items-center gap-2 overflow-x-auto scrollbar-none">
          <span className="text-[11px] font-semibold text-zinc-400 shrink-0">Try asking:</span>
          {suggestedQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(q)}
              className="text-xs px-2.5 py-1 rounded-full bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 hover:border-sky-500 hover:text-sky-600 transition-all shrink-0 whitespace-nowrap"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Ask any doubt about formulas, definitions, or problems..."
            className="flex-1 px-4 py-2.5 text-sm rounded-xl bg-zinc-100 dark:bg-zinc-800/80 text-zinc-900 dark:text-zinc-100 border border-transparent focus:border-sky-500 focus:outline-none transition-all"
          />
          <Button onClick={() => handleSend()} disabled={loading || !input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
