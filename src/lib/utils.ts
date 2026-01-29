/**
 * Estimate reading time based on content length
 * Uses ~200 words per minute for English, ~300 characters per minute for Chinese
 */
export function estimateReadingTime(
  content: string,
  lang?: string
): number {
  if (lang === "zh-TW" || lang === "zh-CN" || lang === "zh") {
    // Chinese: count characters, ~300 chars/min
    const charCount = content.replace(/\s/g, "").length;
    return Math.max(1, Math.ceil(charCount / 300));
  }

  // English: count words, ~200 words/min
  const wordCount = content.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(wordCount / 200));
}

/**
 * Detect if content is primarily Chinese
 */
export function detectChinese(text: string): boolean {
  const chineseRegex = /[\u4e00-\u9fff]/g;
  const chineseChars = text.match(chineseRegex) || [];
  const totalChars = text.replace(/\s/g, "").length;
  return chineseChars.length > totalChars * 0.3;
}

/**
 * Format a date string for display
 */
export function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return dateString;
  }
}
