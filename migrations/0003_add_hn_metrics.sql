-- Add HN metrics to articles table
ALTER TABLE articles ADD COLUMN hn_score INTEGER;
ALTER TABLE articles ADD COLUMN hn_comments INTEGER;
