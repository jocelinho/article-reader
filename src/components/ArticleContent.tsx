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
 * Preprocess content to convert semantic markers to HTML with color classes
 *
 * Color system:
 * - ==text== (Dark Blue) - Core concepts and key ideas
 * - ^^text^^ (Medium Blue) - Technical terms, people, products
 * - $$text$$ (Soft Pink) - Statistics, numbers, emphasis
 */
function preprocessContent(content: string): string {
  return content
    // Core concepts: ==concept== -> <span class="highlight-concept">concept</span>
    .replace(/==([^=]+)==/g, '<span class="highlight-concept">$1</span>')
    // Technical terms & people: ^^term^^ -> <span class="highlight-term">term</span>
    .replace(/\^\^([^\^]+)\^\^/g, '<span class="highlight-term">$1</span>')
    // Statistics & emphasis: $$stat$$ -> <span class="highlight-stat">stat</span>
    .replace(/\$\$([^\$]+)\$\$/g, '<span class="highlight-stat">$1</span>');
}

export function ArticleContent({ content, isChinese, isOriginal }: ArticleContentProps) {
  // Apply preprocessing to enhanced content only (not original)
  const processedContent = isOriginal ? content : preprocessContent(content);

  return (
    <article
      className={`prose prose-zinc dark:prose-invert max-w-none
        prose-headings:font-bold prose-headings:tracking-tight
        prose-h1:text-3xl prose-h2:text-2xl prose-h2:text-[#213C51] dark:prose-h2:text-[#6594B1] prose-h2:pb-2 prose-h2:border-b-2 prose-h2:border-[#DDAED3]/30
        prose-h3:text-xl
        prose-p:leading-relaxed
        prose-a:text-[#6594B1] dark:prose-a:text-[#89B4D1] prose-a:no-underline hover:prose-a:underline
        prose-blockquote:border-l-4 prose-blockquote:border-[#DDAED3] prose-blockquote:bg-gradient-to-r prose-blockquote:from-[#DDAED3]/10 prose-blockquote:to-transparent dark:prose-blockquote:from-[#DDAED3]/20 dark:prose-blockquote:to-transparent prose-blockquote:py-3 prose-blockquote:px-5 prose-blockquote:rounded-r-lg prose-blockquote:not-italic
        prose-code:bg-[#213C51]/10 dark:prose-code:bg-[#213C51]/30 prose-code:text-[#213C51] dark:prose-code:text-[#6594B1] prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none
        prose-pre:bg-[#213C51] dark:prose-pre:bg-[#213C51]/90 prose-pre:border prose-pre:border-[#6594B1]/30 prose-pre:whitespace-pre-wrap prose-pre:rounded-lg
        prose-img:rounded-lg prose-img:shadow-md
        prose-ul:my-6 prose-ol:my-6
        prose-li:my-2
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
