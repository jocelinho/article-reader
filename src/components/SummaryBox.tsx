"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface SummaryBoxProps {
  summary: string;
  summaryZh?: string;
}

// Jocelin reads the Chinese summary — when it exists it IS the summary, shown
// first and full-size; the English original is demoted to a collapsed details.
export function SummaryBox({ summary, summaryZh }: SummaryBoxProps) {
  if (!summary && !summaryZh) return null;

  const proseClass =
    "prose prose-zinc dark:prose-invert max-w-none prose-p:leading-[1.9] prose-p:text-zinc-700 dark:prose-p:text-zinc-300 prose-p:text-base prose-p:my-3";

  return (
    <aside
      className="my-10 p-6 rounded-xl border-l-4"
      style={{
        borderLeftColor: 'var(--color-dark, #6594B1)',
        background: 'color-mix(in srgb, var(--color-light, #6594B1) 15%, transparent)',
      }}
    >
      {/* Heading with inline emoji */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-lg">✨</span>
        <h2 className="text-base font-semibold" style={{ color: 'var(--color-dark, #213C51)' }}>
          {summaryZh ? "摘要" : "Summary"}
        </h2>
      </div>

      {/* Primary summary: Chinese when available, else English */}
      <div className={`${proseClass}${summaryZh ? " lang-zh" : ""}`}>
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{summaryZh || summary}</ReactMarkdown>
      </div>

      {/* English original tucked away when Chinese is primary */}
      {summaryZh && summary && (
        <details className="mt-6 pt-4 border-t border-zinc-200/50 dark:border-zinc-700/50">
          <summary className="text-sm font-semibold text-zinc-600 dark:text-zinc-400 cursor-pointer select-none">
            English summary
          </summary>
          <div className={`${proseClass} mt-3`}>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{summary}</ReactMarkdown>
          </div>
        </details>
      )}
    </aside>
  );
}
