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

SUMMARY: One paragraph (3-5 sentences) that captures:
- The main topic/argument
- Key insights or findings
- Why it matters

SUMMARY_ZH: Traditional Chinese (繁體中文) translation of the SUMMARY above
- Use natural, fluent Traditional Chinese
- Maintain the same meaning and tone
- Keep it concise (3-5 sentences)

ENHANCED CONTENT: An improved version (~70-80% of original length) that preserves depth:
- Add section headers (## markdown) at natural topic breaks
- Keep ALL specific examples, data points, quotes, and technical details
- Preserve humor, personality, and the author's voice completely
- Include ALL important statistics, facts, names, and numbers
- Keep the full narrative arc and context - don't summarize key sections
- Only remove: repetitive phrasing, pure filler words, tangential asides
- Goal: readable version that captures BOTH why it's interesting AND all the important details

SEMANTIC HIGHLIGHTING: Use these markers thoughtfully and sparingly (max 2-3 per paragraph):

DARK BLUE ==text== - Core concepts and key ideas only:
- Main topics and central themes (e.g., ==artificial intelligence==, ==climate change==)
- Important technical concepts (e.g., ==neural networks==, ==blockchain==)
- Framework/paradigm names (e.g., ==Mixture of Experts==)

MEDIUM BLUE ^^text^^ - Technical specifics and people:
- Specific technologies, APIs, tools (e.g., ^^GPT-5^^, ^^TensorFlow^^, ^^React^^)
- People names (e.g., ^^Sam Altman^^, ^^Sarah Chen^^)
- Organizations and products (e.g., ^^OpenAI^^, ^^Google^^)

SOFT PINK $$text$$ - Data points and emphasis:
- Statistics and percentages (e.g., $$94.7%$$, $$47% improvement$$)
- Significant numbers (e.g., $$1.8 trillion parameters$$)
- Important quotes or critical statements

Rules:
- Use sparingly - only highlight truly important terms
- Don't highlight common words or every technical term
- Maximum 2-3 highlights per paragraph
- Prioritize readability over decoration

${providedTitle ? `Provided title: ${providedTitle}\n\n` : ''}Content:
---
${rawContent}
---

Please respond in the exact format shown above with TITLE:, AUTHOR:, SUMMARY:, and ENHANCED CONTENT: labels.`;

    // Call Claude API with Haiku for speed and cost efficiency
    const message = await anthropic.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 8192,
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
  const summaryMatch = responseText.match(/SUMMARY:\s*(.+?)(?=\n\nSUMMARY_ZH:|ENHANCED CONTENT:|$)/s);
  const summary = summaryMatch
    ? summaryMatch[1].trim()
    : 'Summary not available.';

  // Find SUMMARY_ZH section
  const summaryZhMatch = responseText.match(/SUMMARY_ZH:\s*(.+?)(?=\n\nENHANCED CONTENT:|$)/s);
  const summaryZh = summaryZhMatch ? summaryZhMatch[1].trim() : null;

  // Find ENHANCED CONTENT section
  const enhancedMatch = responseText.match(/ENHANCED CONTENT:\s*(.+)/s);
  const enhancedContent = enhancedMatch
    ? enhancedMatch[1].trim()
    : responseText; // Fallback to full response if parsing fails

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
            language = ?, reading_time = ?, status = ?, processed_at = ?, hn_score = ?, hn_comments = ?
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
        id
      ).run();
    } else {
      // Insert new record
      await env.DB.prepare(`
        INSERT INTO articles (
          id, source_type, source_url, email_message_id,
          raw_content, ai_summary, ai_summary_zh, ai_enhanced_content,
          title, author, language, reading_time, status, created_at, processed_at, hn_score, hn_comments
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
        body.hn_comments || null
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
