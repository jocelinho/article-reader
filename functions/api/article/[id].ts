/**
 * Cloudflare Pages Function for GET /api/article/:id
 * Retrieves an existing article by ID
 */

import type { Env } from '../article';

interface DBArticle {
  id: string;
  source_type: string;
  source_url: string | null;
  email_message_id: string | null;
  raw_content: string;
  ai_summary: string | null;
  ai_enhanced_content: string | null;
  title: string | null;
  language: string | null;
  reading_time: number | null;
  status: string;
  created_at: string;
  processed_at: string | null;
}

interface ArticleResponse {
  id: string;
  title: string;
  ai_summary: string;
  ai_enhanced_content: string;
  raw_content: string;
  language: string;
  reading_time: number;
  status: string;
  created_at: string;
  url: string;
  source_url?: string;
  author?: string;
}

function formatArticleResponse(article: DBArticle, baseUrl: string): ArticleResponse {
  return {
    id: article.id,
    title: article.title || 'Untitled',
    ai_summary: article.ai_summary || '',
    ai_enhanced_content: article.ai_enhanced_content || article.raw_content,
    raw_content: article.raw_content,
    language: article.language || 'en',
    reading_time: article.reading_time || 1,
    status: article.status,
    created_at: article.created_at,
    url: `${baseUrl}/article?id=${article.id}`,
    source_url: article.source_url || undefined,
  };
}

/**
 * GET /api/article/:id
 */
export async function onRequest(context: {
  request: Request;
  env: Env;
  params: { id: string };
}): Promise<Response> {
  try {
    const { request, env, params } = context;
    const id = params.id;

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

    const baseUrl = new URL(request.url).origin;
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
