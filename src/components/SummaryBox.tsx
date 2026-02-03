"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface SummaryBoxProps {
  summary: string;
}

export function SummaryBox({ summary }: SummaryBoxProps) {
  if (!summary) return null;

  return (
    <div className="mb-8 p-6 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-lg">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-1">
          <svg
            className="w-5 h-5 text-blue-600 dark:text-blue-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2 uppercase tracking-wide">
            AI Summary
          </h2>
          <div className="prose prose-sm prose-zinc dark:prose-invert max-w-none prose-p:leading-relaxed prose-p:my-1">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{summary}</ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  );
}
