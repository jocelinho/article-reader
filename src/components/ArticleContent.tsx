"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";

interface ArticleContentProps {
  content: string;
  isChinese?: boolean;
  isOriginal?: boolean;
}

/**
 * Preprocess content to convert semantic markers and block syntax to HTML
 *
 * Inline highlights:
 * - ==text== (Dynamic Dark) - Core concepts → pill backgrounds
 * - ^^text^^ (Dynamic Medium) - Technical terms → dotted underlines
 * - $$text$$ (Dynamic Accent) - Statistics → marker highlighting
 *
 * Block containers:
 * - :::callout Title\ncontent\n::: → styled callout box
 * - :::pullquote\ncontent\n::: → styled pullquote
 * - :::data Title\ncontent\n::: → styled data card
 */
function preprocessContent(content: string): string {
  // Process block containers first (before inline markers)
  let processed = content
    // Callout blocks: :::callout Title\ncontent\n:::
    .replace(
      /:::callout\s*(.*?)\n([\s\S]*?):::/g,
      (_match, title: string, body: string) =>
        `<div class="article-callout">${title.trim() ? `<div class="block-title">${title.trim()}</div>` : ''}\n\n${body.trim()}\n\n</div>`
    )
    // Pullquote blocks: :::pullquote\ncontent\n:::
    .replace(
      /:::pullquote\s*\n([\s\S]*?):::/g,
      (_match, body: string) =>
        `<div class="article-pullquote">\n\n${body.trim()}\n\n</div>`
    )
    // Data blocks: :::data Title\ncontent\n:::
    .replace(
      /:::data\s*(.*?)\n([\s\S]*?):::/g,
      (_match, title: string, body: string) =>
        `<div class="article-data-card">${title.trim() ? `<div class="block-title">${title.trim()}</div>` : ''}\n\n${body.trim()}\n\n</div>`
    );

  // Process inline highlights
  processed = processed
    // Core concepts: ==concept== -> pill-style highlight
    .replace(/==([^=]+)==/g, '<span class="highlight-concept">$1</span>')
    // Technical terms & people: ^^term^^ -> dotted underline
    .replace(/\^\^([^\^]+)\^\^/g, '<span class="highlight-term">$1</span>')
    // Statistics & emphasis: $$stat$$ -> marker highlight
    .replace(/\$\$([^\$]+)\$\$/g, '<span class="highlight-stat">$1</span>');

  return processed;
}

export function ArticleContent({ content, isChinese, isOriginal }: ArticleContentProps) {
  // Apply preprocessing to enhanced content only (not original)
  const processedContent = isOriginal ? content : preprocessContent(content);

  return (
    <article
      className={`article-prose prose prose-zinc dark:prose-invert max-w-none
        prose-headings:font-bold prose-headings:tracking-tight
        prose-a:no-underline hover:prose-a:underline
        prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none
        prose-pre:border prose-pre:whitespace-pre-wrap prose-pre:rounded-lg
        prose-img:rounded-lg prose-img:shadow-md
        ${isChinese ? "chinese-text" : ""}
        ${isOriginal ? "whitespace-pre-wrap" : ""}
      `}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          // Preserve whitespace in code blocks for original content
          pre: ({ node, ...props }) => (
            <pre {...props} style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word' }} />
          ),
        }}
      >
        {processedContent}
      </ReactMarkdown>
    </article>
  );
}
