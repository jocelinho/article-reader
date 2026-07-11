interface NewsItem {
  id: string;
  title: string | null;
  ai_summary: string | null;
  ai_summary_zh: string | null;
  reading_time: number | null;
  source_url: string | null;
  digest_source: string | null;
  digest_date: string;
  digest_rank: number | null;
}

interface ArticleMeta {
  id: string;
  title: string | null;
  ai_summary: string | null;
  ai_summary_zh: string | null;
  source_url: string | null;
  digest_date: string | null;
}

const SITE_ORIGIN = 'https://tech-news.jocelinho.com';
const SITE_NAME = 'Jocelin 的每日新聞';
const DAYS_PER_PAGE = 5;

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function sourceName(item: NewsItem): string {
  const names: Record<string, string> = {
    hn: 'Hacker News',
    openai: 'OpenAI',
    techcrunch: 'TechCrunch',
    theverge: 'The Verge',
    arstechnica: 'Ars Technica',
    'every.to': 'Every',
  };
  if (item.digest_source && names[item.digest_source]) return names[item.digest_source];
  if (!item.source_url) return 'Daily Read';
  try {
    return new URL(item.source_url).hostname.replace(/^www\./, '');
  } catch {
    return 'Daily Read';
  }
}

function dateLabel(date: string): { weekday: string; full: string } {
  const value = new Date(`${date}T12:00:00+08:00`);
  return {
    weekday: new Intl.DateTimeFormat('zh-TW', { weekday: 'long', timeZone: 'Asia/Taipei' }).format(value),
    full: new Intl.DateTimeFormat('zh-TW', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'Asia/Taipei',
    }).format(value),
  };
}

function summary(item: NewsItem): string {
  const text = item.ai_summary_zh || item.ai_summary || '';
  return text
    .replace(/^\*\*TLDR[：:]\*\*\s*/i, '')
    .split(/\n\n|\*\*重點摘要|\*\*Key Takeaways/i)[0]
    .replace(/\*\*/g, '')
    .trim();
}

function renderCard(item: NewsItem, featured = false): string {
  const articleUrl = `/article?id=${encodeURIComponent(item.id)}`;
  const itemSummary = summary(item);
  const isEvergreen = item.digest_rank === 0 || item.digest_source === 'every.to';
  return `
    <article class="story${featured ? ' story--featured' : ''}${isEvergreen ? ' story--evergreen' : ''}">
      <a class="story__link" href="${articleUrl}">
        <div class="story__meta">
          <span>${escapeHtml(isEvergreen ? '深度精選' : sourceName(item))}</span>
          ${item.reading_time ? `<span>${item.reading_time} 分鐘閱讀</span>` : ''}
        </div>
        <h3>${escapeHtml(item.title || 'Untitled')}</h3>
        ${itemSummary ? `<p>${escapeHtml(itemSummary)}</p>` : ''}
        <span class="story__cta">閱讀全文 <span aria-hidden="true">↗</span></span>
      </a>
    </article>`;
}

async function getNewsPage(db: D1Database, page: number): Promise<{
  items: NewsItem[];
  dates: string[];
  hasMore: boolean;
}> {
  const safePage = Math.max(1, Math.floor(page));
  const offset = (safePage - 1) * DAYS_PER_PAGE;
  const dateQuery = await db.prepare(`
    SELECT DISTINCT digest_date
    FROM articles
    WHERE digest_date IS NOT NULL
    ORDER BY digest_date DESC
    LIMIT ? OFFSET ?
  `).bind(DAYS_PER_PAGE + 1, offset).all<{ digest_date: string }>();
  const fetchedDates = (dateQuery.results ?? []).map(row => row.digest_date);
  const dates = fetchedDates.slice(0, DAYS_PER_PAGE);
  if (dates.length === 0) return { items: [], dates: [], hasMore: false };

  const placeholders = dates.map(() => '?').join(',');
  const itemQuery = await db.prepare(`
    SELECT id, title, ai_summary, ai_summary_zh, reading_time, source_url,
           digest_source, digest_date, digest_rank
    FROM articles
    WHERE digest_date IN (${placeholders})
    ORDER BY digest_date DESC,
             CASE WHEN digest_rank = 0 THEN 999 ELSE digest_rank END ASC
  `).bind(...dates).all<NewsItem>();
  return { items: itemQuery.results ?? [], dates, hasMore: fetchedDates.length > DAYS_PER_PAGE };
}

function groupByDate(items: NewsItem[]): Map<string, NewsItem[]> {
  const byDate = new Map<string, NewsItem[]>();
  for (const item of items) {
    const group = byDate.get(item.digest_date) ?? [];
    group.push(item);
    byDate.set(item.digest_date, group);
  }
  return byDate;
}

function renderEditions(items: NewsItem[], dates: string[], firstPage: boolean): string {
  const byDate = groupByDate(items);
  return dates.map((date, dateIndex) => {
    const label = dateLabel(date);
    const stories = byDate.get(date) ?? [];
    return `
      <section class="edition" id="date-${date}">
        <header class="edition__header">
          <div>
            <p class="edition__weekday">${escapeHtml(label.weekday)}</p>
            <h2>${escapeHtml(label.full)}</h2>
          </div>
          <span>${stories.length} 篇精選</span>
        </header>
        <div class="story-grid">
          ${stories.map((item, index) => renderCard(item, firstPage && dateIndex === 0 && index === 0)).join('')}
        </div>
      </section>`;
  }).join('');
}

export async function renderNewsPage(db: D1Database, page: number): Promise<Response> {
  const result = await getNewsPage(db, page);
  return new Response(JSON.stringify({
    html: renderEditions(result.items, result.dates, false),
    hasMore: result.hasMore,
    nextPage: result.hasMore ? page + 1 : null,
  }), {
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'public, max-age=300, s-maxage=300' },
  });
}

export async function renderHomepage(db: D1Database): Promise<Response> {
  const firstPage = await getNewsPage(db, 1);
  const items = firstPage.items;
  const dates = firstPage.dates;
  const latestDate = dates[0];
  const latestLabel = latestDate ? dateLabel(latestDate) : null;
  const sections = renderEditions(items, dates, true);

  const itemList = items.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    url: `${SITE_ORIGIN}/article?id=${item.id}`,
    name: item.title || 'Untitled',
  }));

  const html = `<!doctype html>
<html lang="zh-Hant">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <link rel="icon" href="/favicon.ico" sizes="32x32">
  <link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png">
  <link rel="apple-touch-icon" href="/apple-touch-icon.png">
  <title>${SITE_NAME}｜AI 與科技新聞精選</title>
  <meta name="description" content="Jocelin 每日精選的 AI、科技與產品新聞，包含繁體中文摘要與深度閱讀。">
  <link rel="canonical" href="${SITE_ORIGIN}/">
  <meta property="og:type" content="website">
  <meta property="og:locale" content="zh_TW">
  <meta property="og:title" content="${SITE_NAME}">
  <meta property="og:description" content="每天值得讀的 AI、科技與產品新聞。">
  <meta property="og:url" content="${SITE_ORIGIN}/">
  <meta name="twitter:card" content="summary">
  <script type="application/ld+json">${JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: SITE_NAME,
    itemListElement: itemList,
  }).replaceAll('<', '\\u003c')}</script>
  <style>
    :root { color-scheme: light; --ink:#17211b; --muted:#647068; --paper:#f7f6f0; --card:#fffef9; --line:#dcded5; --accent:#cf5c36; --green:#234c39; --hover:hsl(155 45% 35%); }
    * { box-sizing:border-box; }
    html { scroll-behavior:smooth; }
    body { margin:0; color:var(--ink); background:var(--paper); font-family:"Noto Sans TC","PingFang TC","Microsoft JhengHei",system-ui,sans-serif; }
    a { color:inherit; }
    .masthead { border-bottom:1px solid var(--line); background:rgba(247,246,240,.94); }
    .masthead__inner { max-width:1120px; margin:auto; padding:18px 24px; display:flex; align-items:center; justify-content:space-between; gap:24px; }
    .brand { font-family:Georgia,"Noto Serif TC",serif; font-size:18px; font-weight:700; text-decoration:none; letter-spacing:.02em; }
    .masthead nav { display:flex; gap:20px; font-size:13px; color:var(--muted); }
    .masthead nav a { text-decoration:none; }
    .hero { max-width:1120px; margin:auto; padding:78px 24px 58px; display:grid; grid-template-columns:minmax(0,1.4fr) minmax(240px,.6fr); gap:56px; align-items:end; }
    .eyebrow { margin:0 0 18px; color:var(--accent); font-size:12px; font-weight:800; letter-spacing:.16em; text-transform:uppercase; }
    h1 { margin:0; max-width:780px; font-family:Georgia,"Noto Serif TC",serif; font-size:clamp(42px,7vw,86px); line-height:.98; letter-spacing:-.045em; }
    .hero__aside { border-left:2px solid var(--ink); padding-left:22px; }
    .hero__aside p { margin:0 0 14px; color:var(--muted); line-height:1.75; }
    .hero__aside strong { color:var(--ink); }
    main { max-width:1120px; margin:auto; padding:0 24px 96px; }
    .edition { padding-top:58px; }
    .edition__header { border-top:3px solid var(--ink); border-bottom:1px solid var(--line); padding:18px 0 16px; display:flex; justify-content:space-between; align-items:end; gap:20px; }
    .edition__weekday { margin:0 0 5px; color:var(--accent); font-size:12px; font-weight:800; letter-spacing:.12em; }
    .edition h2 { margin:0; font-family:Georgia,"Noto Serif TC",serif; font-size:28px; }
    .edition__header > span { color:var(--muted); font-size:13px; }
    .story-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); }
    .story { min-width:0; border-bottom:1px solid var(--line); }
    .story:nth-child(odd) { border-right:1px solid var(--line); }
    .story__link { min-height:100%; padding:30px 30px 32px 0; display:flex; flex-direction:column; text-decoration:none; transition:background .2s ease, transform .2s ease; }
    .story:nth-child(even) .story__link { padding-left:30px; padding-right:0; }
    .story__link:hover h3 { color:var(--hover); }
    .story__meta { display:flex; gap:12px; color:var(--muted); font-size:11px; font-weight:700; letter-spacing:.08em; text-transform:uppercase; }
    .story h3 { margin:14px 0 12px; font-family:Georgia,"Noto Serif TC",serif; font-size:25px; line-height:1.28; transition:color .2s ease; }
    .story p { margin:0 0 24px; color:var(--muted); font-size:15px; line-height:1.78; }
    .story__cta { margin-top:auto; color:var(--green); font-size:13px; font-weight:800; }
    .story--featured { grid-column:1 / -1; border-right:0 !important; }
    .story--featured .story__link { padding:38px 0; }
    .story--featured h3 { max-width:900px; font-size:clamp(32px,5vw,56px); line-height:1.12; }
    .story--featured p { max-width:760px; font-size:17px; }
    .story--evergreen { background:linear-gradient(90deg,rgba(207,92,54,.06),transparent); }
    .pagination { padding:52px 0 0; display:flex; justify-content:center; }
    .load-more { min-width:220px; border:1px solid var(--ink); border-radius:999px; padding:14px 24px; color:var(--ink); background:transparent; font:700 14px/1 inherit; cursor:pointer; transition:color .2s ease,background .2s ease; }
    .load-more:hover { color:var(--paper); background:var(--ink); }
    .load-more:disabled { opacity:.55; cursor:wait; }
    footer { border-top:1px solid var(--line); color:var(--muted); font-size:12px; }
    footer div { max-width:1120px; margin:auto; padding:28px 24px; display:flex; justify-content:space-between; gap:20px; }
    @media (max-width:720px) {
      .masthead nav { display:none; }
      .hero { grid-template-columns:1fr; gap:34px; padding-top:54px; }
      h1 { font-size:48px; }
      .story-grid { grid-template-columns:1fr; }
      .story, .story:nth-child(odd) { border-right:0; }
      .story__link, .story:nth-child(even) .story__link { padding:26px 0; }
      .story--featured h3 { font-size:34px; }
      .edition__header { align-items:start; }
      footer div { flex-direction:column; }
    }
  </style>
</head>
<body>
  <header class="masthead">
    <div class="masthead__inner">
      <a class="brand" href="/">Jocelin's Daily Read</a>
      <nav aria-label="日期目錄">
        ${dates.slice(0, 4).map(date => `<a href="#date-${date}">${date.slice(5).replace('-', '/')}</a>`).join('')}
      </nav>
    </div>
  </header>
  <section class="hero">
    <div>
      <p class="eyebrow">AI · Technology · Product</p>
      <h1>每天，讀真正<br>值得讀的新聞。</h1>
    </div>
    <div class="hero__aside">
      <p><strong>${latestLabel ? `${escapeHtml(latestLabel.full)}更新` : '每日更新'}</strong></p>
      <p>從科技與 AI 世界的噪音中，挑出值得花時間理解的訊號。附繁體中文摘要，保留原文脈絡。</p>
    </div>
  </section>
  <main>
    <div id="news-index">${sections || '<p>今日新聞準備中。</p>'}</div>
    <div class="pagination" id="pagination"${firstPage.hasMore ? '' : ' hidden'}>
      <button class="load-more" id="load-more" type="button" data-page="2">載入更多日期</button>
    </div>
  </main>
  <footer><div><span>© ${new Date().getFullYear()} Jocelin Ho</span><span>Curated daily in Taipei · Powered by ArticleReader</span></div></footer>
  <script>
    (() => {
      const button = document.getElementById('load-more');
      const pagination = document.getElementById('pagination');
      const index = document.getElementById('news-index');
      if (!button || !pagination || !index) return;
      button.addEventListener('click', async () => {
        const page = Number(button.dataset.page || '2');
        button.disabled = true;
        button.textContent = '載入中…';
        try {
          const response = await fetch('/api/news-page?page=' + page);
          if (!response.ok) throw new Error('Unable to load more news');
          const data = await response.json();
          index.insertAdjacentHTML('beforeend', data.html);
          if (data.hasMore && data.nextPage) {
            button.dataset.page = String(data.nextPage);
            button.disabled = false;
            button.textContent = '載入更多日期';
          } else {
            pagination.hidden = true;
          }
        } catch {
          button.disabled = false;
          button.textContent = '重試載入';
        }
      });
    })();
  </script>
</body>
</html>`;

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=300, s-maxage=300',
    },
  });
}

export async function renderSitemap(db: D1Database): Promise<Response> {
  const query = await db.prepare(`
    SELECT id, MAX(digest_date) AS digest_date
    FROM articles
    WHERE digest_date IS NOT NULL
    GROUP BY id
    ORDER BY digest_date DESC
    LIMIT 5000
  `).all<{ id: string; digest_date: string }>();
  const urls = (query.results ?? []).map(item =>
    `<url><loc>${SITE_ORIGIN}/article?id=${encodeURIComponent(item.id)}</loc><lastmod>${item.digest_date}</lastmod></url>`
  ).join('');
  const xml = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${SITE_ORIGIN}/</loc><changefreq>daily</changefreq><priority>1.0</priority></url>${urls}</urlset>`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=3600' } });
}

export function renderRobots(): Response {
  return new Response(`User-agent: *\nAllow: /\nSitemap: ${SITE_ORIGIN}/sitemap.xml\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=86400' },
  });
}

export async function serveArticleWithMeta(request: Request, db: D1Database, assets: Fetcher): Promise<Response> {
  const id = new URL(request.url).searchParams.get('id');
  if (!id) return assets.fetch(request);
  const article = await db.prepare(`
    SELECT id, title, ai_summary, ai_summary_zh, source_url, digest_date
    FROM articles WHERE id = ?
  `).bind(id).first<ArticleMeta>();
  const assetResponse = await assets.fetch(request);
  if (!article || !assetResponse.ok) return assetResponse;

  const pageTitle = `${article.title || 'Article'}｜Jocelin 的每日新聞`;
  const description = (article.ai_summary_zh || article.ai_summary || '').replace(/\*\*/g, '').slice(0, 180);
  const canonical = `${SITE_ORIGIN}/article?id=${encodeURIComponent(id)}`;
  const meta = `<title>${escapeHtml(pageTitle)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <link rel="canonical" href="${canonical}">
  <meta property="og:type" content="article">
  <meta property="og:locale" content="zh_TW">
  <meta property="og:title" content="${escapeHtml(article.title || 'Article')}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:url" content="${canonical}">`;
  const html = (await assetResponse.text())
    .replace(/<title>.*?<\/title>/, '')
    .replace(/<meta name="description"[^>]*>/, '')
    .replace('</head>', `${meta}</head>`);
  const headers = new Headers(assetResponse.headers);
  headers.set('Content-Type', 'text/html; charset=utf-8');
  headers.set('Cache-Control', 'public, max-age=300, s-maxage=300');
  return new Response(html, { status: assetResponse.status, headers });
}
