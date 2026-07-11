import { onRequest as articleHandler, type Env as ArticleEnv } from './functions/api/article';
import { onRequest as articleByIdHandler } from './functions/api/article/[id]';
import { onRequest as digestHandler } from './functions/api/hn-digest';
import { renderHomepage, renderNewsPage, renderRobots, renderSitemap, serveArticleWithMeta } from './homepage';

interface Env extends ArticleEnv {
  ASSETS: Fetcher;
}

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};

function withCors(response: Response): Response {
  const result = new Response(response.body, response);
  for (const [key, value] of Object.entries(CORS_HEADERS)) {
    result.headers.set(key, value);
  }
  return result;
}

function jsonError(status: number, message: string): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.hostname === 'article.jocelinho.com') {
      url.hostname = 'tech-news.jocelinho.com';
      return Response.redirect(url.toString(), 308);
    }

    if (request.method === 'GET' && url.pathname === '/') {
      return renderHomepage(env.DB);
    }
    if (request.method === 'GET' && url.pathname === '/sitemap.xml') {
      return renderSitemap(env.DB);
    }
    if (request.method === 'GET' && url.pathname === '/robots.txt') {
      return renderRobots();
    }
    if (request.method === 'GET' && url.pathname === '/api/news-page') {
      const page = Number(url.searchParams.get('page') || '1');
      return renderNewsPage(env.DB, Number.isFinite(page) ? page : 1);
    }
    if (request.method === 'GET' && (url.pathname === '/article' || url.pathname === '/article/')) {
      return serveArticleWithMeta(request, env.DB, env.ASSETS);
    }
    if (!url.pathname.startsWith('/api/')) {
      return env.ASSETS.fetch(request);
    }

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    try {
      let response: Response;

      if (url.pathname === '/api/article' || url.pathname === '/api/article/') {
        response = await articleHandler({ request, env });
      } else if (url.pathname.startsWith('/api/article/')) {
        const id = decodeURIComponent(url.pathname.slice('/api/article/'.length));
        response = await articleByIdHandler({ request, env, params: { id } });
      } else if (url.pathname === '/api/hn-digest') {
        response = await digestHandler({ request, env });
      } else {
        return jsonError(404, 'Not found');
      }

      return withCors(response);
    } catch (error) {
      console.error('Unhandled API error:', error);
      return jsonError(500, error instanceof Error ? error.message : 'Internal server error');
    }
  },
};
