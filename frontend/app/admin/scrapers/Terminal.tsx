import React, { useEffect, useState, useRef } from "react";
import { Terminal as TerminalIcon } from "lucide-react";

interface LogEntry {
  msg: string;
  level: string;
}

export function TerminalLogStream() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // We assume backend is on the same host or proxy handles /api
    const eventSource = new EventSource(process.env.NEXT_PUBLIC_API_URL + "/scraper/logs/stream");

    eventSource.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        setLogs((prev) => [...prev, parsed].slice(-200)); // Keep last 200 logs to prevent lag
      } catch (e) {
        console.error("Failed to parse log entry", event.data);
      }
    };

    eventSource.onerror = () => {
      console.log("SSE error or disconnected, trying to reconnect...");
    };

    return () => {
      eventSource.close();
    };
  }, []);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs]);

  return (
    <div className="bg-zinc-950 rounded-xl border border-zinc-800 overflow-hidden shadow-inner flex flex-col h-[300px]">
      <div className="bg-zinc-900 border-b border-zinc-800 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-semibold text-zinc-400">
          <TerminalIcon className="h-4 w-4 text-emerald-500" /> Live Scraper Logs
        </div>
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-rose-500"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
        </div>
      </div>
      <div className="p-4 overflow-y-auto flex-1 font-mono text-xs leading-relaxed">
        {logs.length === 0 ? (
          <div className="text-zinc-600">Waiting for scraper events...</div>
        ) : (
          logs.map((log, index) => (
            <div key={index} className="mb-1">
              <span
                className={`font-bold mr-2 ${
                  log.level === "ERROR"
                    ? "text-rose-500"
                    : log.level === "WARNING"
                    ? "text-amber-500"
                    : "text-sky-500"
                }`}
              >
                [{log.level}]
              </span>
              <span className="text-zinc-300">{log.msg}</span>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
