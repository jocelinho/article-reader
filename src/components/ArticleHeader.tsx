import type { ArticleMetadata } from "@/types/article";
import { formatDate, extractDomain } from "@/lib/utils";

interface ArticleHeaderProps {
  title: string;
  metadata?: ArticleMetadata;
  readingTime: number;
}

export function ArticleHeader({
  title,
  metadata,
  readingTime,
}: ArticleHeaderProps) {
  return (
    <header className="mb-8 pb-8 border-b border-zinc-200 dark:border-zinc-800">
      {/* Title */}
      <h1 className="text-3xl sm:text-4xl font-bold text-zinc-900 dark:text-zinc-100 leading-tight mb-4">
        {title}
      </h1>

      {/* Metadata row */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-zinc-500 dark:text-zinc-400">
        {metadata?.author && (
          <span className="flex items-center gap-1.5">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            <span className="font-medium">{metadata.author}</span>
          </span>
        )}
        {metadata?.date && (
          <span className="flex items-center gap-1.5">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            {formatDate(metadata.date)}
          </span>
        )}
        <span className="flex items-center gap-1.5">
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          {readingTime} min read
        </span>
        {metadata?.source && (
          <a
            href={metadata.source}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-zinc-500 dark:text-zinc-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
          >
            <span>Source: {extractDomain(metadata.source)}</span>
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
          </a>
        )}
      </div>
    </header>
  );
}
