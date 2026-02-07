"use client";

import { useState } from "react";
import type { ArticleResponse } from "@/lib/api";
import { detectChinese } from "@/lib/utils";
import { ArticleHeader } from "./ArticleHeader";
import { ArticleContent } from "./ArticleContent";
import { SummaryBox } from "./SummaryBox";
import { ContentToggle } from "./ContentToggle";
import { ThemeToggle } from "./ThemeToggle";
import { ReadingProgress } from "./ReadingProgress";

interface ArticleReaderWithDataProps {
  article: ArticleResponse;
}

export function ArticleReaderWithData({ article }: ArticleReaderWithDataProps) {
  const [contentMode, setContentMode] = useState<"enhanced" | "original">(
    "enhanced"
  );

  // Detect if content is Chinese
  const isChinese =
    article.language.startsWith("zh") ||
    detectChinese(article.ai_enhanced_content) ||
    detectChinese(article.raw_content);

  // Select content based on mode
  const displayContent =
    contentMode === "enhanced"
      ? article.ai_enhanced_content
      : article.raw_content;

  return (
    <>
      <ReadingProgress />
      <div className="min-h-screen bg-white dark:bg-zinc-950">
        <div className="fixed top-4 right-4 z-40 flex items-center gap-2">
          <ContentToggle mode={contentMode} onToggle={setContentMode} />
          <ThemeToggle />
        </div>
        <main
          className={`max-w-[75ch] lg:max-w-3xl mx-auto px-6 sm:px-8 py-12 sm:py-16 ${
            isChinese ? "lang-zh" : ""
          }`}
          lang={article.language || (isChinese ? "zh-TW" : "en")}
        >
          <ArticleHeader
            title={article.title}
            metadata={{
              lang: article.language,
              source: article.source_url,
              author: article.author,
            }}
            readingTime={article.reading_time}
          />
          {article.ai_summary && <SummaryBox summary={article.ai_summary} />}
          <ArticleContent
            content={displayContent}
            isChinese={isChinese}
            isOriginal={contentMode === "original"}
          />
        </main>
      </div>
    </>
  );
}
