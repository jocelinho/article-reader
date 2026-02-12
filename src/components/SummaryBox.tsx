"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface SummaryBoxProps {
  summary: string;
  summaryZh?: string;
}

export function SummaryBox({ summary, summaryZh }: SummaryBoxProps) {
  if (!summary) return null;

  return (
    <aside className="my-10 p-6 rounded-xl border-l-4 border-[#6594B1] bg-gradient-to-r from-[#6594B1]/10 to-transparent dark:from-[#6594B1]/20 dark:to-transparent">
      {/* Heading with inline emoji */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-lg">✨</span>
        <h2 className="text-base font-semibold text-[#213C51] dark:text-[#6594B1]">
          Summary
        </h2>
      </div>

      {/* English summary */}
      <div className="prose prose-zinc dark:prose-invert max-w-none prose-p:leading-[1.9] prose-p:text-zinc-700 dark:prose-p:text-zinc-300 prose-p:text-base prose-p:my-3">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{summary}</ReactMarkdown>
      </div>

      {/* Chinese summary if available */}
      {summaryZh && (
        <div className="mt-6 pt-6 border-t border-zinc-200/50 dark:border-zinc-700/50">
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-sm font-semibold text-zinc-600 dark:text-zinc-400">
              摘要 (繁體中文)
            </h3>
          </div>
          <div className="prose prose-zinc dark:prose-invert max-w-none prose-p:leading-[1.9] prose-p:text-zinc-700 dark:prose-p:text-zinc-300 prose-p:text-base prose-p:my-3 lang-zh">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{summaryZh}</ReactMarkdown>
          </div>
        </div>
      )}
    </aside>
  );
}
