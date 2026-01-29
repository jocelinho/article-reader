export interface ArticleData {
  /** Article title */
  t: string;
  /** Article content (markdown) */
  c: string;
  /** Optional metadata */
  m?: ArticleMetadata;
}

export interface ArticleMetadata {
  /** Language code (e.g., "en", "zh-TW") */
  lang?: string;
  /** Author name */
  author?: string;
  /** Source URL */
  source?: string;
  /** Publication date */
  date?: string;
  /** Estimated reading time in minutes */
  readingTime?: number;
}
