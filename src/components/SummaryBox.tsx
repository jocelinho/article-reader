"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface SummaryBoxProps {
  summary: string;
}

export function SummaryBox({ summary }: SummaryBoxProps) {
  if (!summary) return null;

  return (
    <aside className="my-10 p-6 bg-zinc-50 dark:bg-zinc-900/50 rounded-lg">
      {/* Heading with inline emoji */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-lg">✨</span>
        <h2 className="text-base font-semibold text-zinc-700 dark:text-zinc-300">
          Summary
        </h2>
      </div>

      {/* Clean text content */}
      <div className="prose prose-zinc dark:prose-invert max-w-none prose-p:leading-[1.9] prose-p:text-zinc-600 dark:prose-p:text-zinc-400 prose-p:text-base prose-p:my-3">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{summary}</ReactMarkdown>
      </div>
    </aside>
  );
}
