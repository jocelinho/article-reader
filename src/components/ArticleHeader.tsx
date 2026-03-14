"use client";

import { useState } from "react";
import type { ArticleMetadata } from "@/types/article";
import { formatDate, extractDomain } from "@/lib/utils";

interface ArticleHeaderProps {
  title: string;
  metadata?: ArticleMetadata;
  readingTime: number;
  hnScore?: number;
  hnComments?: number;
  whyPicked?: string;
}

export function ArticleHeader({
  title,
  metadata,
  readingTime,
  hnScore,
  hnComments,
  whyPicked,
}: ArticleHeaderProps) {
  const [showWhyPicked, setShowWhyPicked] = useState(false);

  return (
    <header
      className="mb-10 pb-8 -mx-6 sm:-mx-8 px-6 sm:px-8 py-8 rounded-xl border-b-2 bg-gradient-to-br from-[var(--color-light,#EEEEEE)]/40 to-transparent dark:from-[var(--color-dark,#213C51)]/20 dark:to-transparent"
      style={{ borderBottomColor: 'color-mix(in srgb, var(--color-medium, #6594B1) 20%, transparent)' }}
    >
      {/* Title row with why-picked icon */}
      <div className="flex items-start gap-3 mb-4">
        <h1 className="text-3xl sm:text-4xl font-bold leading-tight flex-1" style={{ color: 'var(--color-dark, #213C51)' }}>
          {title}
        </h1>
        {whyPicked && (
          <div className="relative flex-shrink-0 mt-1.5">
            <button
              onClick={() => setShowWhyPicked(!showWhyPicked)}
              className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-semibold transition-all hover:scale-110"
              style={{
                background: 'color-mix(in srgb, var(--color-medium, #6594B1) 15%, transparent)',
                color: 'var(--color-medium, #6594B1)',
                border: '1.5px solid var(--color-medium, #6594B1)',
              }}
              aria-label="Why this article was picked"
            >
              i
            </button>
            {showWhyPicked && (
              <div
                className="absolute right-0 top-10 z-50 w-72 p-4 rounded-lg shadow-lg text-sm leading-relaxed"
                style={{
                  background: 'var(--color-light, #f5f5f5)',
                  border: '1px solid color-mix(in srgb, var(--color-medium, #6594B1) 30%, transparent)',
                  color: 'var(--color-dark, #213C51)',
                }}
              >
                <div className="font-semibold mb-1.5" style={{ color: 'var(--color-medium, #6594B1)' }}>
                  Why this story
                </div>
                {whyPicked}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Metadata row */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-zinc-600 dark:text-zinc-400">
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
        {hnScore && (
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
                d="M5 15l7-7 7 7"
              />
            </svg>
            {hnScore} points
          </span>
        )}
        {hnComments && (
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
                d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
              />
            </svg>
            {hnComments} comments
          </span>
        )}
        {metadata?.source && (
          <a
            href={metadata.source}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-zinc-600 dark:text-zinc-400 transition-colors"
            style={{ ['--tw-text-opacity' as string]: 1 }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-medium, #6594B1)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '')}
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
