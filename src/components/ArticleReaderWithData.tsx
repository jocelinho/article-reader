"use client";

import { useState, useMemo } from "react";
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

/**
 * Generate a color palette from article ID hash
 * Same article always gets same colors, but varies across articles
 */
function generateColorPalette(id: string) {
  // Use article ID as seed for consistent but varied colors
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash) + id.charCodeAt(i);
    hash |= 0;
  }

  // Generate hue values (0-360) from hash
  const hue1 = Math.abs(hash % 360);
  const hue2 = (hue1 + 120) % 360; // Complementary color
  const hue3 = (hue1 + 240) % 360; // Triadic color

  return {
    // Dark color for concepts
    dark: `hsl(${hue1}, 45%, 35%)`,
    darkLight: `hsl(${hue1}, 55%, 55%)`,
    // Medium color for technical terms
    medium: `hsl(${hue2}, 50%, 50%)`,
    mediumLight: `hsl(${hue2}, 55%, 65%)`,
    // Accent color for stats/emphasis
    accent: `hsl(${hue3}, 55%, 60%)`,
    accentLight: `hsl(${hue3}, 60%, 70%)`,
    // Light background
    light: `hsl(${hue1}, 20%, 95%)`,
  };
}

export function ArticleReaderWithData({ article }: ArticleReaderWithDataProps) {
  // Generate color palette from article ID
  const colorPalette = useMemo(() => generateColorPalette(article.id), [article.id]);
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
      <div
        className="min-h-screen bg-white dark:bg-zinc-950"
        style={{
          // Apply dynamic color palette as CSS variables
          ['--color-dark' as string]: colorPalette.dark,
          ['--color-dark-light' as string]: colorPalette.darkLight,
          ['--color-medium' as string]: colorPalette.medium,
          ['--color-medium-light' as string]: colorPalette.mediumLight,
          ['--color-accent' as string]: colorPalette.accent,
          ['--color-accent-light' as string]: colorPalette.accentLight,
          ['--color-light' as string]: colorPalette.light,
        }}
      >
        <div className="fixed top-4 right-4 z-40 flex items-center gap-2">
          <ContentToggle mode={contentMode} onToggle={setContentMode} />
          <ThemeToggle />
        </div>
        <main
          className={`max-w-[75ch] md:max-w-4xl lg:max-w-5xl xl:max-w-6xl 2xl:max-w-7xl mx-auto px-6 sm:px-8 py-12 sm:py-16 ${
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
            hnScore={article.hn_score}
            hnComments={article.hn_comments}
            whyPicked={article.why_picked}
          />
          {article.ai_summary && <SummaryBox summary={article.ai_summary} summaryZh={article.ai_summary_zh} />}
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
