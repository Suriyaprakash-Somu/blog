-- Migration: Add pillar content and FAQ to blog categories
-- Adds content (text) and faq (jsonb) columns for SEO-rich category pages

ALTER TABLE "blog_categories" 
ADD COLUMN IF NOT EXISTS "content" text,
ADD COLUMN IF NOT EXISTS "faq" jsonb DEFAULT '[]'::jsonb;
