-- Initial schema for article-reader
-- Creates articles table with full content storage and AI enhancements

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
CREATE INDEX idx_created_at ON articles(created_at);
