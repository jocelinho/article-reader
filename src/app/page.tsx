"use client";

import { useState } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { compressArticle } from "@/lib/compression";
import type { ArticleData } from "@/types/article";

const sampleArticle: ArticleData = {
  t: "The Art of Reading",
  c: `# The Art of Reading

Reading is one of the most profound activities a human can engage in. It allows us to transcend time and space, to experience lives we could never live, and to think thoughts that originated in minds far removed from our own.

## Why We Read

There are many reasons why people read:

1. **For knowledge** - Books are repositories of human wisdom
2. **For pleasure** - Stories transport us to other worlds
3. **For connection** - Reading helps us understand others
4. **For growth** - Every book changes us in some way

> "A reader lives a thousand lives before he dies. The man who never reads lives only one." — George R.R. Martin

## The Digital Age

In our digital age, reading has transformed. We now have access to more text than ever before, yet our attention spans seem to shrink. This paradox defines our relationship with written content.

### Finding Balance

The key is to find balance between:

- Quick, digestible content for staying informed
- Deep, long-form reading for true understanding

## Conclusion

Whether you're reading a novel, a technical manual, or an article like this one, remember that each word was carefully chosen to convey meaning. Take your time, savor the prose, and let the ideas sink in.

---

*Happy reading!*`,
  m: {
    author: "Article Reader Team",
    date: new Date().toISOString(),
    lang: "en",
  },
};

export default function Home() {
  const [copied, setCopied] = useState(false);

  const generateSampleUrl = () => {
    const compressed = compressArticle(sampleArticle);
    const url = `${window.location.origin}/read#${compressed}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const openSampleArticle = () => {
    const compressed = compressArticle(sampleArticle);
    window.open(`/read#${compressed}`, "_blank");
  };

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      <div className="fixed top-4 right-4 z-40">
        <ThemeToggle />
      </div>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <header className="text-center mb-16">
          <h1 className="text-4xl sm:text-5xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">
            Article Reader
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-md mx-auto">
            A beautiful, distraction-free reading experience for articles shared
            via URL encoding.
          </p>
        </header>

        <section className="mb-12">
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
            How It Works
          </h2>
          <div className="space-y-4 text-zinc-600 dark:text-zinc-400">
            <p>
              Article Reader uses URL hash encoding to store article content
              directly in the URL. No database, no server storage — just a clean
              link that contains everything.
            </p>
            <ol className="list-decimal list-inside space-y-2 ml-2">
              <li>AI agents compress article content using LZ-String</li>
              <li>The compressed content is encoded in the URL hash</li>
              <li>Share the URL — it contains the full article</li>
              <li>Recipients see a beautifully formatted reading experience</li>
            </ol>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
            For AI Agents
          </h2>
          <div className="bg-zinc-50 dark:bg-zinc-900 rounded-lg p-4 overflow-x-auto">
            <pre className="text-sm text-zinc-700 dark:text-zinc-300">
              <code>{`import LZString from "lz-string";

const article = {
  t: "Article Title",
  c: "# Markdown content...",
  m: { lang: "en", author: "Name" }
};

const url = \`\${baseUrl}/read#\${
  LZString.compressToEncodedURIComponent(
    JSON.stringify(article)
  )
}\`;`}</code>
            </pre>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
            Try It
          </h2>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={openSampleArticle}
              className="flex-1 px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
            >
              View Sample Article
            </button>
            <button
              onClick={generateSampleUrl}
              className="flex-1 px-4 py-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors font-medium"
            >
              {copied ? "Copied!" : "Copy Sample URL"}
            </button>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
            Features
          </h2>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { icon: "🌙", text: "Dark/Light mode" },
              { icon: "📱", text: "Mobile-friendly" },
              { icon: "🔤", text: "Bilingual typography" },
              { icon: "📊", text: "Reading progress" },
              { icon: "🔗", text: "No database needed" },
              { icon: "⚡", text: "Instant loading" },
            ].map((feature) => (
              <li
                key={feature.text}
                className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-900 rounded-lg"
              >
                <span className="text-xl">{feature.icon}</span>
                <span className="text-zinc-700 dark:text-zinc-300">
                  {feature.text}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </main>

      <footer className="border-t border-zinc-200 dark:border-zinc-800 py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
        Built for seamless AI-to-human content sharing
      </footer>
    </div>
  );
}
