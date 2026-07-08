-- Generalize the digest beyond HN. hn-ai-digest now pulls from multiple sources
-- (HN, OpenAI/TechCrunch/Verge/Ars RSS, every.to). Record which source a pick
-- came from so the digest can display it and dedup across all sources by URL
-- (source_url, already stored) rather than by hn_id (HN-only, often null now).
ALTER TABLE articles ADD COLUMN digest_source TEXT;  -- 'hn' | 'openai' | 'techcrunch' | 'theverge' | 'arstechnica' | 'every.to'

CREATE INDEX idx_digest_source ON articles(digest_source);
