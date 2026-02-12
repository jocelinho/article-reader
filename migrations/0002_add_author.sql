-- Add author field to articles table
ALTER TABLE articles ADD COLUMN author TEXT;

-- Index for author lookups
CREATE INDEX idx_author ON articles(author);
