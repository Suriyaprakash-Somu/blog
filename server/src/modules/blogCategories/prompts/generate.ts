/**
 * Blog Category Generation Prompt
 *
 * Given a category name, generates:
 *  - slug, description, metaTitle, metaDescription, metaKeywords
 */

import { z } from "zod";
import type { ChatMessage } from "../../settings/llm/completion.js";

/* ------------------------------------------------------------------ */
/*  Output schema (for validation)                                    */
/* ------------------------------------------------------------------ */

export const blogCategoryGeneratedSchema = z.object({
  slug: z.string(),
  description: z.string(),
  metaTitle: z.string(),
  metaDescription: z.string(),
  metaKeywords: z.string(),
});

export type BlogCategoryGenerated = z.infer<typeof blogCategoryGeneratedSchema>;

/* ------------------------------------------------------------------ */
/*  Prompt builder                                                    */
/* ------------------------------------------------------------------ */

export const DEFAULT_BLOG_CATEGORY_SYSTEM_PROMPT = `You are an expert SEO content strategist for an Indian blog platform targeting readers in India.
Given a blog category name, generate high-quality metadata optimized for Indian audiences and search trends.

Rules:
- slug: URL-friendly, lowercase, hyphenated, no special characters (e.g. "tech-news-india")
- description: 2-3 engaging sentences describing what this category covers, written for an Indian audience. Use natural, relatable phrasing.
- metaTitle: SEO-optimized for Indian search queries, under 60 characters, includes the category concept
- metaDescription: compelling, under 160 characters, uses keywords that Indian users commonly search for
- metaKeywords: 5-8 relevant comma-separated keywords targeting Indian search trends and local terminology

Respond ONLY with valid JSON matching this exact schema:
{
  "slug": "string",
  "description": "string",
  "metaTitle": "string",
  "metaDescription": "string",
  "metaKeywords": "string"
}`;

export function buildBlogCategoryPrompt(categoryName: string, customSystemPrompt?: string | null): ChatMessage[] {
  return [
    { role: "system", content: customSystemPrompt ? customSystemPrompt : DEFAULT_BLOG_CATEGORY_SYSTEM_PROMPT },
    {
      role: "user",
      content: `Generate blog category metadata for: "${categoryName}"`,
    },
  ];
}
