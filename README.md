# Article Reader

AI-powered article enhancement and reading platform. Submit raw article content and get back beautifully formatted, summarized, and semantically highlighted articles with bilingual support.

## Features

- **AI-powered summarization** — Structured summaries with TLDR and key takeaways via Claude
- **Bilingual summaries** — English + Traditional Chinese (繁體中文)
- **Deterministic caching** — SHA-256 content hashing ensures identical content is only processed once
- **Dynamic color palettes** — Per-article color themes generated from content
- **Semantic highlighting** — Inline markers for concepts, technical terms, and statistics
- **Visual content blocks** — Callouts, pullquotes, and data cards break up walls of text
- **Dark/light theme** — System-aware with manual toggle and reading progress indicator
- **REST API** — Programmatic article submission and retrieval

## Tech Stack

- **Next.js 15** (static export) + **React 19**
- **Cloudflare Pages + D1** (edge SQLite database)
- **Claude API** (Sonnet) for AI processing
- **Tailwind CSS 4** with `@tailwindcss/typography`
- **TypeScript** throughout

## Getting Started

### Prerequisites

- Node.js 18+
- A [Cloudflare](https://www.cloudflare.com/) account
- An [Anthropic API key](https://console.anthropic.com/)

### Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/article-reader.git
cd article-reader

# Install dependencies
npm install

# Configure environment
cp .dev.vars.example .dev.vars
# Edit .dev.vars and add your ANTHROPIC_API_KEY

# Create the D1 database (first time only)
npm run db:create

# Run D1 migrations locally
npm run db:migrate:local

# Start the Next.js dev server
npm run dev

# In a separate terminal, start the Cloudflare Workers dev server
npm run wrangler:dev
```

The frontend runs at `http://localhost:3000` and the API at `http://localhost:8788`.

## API Reference

### Submit an article

```
POST /api/article
Content-Type: application/json
```

**Request body:**

```json
{
  "source_type": "url",
  "source_url": "https://example.com/article",
  "raw_content": "The full text of the article...",
  "title": "Optional title"
}
```

**Response** (`201 Created` or `200 OK` if cached):

```json
{
  "id": "a1b2c3...",
  "title": "Article Title",
  "ai_summary": "**TLDR:** ...\n\n**Key Takeaways:**\n- ...",
  "ai_summary_zh": "**TLDR:** ...",
  "ai_enhanced_content": "## Section One\n\nEnhanced markdown...",
  "raw_content": "Original text...",
  "language": "en",
  "reading_time": 5,
  "status": "complete",
  "created_at": "2026-03-14T00:00:00.000Z",
  "url": "https://your-domain.com/article?id=a1b2c3..."
}
```

**curl example:**

```bash
curl -X POST https://your-domain.com/api/article \
  -H "Content-Type: application/json" \
  -d '{"source_type": "url", "raw_content": "Your article text here..."}'
```

### Retrieve an article

```
GET /api/article/:id
```

**Response** (`200 OK`):

Returns the same article response format as above.

**curl example:**

```bash
curl https://your-domain.com/api/article/a1b2c3...
```

## Project Structure

```
article-reader/
├── src/
│   ├── app/              # Next.js pages (home, article viewer)
│   ├── components/       # React components (ArticleContent, SummaryBox, ThemeToggle, etc.)
│   ├── lib/              # Utilities (API client, compression)
│   └── types/            # TypeScript type definitions
├── functions/
│   └── api/              # Cloudflare Workers API handlers
│       ├── article.ts    # POST /api/article
│       └── article/
│           └── [id].ts   # GET /api/article/:id
├── migrations/           # D1 database migrations
├── wrangler.toml         # Cloudflare Workers configuration
└── package.json
```

## Deployment

```bash
# Build and deploy to Cloudflare Pages
npm run deploy

# Apply D1 migrations to production
npm run db:migrate
```

Set `ANTHROPIC_API_KEY` as an environment variable in the [Cloudflare dashboard](https://dash.cloudflare.com/) under your Pages project settings.

## License

MIT
