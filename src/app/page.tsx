"use client";

import { useState } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function Home() {
  const [testResult, setTestResult] = useState<{
    id: string;
    url: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  const createTestArticle = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/article", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source_type: "url",
          source_url: "https://example.com/article",
          raw_content: `# The Future of Reading

Reading has always been fundamental to human knowledge and culture. As we move into the digital age, the way we consume written content continues to evolve.

## Digital Transformation

Modern reading experiences combine the best of traditional print with the advantages of digital technology. We can now:

- Access millions of articles instantly
- Enjoy personalized reading experiences
- Share content seamlessly across platforms

## AI Enhancement

Artificial intelligence is revolutionizing how we interact with written content. AI can now:

1. **Summarize** long articles into key points
2. **Enhance** content with better structure and formatting
3. **Translate** content across languages
4. **Recommend** related reading materials

## The Reading Experience

The goal is to make reading more accessible, enjoyable, and enriching. By combining beautiful design with smart technology, we create experiences that honor both the content and the reader.

> "Reading is to the mind what exercise is to the body." — Joseph Addison

Whether you're reading news, literature, or technical documentation, the medium should never get in the way of the message.`,
          title: "The Future of Reading",
        }),
      });

      const data = await response.json();
      setTestResult({ id: data.id, url: data.url });
    } catch (error) {
      console.error("Failed to create test article:", error);
    } finally {
      setLoading(false);
    }
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
            AI-enhanced article reading with intelligent summarization and
            beautiful formatting.
          </p>
        </header>

        <section className="mb-12">
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
            How It Works
          </h2>
          <div className="space-y-4 text-zinc-600 dark:text-zinc-400">
            <p>
              Article Reader uses AI to transform raw content into beautifully
              formatted, easy-to-read articles with smart features.
            </p>
            <ol className="list-decimal list-inside space-y-2 ml-2">
              <li>Submit article content via the API</li>
              <li>AI generates title, summary, and enhanced formatting</li>
              <li>Content is cached in the database with deterministic IDs</li>
              <li>Share the URL — recipients see a beautifully formatted article</li>
            </ol>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
            For AI Agents
          </h2>
          <div className="bg-zinc-50 dark:bg-zinc-900 rounded-lg p-4 overflow-x-auto">
            <pre className="text-sm text-zinc-700 dark:text-zinc-300">
              <code>{`// Create or retrieve an article
const response = await fetch(\`\${baseUrl}/api/article\`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    source_type: "url",
    source_url: "https://example.com/article",
    raw_content: "Article content in markdown...",
    title: "Optional Title"
  })
});

const article = await response.json();
// article.url contains the shareable link
// e.g., /article?id=abc123...

// Retrieve existing article
const cached = await fetch(
  \`\${baseUrl}/api/article/\${articleId}\`
);`}</code>
            </pre>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
            Try It
          </h2>
          <div className="flex flex-col gap-3">
            <button
              onClick={createTestArticle}
              disabled={loading}
              className="px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-blue-300 transition-colors font-medium"
            >
              {loading ? "Creating..." : "Create Test Article"}
            </button>

            {testResult && (
              <div className="p-4 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 rounded-lg">
                <p className="text-sm text-green-900 dark:text-green-100 font-medium mb-2">
                  ✓ Article Created!
                </p>
                <p className="text-xs text-green-700 dark:text-green-300 mb-2 font-mono break-all">
                  ID: {testResult.id}
                </p>
                <a
                  href={testResult.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-sm transition-colors"
                >
                  View Article →
                </a>
              </div>
            )}
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
            Features
          </h2>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { icon: "🤖", text: "AI-generated summaries" },
              { icon: "✨", text: "Enhanced formatting" },
              { icon: "🌙", text: "Dark/Light mode" },
              { icon: "📱", text: "Mobile-friendly" },
              { icon: "🔤", text: "Bilingual typography" },
              { icon: "📊", text: "Reading progress" },
              { icon: "💾", text: "Deterministic caching" },
              { icon: "⚡", text: "Instant retrieval" },
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
        AI-enhanced reading experience powered by Claude
      </footer>
    </div>
  );
}
