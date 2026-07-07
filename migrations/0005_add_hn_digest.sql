-- Add HN digest selection dimension to articles.
-- Lets hn-ai-digest do "today's cache" + "cross-day dedup" straight off D1,
-- replacing the old local SQLite (processed-articles.db) + iCloud sync.
ALTER TABLE articles ADD COLUMN hn_id INTEGER;
ALTER TABLE articles ADD COLUMN hn_url TEXT;
ALTER TABLE articles ADD COLUMN digest_date TEXT;        -- YYYY-MM-DD the story was picked into the digest
ALTER TABLE articles ADD COLUMN digest_rank INTEGER;     -- 1..N position within that day's picks
ALTER TABLE articles ADD COLUMN excitement_score REAL;

-- Dedup lookups by HN story, and per-day cache lookups
CREATE INDEX idx_hn_id ON articles(hn_id);
CREATE INDEX idx_digest_date ON articles(digest_date);
