/**
 * Cloudflare Workers API handler for article processing
 *
 * POST /api/article - Create or retrieve article with AI processing
 * GET /api/article/:id - Retrieve existing article by ID
 */

import Anthropic from '@anthropic-ai/sdk';

// Environment interface for D1 database binding and API keys
export interface Env {
  DB: D1Database;
  ANTHROPIC_API_KEY: string;
}

// Request/Response types
interface CreateArticleRequest {
  source_type: 'url' | 'email';
  source_url?: string;
  email_message_id?: string;
  raw_content: string;
  title?: string;
  hn_score?: number;
  hn_comments?: number;
  why_picked?: string;
}

interface ArticleResponse {
  id: string;
  title: string;
  ai_summary: string;
  ai_summary_zh?: string;
  ai_enhanced_content: string;
  raw_content: string;
  language: string;
  reading_time: number;
  status: string;
  created_at: string;
  url: string;
  source_url?: string;
  author?: string;
  hn_score?: number;
  hn_comments?: number;
  why_picked?: string;
}

interface DBArticle {
  id: string;
  source_type: string;
  source_url: string | null;
  email_message_id: string | null;
  raw_content: string;
  ai_summary: string | null;
  ai_summary_zh: string | null;
  ai_enhanced_content: string | null;
  title: string | null;
  author: string | null;
  language: string | null;
  reading_time: number | null;
  status: string;
  created_at: string;
  processed_at: string | null;
  hn_score: number | null;
  hn_comments: number | null;
  why_picked: string | null;
}

/**
 * Generate SHA-256 hash of content
 */
async function hashContent(content: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Process content with AI using Claude API
 */
async function processWithAI(
  rawContent: string,
  providedTitle: string | undefined,
  env: Env
): Promise<{
  title: string;
  author: string | null;
  summary: string;
  summaryZh: string | null;
  enhancedContent: string;
  language: string;
  readingTime: number;
}> {
  try {
    // Initialize Anthropic client
    const anthropic = new Anthropic({
      apiKey: env.ANTHROPIC_API_KEY,
    });

    // Create the prompt for Claude
    const prompt = `Given this article content, produce exactly this format:

TITLE: A clear, descriptive title${providedTitle ? ' (or improve the provided title if needed)' : ''}

AUTHOR: The article author's name (if found in the content, otherwise write "Unknown")

SUMMARY: A structured summary in this format:
**TLDR:** One punchy sentence that captures the core message.

**Key Takeaways:**
- First key insight or finding (1-2 sentences)
- Second key insight or finding (1-2 sentences)
- Third key insight or finding (1-2 sentences)
- Fourth key insight if applicable (1-2 sentences)

SUMMARY_ZH: Traditional Chinese (繁體中文) translation of the SUMMARY above
- Translate BOTH the TLDR line and all Key Takeaways bullet points
- Use natural, fluent Traditional Chinese (繁體中文)
- Maintain the same structure (TLDR + bullet points)
- You MUST include SUMMARY_ZH — never skip it

ENHANCED CONTENT: An improved version (~70-80% of original length) that preserves depth:
- Add section headers (## markdown) at natural topic breaks
- Keep ALL specific examples, data points, quotes, and technical details
- Preserve humor, personality, and the author's voice completely
- Include ALL important statistics, facts, names, and numbers
- Keep the full narrative arc and context - don't summarize key sections
- Only remove: repetitive phrasing, pure filler words, tangential asides
- Goal: readable version that captures BOTH why it's interesting AND all the important details

VISUAL CONTAINER BLOCKS (use these to break up walls of text — aim for 2-4 per article):
- :::callout for important insights, key arguments, or "aha" moments
- :::pullquote for memorable quotes or striking statements from the author
- :::data for statistics clusters, comparisons, or numerical findings

Format each block like this (the title after the marker is required):
:::callout Key Insight
Content of the callout here. Can be multiple lines.
:::

:::pullquote
"The exact quote goes here." — Attribution
:::

:::data Market Statistics
- First data point
- Second data point
- Third data point
:::

INLINE HIGHLIGHTING (apply selectively — 3-5 highlights per paragraph):
- Use ==text== markers for core concepts and key ideas (e.g., ==artificial intelligence==)
- Use ^^text^^ markers for technical terms, people, products (e.g., ^^GPT-5^^, ^^Sam Altman^^)
- Use $$text$$ markers for statistics, numbers, and critical data (e.g., $$94.7%$$, $$1.8 trillion parameters$$)
- Do NOT include these instructions or explanations in your output

${providedTitle ? `Provided title: ${providedTitle}\n\n` : ''}Content:
---
${rawContent}
---

Please respond in the exact format shown above with TITLE:, AUTHOR:, SUMMARY:, SUMMARY_ZH:, and ENHANCED CONTENT: labels.`;

    // Call Claude API with Sonnet for quality summaries and reliable Chinese output
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 12000,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    // Extract text response
    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';

    // Parse the structured response
    const parsed = parseAIResponse(responseText);

    // Detect language
    const language = detectLanguage(rawContent);

    // Estimate reading time from enhanced content
    const wordCount = parsed.enhancedContent.split(/\s+/).length;
    const readingTime = Math.max(1, Math.ceil(wordCount / 200));

    return {
      title: parsed.title,
      author: parsed.author,
      summary: parsed.summary,
      summaryZh: parsed.summaryZh,
      enhancedContent: parsed.enhancedContent,
      language,
      readingTime,
    };
  } catch (error) {
    console.error('AI processing failed, using fallback:', error);

    // Fallback to placeholder logic if AI fails
    return processWithAIFallback(rawContent, providedTitle);
  }
}

/**
 * Parse AI response to extract structured sections
 */
function parseAIResponse(responseText: string): {
  title: string;
  author: string | null;
  summary: string;
  summaryZh: string | null;
  enhancedContent: string;
} {
  // Find TITLE section
  const titleMatch = responseText.match(/TITLE:\s*(.+?)(?=\n\n|AUTHOR:|$)/s);
  const title = titleMatch ? titleMatch[1].trim() : 'Untitled Article';

  // Find AUTHOR section
  const authorMatch = responseText.match(/AUTHOR:\s*(.+?)(?=\n\n|SUMMARY:|$)/s);
  let author: string | null = authorMatch ? authorMatch[1].trim() : null;
  // Normalize "Unknown" to null
  if (author && (author.toLowerCase() === 'unknown' || author === '')) {
    author = null;
  }

  // Find SUMMARY section
  const summaryMatch = responseText.match(/SUMMARY:\s*(.+?)(?=\n+SUMMARY_ZH:|ENHANCED CONTENT:|$)/s);
  const summary = summaryMatch
    ? summaryMatch[1].trim()
    : 'Summary not available.';

  // Find SUMMARY_ZH section
  const summaryZhMatch = responseText.match(/SUMMARY_ZH:\s*(.+?)(?=\n+ENHANCED CONTENT:|$)/s);
  const summaryZh = summaryZhMatch ? summaryZhMatch[1].trim() : null;

  // Find ENHANCED CONTENT section
  const enhancedMatch = responseText.match(/ENHANCED CONTENT:\s*(.+)/s);
  let enhancedContent: string;
  if (enhancedMatch) {
    enhancedContent = enhancedMatch[1].trim();
  } else {
    // Fallback: strip TITLE/AUTHOR/SUMMARY/SUMMARY_ZH sections and use the rest
    // This handles cases where the AI omits the "ENHANCED CONTENT:" label
    const firstHeading = responseText.search(/^##\s/m);
    if (firstHeading > 0) {
      enhancedContent = responseText.slice(firstHeading).trim();
    } else {
      // Last resort: strip all known section labels
      enhancedContent = responseText
        .replace(/^TITLE:.*?(?=\n\n|AUTHOR:)/s, '')
        .replace(/AUTHOR:.*?(?=\n\n|SUMMARY:)/s, '')
        .replace(/SUMMARY:.*?(?=\n+SUMMARY_ZH:|\n+ENHANCED CONTENT:|\n+##)/s, '')
        .replace(/SUMMARY_ZH:.*?(?=\n+ENHANCED CONTENT:|\n+##)/s, '')
        .trim();
    }
  }

  return {
    title,
    author,
    summary,
    summaryZh,
    enhancedContent,
  };
}

/**
 * Fallback processing when AI fails
 */
function processWithAIFallback(rawContent: string, providedTitle?: string): {
  title: string;
  author: string | null;
  summary: string;
  summaryZh: string | null;
  enhancedContent: string;
  language: string;
  readingTime: number;
} {
  // Extract or generate title
  const title = providedTitle || extractTitleFromContent(rawContent);

  // Author not available in fallback
  const author = null;

  // Generate simple summary (first 100 chars + ellipsis)
  const summaryText = rawContent.slice(0, 100).trim();
  const summary = `Summary of: ${summaryText}${rawContent.length > 100 ? '...' : ''}`;

  // No Chinese translation in fallback
  const summaryZh = null;

  // Use raw content as-is for enhanced content (placeholder)
  const enhancedContent = rawContent;

  // Detect language (simple heuristic)
  const language = detectLanguage(rawContent);

  // Estimate reading time (avg 200 words per minute)
  const wordCount = rawContent.split(/\s+/).length;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  return {
    title,
    author,
    summary,
    summaryZh,
    enhancedContent,
    language,
    readingTime,
  };
}

/**
 * Extract title from content (first line or first 50 chars)
 */
function extractTitleFromContent(content: string): string {
  const firstLine = content.split('\n')[0].trim();
  if (firstLine.length > 0 && firstLine.length <= 100) {
    return firstLine;
  }
  // Fallback to first 50 chars
  return content.slice(0, 50).trim() + (content.length > 50 ? '...' : '');
}

/**
 * Simple language detection
 */
function detectLanguage(content: string): string {
  // Check for Chinese characters
  const chineseRegex = /[\u4e00-\u9fff]/;
  if (chineseRegex.test(content)) {
    return 'zh-TW';
  }
  return 'en';
}

/**
 * Format article for response
 */
function formatArticleResponse(article: DBArticle, baseUrl: string): ArticleResponse {
  return {
    id: article.id,
    title: article.title || 'Untitled',
    ai_summary: article.ai_summary || '',
    ai_summary_zh: article.ai_summary_zh || undefined,
    ai_enhanced_content: article.ai_enhanced_content || article.raw_content,
    raw_content: article.raw_content,
    language: article.language || 'en',
    reading_time: article.reading_time || 1,
    status: article.status,
    created_at: article.created_at,
    url: `${baseUrl}/article?id=${article.id}`,
    source_url: article.source_url || undefined,
    author: article.author || undefined,
    hn_score: article.hn_score || undefined,
    hn_comments: article.hn_comments || undefined,
    why_picked: article.why_picked || null,
  };
}

/**
 * POST /api/article
 * Create or retrieve article
 */
async function handlePost(request: Request, env: Env): Promise<Response> {
  try {
    // Parse request body
    const body = await request.json() as CreateArticleRequest;

    // Validate required fields
    if (!body.raw_content) {
      return new Response(
        JSON.stringify({ error: 'raw_content is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!body.source_type || !['url', 'email'].includes(body.source_type)) {
      return new Response(
        JSON.stringify({ error: 'source_type must be "url" or "email"' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Generate ID from content hash
    const id = await hashContent(body.raw_content);

    // Check if article already exists in cache
    const existing = await env.DB.prepare(
      'SELECT * FROM articles WHERE id = ?'
    ).bind(id).first<DBArticle>();

    if (existing && existing.status === 'complete') {
      // Return cached result
      const baseUrl = new URL(request.url).origin;
      return new Response(
        JSON.stringify(formatArticleResponse(existing, baseUrl)),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Process with AI
    const processed = await processWithAI(body.raw_content, body.title, env);

    // Store in database
    const now = new Date().toISOString();

    if (existing) {
      // Update existing record
      await env.DB.prepare(`
        UPDATE articles
        SET title = ?, author = ?, ai_summary = ?, ai_summary_zh = ?, ai_enhanced_content = ?,
            language = ?, reading_time = ?, status = ?, processed_at = ?, hn_score = ?, hn_comments = ?, why_picked = ?
        WHERE id = ?
      `).bind(
        processed.title,
        processed.author,
        processed.summary,
        processed.summaryZh,
        processed.enhancedContent,
        processed.language,
        processed.readingTime,
        'complete',
        now,
        body.hn_score || null,
        body.hn_comments || null,
        body.why_picked || null,
        id
      ).run();
    } else {
      // Insert new record
      await env.DB.prepare(`
        INSERT INTO articles (
          id, source_type, source_url, email_message_id,
          raw_content, ai_summary, ai_summary_zh, ai_enhanced_content,
          title, author, language, reading_time, status, created_at, processed_at, hn_score, hn_comments, why_picked
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        id,
        body.source_type,
        body.source_url || null,
        body.email_message_id || null,
        body.raw_content,
        processed.summary,
        processed.summaryZh,
        processed.enhancedContent,
        processed.title,
        processed.author,
        processed.language,
        processed.readingTime,
        'complete',
        now,
        now,
        body.hn_score || null,
        body.hn_comments || null,
        body.why_picked || null
      ).run();
    }

    // Fetch and return the stored article
    const article = await env.DB.prepare(
      'SELECT * FROM articles WHERE id = ?'
    ).bind(id).first<DBArticle>();

    if (!article) {
      throw new Error('Failed to retrieve article after insert');
    }

    const baseUrl = new URL(request.url).origin;
    return new Response(
      JSON.stringify(formatArticleResponse(article, baseUrl)),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in POST /api/article:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * GET /api/article/:id
 * Retrieve existing article by ID
 */
async function handleGet(request: Request, env: Env): Promise<Response> {
  try {
    // Extract ID from URL
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const id = pathParts[pathParts.length - 1];

    if (!id) {
      return new Response(
        JSON.stringify({ error: 'Article ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Query database
    const article = await env.DB.prepare(
      'SELECT * FROM articles WHERE id = ?'
    ).bind(id).first<DBArticle>();

    if (!article) {
      return new Response(
        JSON.stringify({ error: 'Article not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const baseUrl = url.origin;
    return new Response(
      JSON.stringify(formatArticleResponse(article, baseUrl)),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in GET /api/article/:id:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * Main request handler
 */
export async function onRequest(context: { request: Request; env: Env }): Promise<Response> {
  const { request, env } = context;
  const method = request.method;

  if (method === 'POST') {
    return handlePost(request, env);
  } else if (method === 'GET') {
    return handleGet(request, env);
  } else {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
