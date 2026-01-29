import LZString from "lz-string";
import type { ArticleData } from "@/types/article";

/**
 * Compress article data for URL encoding
 */
export function compressArticle(article: ArticleData): string {
  const json = JSON.stringify(article);
  return LZString.compressToEncodedURIComponent(json);
}

/**
 * Decompress article data from URL hash
 */
export function decompressArticle(compressed: string): ArticleData | null {
  try {
    const json = LZString.decompressFromEncodedURIComponent(compressed);
    if (!json) return null;
    return JSON.parse(json) as ArticleData;
  } catch {
    return null;
  }
}

/**
 * Generate a shareable URL for an article
 */
export function generateArticleUrl(
  baseUrl: string,
  article: ArticleData
): string {
  const compressed = compressArticle(article);
  return `${baseUrl}/read#${compressed}`;
}
