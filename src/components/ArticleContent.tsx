"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface ArticleContentProps {
  content: string;
  isChinese?: boolean;
  isOriginal?: boolean;
}

export function ArticleContent({ content, isChinese, isOriginal }: ArticleContentProps) {
  return (
    <article
      className={`prose prose-zinc dark:prose-invert max-w-none
        prose-headings:font-bold prose-headings:tracking-tight
        prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl
        prose-p:leading-relaxed
        prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline
        prose-blockquote:border-l-blue-500 prose-blockquote:bg-zinc-50 dark:prose-blockquote:bg-zinc-900 prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:not-italic
        prose-code:bg-zinc-100 dark:prose-code:bg-zinc-800 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none
        prose-pre:bg-zinc-900 dark:prose-pre:bg-zinc-950 prose-pre:border prose-pre:border-zinc-800 prose-pre:whitespace-pre-wrap
        prose-img:rounded-lg prose-img:shadow-md
        ${isChinese ? "chinese-text" : ""}
        ${isOriginal ? "whitespace-pre-wrap" : ""}
      `}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Preserve whitespace in code blocks for original content
          pre: ({ node, ...props }) => (
            <pre {...props} style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word' }} />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </article>
  );
}
