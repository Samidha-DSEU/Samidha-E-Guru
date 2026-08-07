"use client";

import React, { useState } from "react";
import { ChevronRight, ChevronDown, Network, Sparkles } from "lucide-react";
import { MindMapNode } from "../services/learnAiService";

function TreeNode({ node, depth = 0 }: { node: MindMapNode; depth?: number }) {
  const [open, setOpen] = useState(true);
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div className="space-y-2">
      <div
        onClick={() => hasChildren && setOpen(!open)}
        className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
          depth === 0
            ? "bg-sky-600 text-white border-sky-600 shadow-md text-sm"
            : depth === 1
            ? "bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800/60 hover:border-sky-400"
            : "bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:border-zinc-400"
        }`}
      >
        {hasChildren && (
          open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />
        )}
        <span>{node.label}</span>
      </div>

      {hasChildren && open && (
        <div className="pl-6 border-l-2 border-sky-200 dark:border-sky-800/60 ml-3 space-y-2 pt-1">
          {node.children!.map((child) => (
            <TreeNode key={child.id} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export function MindMapTab({ mindMap }: { mindMap: MindMapNode }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Network className="h-5 w-5 text-sky-600 dark:text-sky-400" />
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Interactive Concept Hierarchy Tree
          </h3>
        </div>
        <span className="text-xs text-zinc-400">Click node branches to expand/collapse</span>
      </div>

      <div className="p-6 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 overflow-x-auto min-h-[300px]">
        <TreeNode node={mindMap} />
      </div>
    </div>
  );
}
