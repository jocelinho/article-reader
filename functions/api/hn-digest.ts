/**
 * Cloudflare Workers API handler for HN digest selection state.
 *
 * This is the source of truth that lets hn-ai-digest run statelessly across
 * machines — no local SQLite, no iCloud sync. It exposes the "which HN stories
 * were picked, and when" dimension of the articles table.
 *
 * GET /api/hn-digest?date=YYYY-MM-DD   → that day's picks (for "today's cache")
 * GET /api/hn-digest?since=YYYY-MM-DD  → all picks on/after the date (for cross-day dedup)
 *
 * Exactly one of `date` or `since` is required.
 */

export interface Env {
  DB: D1Database;
}

interface DigestRow {
  hn_id: number;
  hn_url: string | null;
  digest_date: string;
  digest_rank: number | null;
  excitement_score: number | null;
  digest_source: string | null;
  source_url: string | null;
  id: string;
  title: string | null;
  ai_summary: string | null;
  ai_summary_zh: string | null;
  reading_time: number | null;
  score_hn: number | null;
  comments_hn: number | null;
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

async function handleGet(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const date = url.searchParams.get('date');
  const since = url.searchParams.get('since');

  if (!date && !since) {
    return json({ error: 'provide ?date=YYYY-MM-DD or ?since=YYYY-MM-DD' }, 400);
  }
  const param = (date ?? since)!;
  if (!DATE_RE.test(param)) {
    return json({ error: 'date must be YYYY-MM-DD' }, 400);
  }

  const op = date ? '=' : '>=';
  const rows = await env.DB.prepare(`
    SELECT hn_id, hn_url, digest_date, digest_rank, excitement_score, digest_source, source_url,
           id, title, ai_summary, ai_summary_zh, reading_time,
           hn_score AS score_hn, hn_comments AS comments_hn
    FROM articles
    WHERE digest_date IS NOT NULL AND digest_date ${op} ?
    ORDER BY digest_date DESC, digest_rank ASC
  `).bind(param).all<DigestRow>();

  const baseUrl = url.origin;
  const items = (rows.results ?? []).map(r => ({
    hn_id: r.hn_id,
    hn_url: r.hn_url,
    digest_date: r.digest_date,
    rank: r.digest_rank,
    excitement_score: r.excitement_score,
    digest_source: r.digest_source ?? undefined,
    source_url: r.source_url ?? undefined,
    title: r.title,
    ai_summary: r.ai_summary,
    ai_summary_zh: r.ai_summary_zh ?? undefined,
    reading_time: r.reading_time,
    score: r.score_hn,
    comments: r.comments_hn,
    article_reader_id: r.id,
    article_reader_url: `${baseUrl}/article?id=${r.id}`,
  }));

  return json({ items });
}

export async function onRequest(context: { request: Request; env: Env }): Promise<Response> {
  const { request, env } = context;
  if (request.method !== 'GET') {
    return json({ error: 'Method not allowed' }, 405);
  }
  return handleGet(request, env);
}
