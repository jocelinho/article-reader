# Article Reader v2 - Design Document

> AI-enhanced article reading with deterministic caching

## Overview

Transform the current client-side-only article reader into a backend-powered system that:
1. Accepts raw content from agents (URLs or emails)
2. Processes with AI to generate title, summary, and enhanced content
3. Caches results deterministically (same content = same output)
4. Displays in a 3-tier reading experience

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CURRENT STATE                            │
│  Agent → compressArticle() → URL hash → Client decompresses     │
│  (No backend, content lives in URL)                             │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                        TARGET STATE                             │
│                                                                 │
│  ┌─────────┐    ┌──────────────────┐    ┌─────────────────┐    │
│  │  Agent  │───►│ Cloudflare Worker │───►│  Cloudflare D1  │    │
│  └─────────┘    │  /api/article     │    │  (SQLite edge)  │    │
│                 │                   │    └─────────────────┘    │
│                 │  1. Hash content  │                           │
│                 │  2. Check cache   │                           │
│                 │  3. AI process    │                           │
│                 │  4. Store result  │                           │
│                 └──────────────────┘                            │
│                          │                                      │
│                          ▼                                      │
│                 ┌──────────────────┐                            │
│                 │  /read/:id       │                            │
│                 │  (Next.js page)  │                            │
│                 └──────────────────┘                            │
└─────────────────────────────────────────────────────────────────┘
```

## Database Schema (Cloudflare D1)

```sql
CREATE TABLE articles (
  -- Identity
  id                  TEXT PRIMARY KEY,   -- SHA256(raw_content)
  source_type         TEXT NOT NULL,      -- 'url' | 'email'
  source_url          TEXT,               -- Original URL (nullable)
  email_message_id    TEXT,               -- Gmail ID (nullable)

  -- The 3 tiers of content
  raw_content         TEXT NOT NULL,      -- Original, unmodified
  ai_summary          TEXT,               -- One paragraph TL;DR
  ai_enhanced_content TEXT,               -- With section titles, cleaned up

  -- Display metadata
  title               TEXT,               -- AI-generated or extracted
  language            TEXT,               -- 'en', 'zh-TW', auto-detected
  reading_time        INTEGER,            -- Minutes (from enhanced content)

  -- System
  status              TEXT DEFAULT 'pending',  -- 'pending' | 'complete' | 'failed'
  created_at          TEXT DEFAULT CURRENT_TIMESTAMP,
  processed_at        TEXT
);

-- Indexes for fast lookups
CREATE INDEX idx_source_url ON articles(source_url);
CREATE INDEX idx_email_id ON articles(email_message_id);
CREATE INDEX idx_status ON articles(status);
```

### Why SHA256 as ID?

- **Deterministic**: Same content always produces same hash
- **Deduplication**: Submitting identical content returns existing entry
- **Cache-friendly**: Hash is the cache key
- **URL-safe**: Can be used directly in `/read/:id`

## API Design

### POST /api/article

Create or retrieve an article.

**Request:**
```json
{
  "source_type": "url",
  "source_url": "https://example.com/article",
  "raw_content": "The full article text...",
  "title": "Optional title if known"
}
```

For emails:
```json
{
  "source_type": "email",
  "email_message_id": "18d4a5b2c3e4f5a6",
  "raw_content": "Email body content...",
  "title": "Email subject line"
}
```

**Response:**
```json
{
  "id": "a1b2c3d4e5f6...",
  "title": "AI-Generated or Provided Title",
  "ai_summary": "A concise paragraph summarizing the key points...",
  "ai_enhanced_content": "# Section 1\n\nEnhanced content with headers...",
  "raw_content": "Original unmodified content...",
  "language": "en",
  "reading_time": 5,
  "status": "complete",
  "created_at": "2024-01-15T10:30:00Z",
  "url": "https://article-reader.pages.dev/read/a1b2c3d4e5f6"
}
```

**Flow:**
1. Hash `raw_content` to get ID
2. Check D1 for existing entry with this ID
3. If exists and complete → return cached result (instant)
4. If new → process with AI → store → return

### GET /api/article/:id

Retrieve an existing article.

**Response:** Same as POST response

**Error (404):**
```json
{
  "error": "Article not found"
}
```

## AI Processing

### Input to AI

```
Given this article content, produce:

1. TITLE: A clear, descriptive title (if not provided)

2. SUMMARY: One paragraph (3-5 sentences) that captures:
   - The main topic/argument
   - Key insights or findings
   - Why it matters

3. ENHANCED CONTENT: The full article with:
   - Section headers added where natural breaks occur
   - Slightly cleaned up for readability (fix obvious formatting issues)
   - Preserve the original meaning and tone
   - Keep all important details

Content:
---
{raw_content}
---
```

### AI Provider Options

| Option | Pros | Cons |
|--------|------|------|
| **Cloudflare Workers AI** | Native integration, no API keys | Limited model quality |
| **Claude API** | Best quality, nuanced understanding | Needs API key, costs |
| **OpenAI API** | Good quality, fast | Needs API key, costs |

**Recommendation:** Start with Claude API for quality, can swap later.

### Response Parsing

AI returns structured output:
```
TITLE: ...

SUMMARY:
...

ENHANCED CONTENT:
...
```

Parse into separate fields for storage.

## Frontend Changes

### New Route: /read/[id]

Dynamic route that fetches article by ID from API.

```
/read/abc123def456
  ↓
GET /api/article/abc123def456
  ↓
Render ArticleReader with data
```

### 3-Tier Content Display

```
┌─────────────────────────────────────────────────┐
│  Title                                          │
│  Reading time · Language                        │
├─────────────────────────────────────────────────┤
│  📋 SUMMARY                                     │
│  ┌─────────────────────────────────────────┐   │
│  │ One paragraph TL;DR displayed in a      │   │
│  │ highlighted box at the top              │   │
│  └─────────────────────────────────────────┘   │
├─────────────────────────────────────────────────┤
│  📖 CONTENT                    [Enhanced ▼]     │
│                                                 │
│  ## Section 1                                   │
│  Enhanced content with AI-added headers...     │
│                                                 │
│  ## Section 2                                   │
│  More enhanced content...                       │
│                                                 │
├─────────────────────────────────────────────────┤
│  Toggle dropdown options:                       │
│  - Enhanced (default)                           │
│  - Original                                     │
└─────────────────────────────────────────────────┘
```

### Component Changes

| Component | Change |
|-----------|--------|
| `ArticleReader.tsx` | Accept data prop instead of URL hash extraction |
| `ArticleHeader.tsx` | Add summary display box |
| `ArticleContent.tsx` | Add toggle for enhanced/raw |
| `ContentToggle.tsx` | New component for view switching |
| `read/[id]/page.tsx` | New dynamic route with data fetching |

### Backward Compatibility

Keep `/read#hash` route working for existing URLs:
- If hash present → decompress and display (legacy mode)
- If no hash → redirect to home or show error

## File Structure

```
article-reader/
├── src/
│   ├── app/
│   │   ├── page.tsx                    # Home (update demo)
│   │   ├── read/
│   │   │   ├── page.tsx                # Legacy hash-based (keep)
│   │   │   └── [id]/
│   │   │       └── page.tsx            # New ID-based route
│   │   └── api/                        # Note: Using Workers, not Next API
│   │
│   ├── components/
│   │   ├── ArticleReader.tsx           # Update for new data shape
│   │   ├── ArticleHeader.tsx           # Add summary box
│   │   ├── ArticleContent.tsx          # Add view toggle
│   │   ├── ContentToggle.tsx           # NEW: Enhanced/Raw switcher
│   │   └── SummaryBox.tsx              # NEW: Summary display
│   │
│   └── lib/
│       ├── compression.ts              # Keep for legacy support
│       ├── api.ts                      # NEW: API client
│       └── utils.ts                    # Keep existing
│
├── functions/                          # Cloudflare Workers
│   └── api/
│       ├── article.ts                  # POST and GET handlers
│       └── _middleware.ts              # CORS, error handling
│
├── migrations/                         # D1 migrations
│   └── 0001_initial.sql
│
├── wrangler.toml                       # Cloudflare config
├── package.json                        # Add wrangler dep
└── DESIGN.md                           # This file
```

## Implementation Phases

### Phase 1: Infrastructure Setup
- [ ] Add `wrangler.toml` with D1 binding
- [ ] Create D1 database via Wrangler CLI
- [ ] Add initial migration `0001_initial.sql`
- [ ] Run migration to create table
- [ ] Update `package.json` with wrangler scripts

### Phase 2: API Implementation
- [ ] Create `functions/api/article.ts`
- [ ] Implement POST handler (hash, check cache, process, store)
- [ ] Implement GET handler (retrieve by ID)
- [ ] Add error handling middleware
- [ ] Test locally with `wrangler dev`

### Phase 3: AI Integration
- [ ] Set up AI provider (Claude API recommended)
- [ ] Create prompt for title/summary/enhancement
- [ ] Implement response parsing
- [ ] Add API key to Cloudflare secrets
- [ ] Test AI processing flow

### Phase 4: Frontend Updates
- [ ] Create `/read/[id]` dynamic route
- [ ] Add `SummaryBox` component
- [ ] Add `ContentToggle` component
- [ ] Update `ArticleReader` for new data shape
- [ ] Keep legacy hash route working
- [ ] Test full flow

### Phase 5: Deployment & Testing
- [ ] Deploy D1 database to production
- [ ] Deploy Workers + Pages
- [ ] Update GitHub Actions if needed
- [ ] Test production flow end-to-end
- [ ] Update ArticleReader skill to use new API

## Environment Variables / Secrets

```bash
# Cloudflare (set via wrangler secret)
ANTHROPIC_API_KEY=sk-ant-...    # For Claude API

# Local development (.dev.vars)
ANTHROPIC_API_KEY=sk-ant-...
```

## Commands Reference

```bash
# Create D1 database
wrangler d1 create article-reader-db

# Run migrations
wrangler d1 migrations apply article-reader-db

# Local development
wrangler dev

# Deploy
wrangler deploy

# Set secrets
wrangler secret put ANTHROPIC_API_KEY
```

## Open Questions

1. **Rate limiting?** - Should we limit API calls per IP/agent?
2. **Content size limit?** - Max article size to process?
3. **Error recovery?** - What if AI fails mid-processing?
4. **Analytics?** - Track popular articles, read counts?

## Decisions Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2024-XX-XX | Use D1 over Supabase | Stays in Cloudflare ecosystem, simpler |
| 2024-XX-XX | SHA256 as ID | Deterministic, enables caching |
| 2024-XX-XX | Sync over async | Reduces complexity for v1 |
| 2024-XX-XX | 3-tier content | Summary → Enhanced → Raw progressive disclosure |
| 2024-XX-XX | Keep hash route | Backward compatibility for existing URLs |
