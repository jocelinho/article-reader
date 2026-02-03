"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getArticle } from "@/lib/api";
import { ArticleReaderWithData } from "@/components/ArticleReaderWithData";
import type { ArticleResponse } from "@/lib/api";

function ArticleContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  const [article, setArticle] = useState<ArticleResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setError("No article ID provided in URL");
      setLoading(false);
      return;
    }

    async function fetchArticle() {
      if (!id) return; // Type guard for TypeScript

      try {
        setLoading(true);
        setError(null);
        const data = await getArticle(id);
        setArticle(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load article");
      } finally {
        setLoading(false);
      }
    }

    fetchArticle();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-zinc-300 dark:border-zinc-700 border-t-blue-600 dark:border-t-blue-400"></div>
          <p className="mt-4 text-zinc-600 dark:text-zinc-400">
            Loading article...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white dark:bg-zinc-950 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
            Error Loading Article
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400 mb-6">{error}</p>
          <a
            href="/"
            className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Go Home
          </a>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-white dark:bg-zinc-950 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">🔍</div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
            Article Not Found
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400 mb-6">
            The article you&apos;re looking for doesn&apos;t exist or has been
            removed.
          </p>
          <a
            href="/"
            className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Go Home
          </a>
        </div>
      </div>
    );
  }

  return <ArticleReaderWithData article={article} />;
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-zinc-300 dark:border-zinc-700 border-t-blue-600 dark:border-t-blue-400"></div>
        <p className="mt-4 text-zinc-600 dark:text-zinc-400">
          Loading...
        </p>
      </div>
    </div>
  );
}

export default function ArticlePage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ArticleContent />
    </Suspense>
  );
}
