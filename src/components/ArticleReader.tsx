"use client";

import { useEffect, useState } from "react";
import type { ArticleData } from "@/types/article";
import { decompressArticle } from "@/lib/compression";
import { estimateReadingTime, detectChinese } from "@/lib/utils";
import { ArticleHeader } from "./ArticleHeader";
import { ArticleContent } from "./ArticleContent";
import { ThemeToggle } from "./ThemeToggle";
import { ReadingProgress } from "./ReadingProgress";

export function ArticleReader() {
  const [article, setArticle] = useState<ArticleData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (!hash) {
      setError("No article content found in URL");
      setLoading(false);
      return;
    }

    const data = decompressArticle(hash);
    if (!data) {
      setError("Failed to decode article content");
      setLoading(false);
      return;
    }

    setArticle(data);
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-zinc-500 dark:text-zinc-400">
          Loading article...
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">📄</div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
            No Article Found
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 mb-6">
            {error || "The URL doesn't contain valid article content."}
          </p>
          <a
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Go to Home
          </a>
        </div>
      </div>
    );
  }

  const isChinese =
    article.m?.lang?.startsWith("zh") || detectChinese(article.c);
  const readingTime =
    article.m?.readingTime ||
    estimateReadingTime(article.c, article.m?.lang);

  return (
    <>
      <ReadingProgress />
      <div className="min-h-screen bg-white dark:bg-zinc-950">
        <div className="fixed top-4 right-4 z-40">
          <ThemeToggle />
        </div>
        <main
          className={`max-w-[65ch] mx-auto px-4 sm:px-6 py-12 sm:py-16 ${
            isChinese ? "lang-zh" : ""
          }`}
          lang={article.m?.lang || (isChinese ? "zh-TW" : "en")}
        >
          <ArticleHeader
            title={article.t}
            metadata={article.m}
            readingTime={readingTime}
          />
          <ArticleContent content={article.c} isChinese={isChinese} />
        </main>
      </div>
    </>
  );
}
