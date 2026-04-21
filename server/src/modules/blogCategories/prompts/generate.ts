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
  slug: z.string().catch(""),
  description: z.string().catch(""),
  metaTitle: z.string().catch(""),
  metaDescription: z.string().catch(""),
  metaKeywords: z.string().catch(""),
  content: z.string().catch(""),
  faq: z.array(z.object({
    question: z.string(),
    answer: z.string(),
  })).catch([]).default([]),
});

export type BlogCategoryGenerated = z.infer<typeof blogCategoryGeneratedSchema>;

/* ------------------------------------------------------------------ */
/*  Prompt builder                                                    */
/* ------------------------------------------------------------------ */

export const DEFAULT_BLOG_CATEGORY_SYSTEM_PROMPT = `You are an expert SEO content strategist for an Indian blog platform targeting readers in India.

Given a blog category name, generate THREE things:
1. High-quality metadata optimized for Indian audiences and search trends
2. Pillar content — a brief, evergreen overview (100-300 words in Markdown) that establishes topical authority for this category
3. FAQ — 5-8 frequently asked questions with concise, authoritative answers targeting Indian search queries

A category represents a broad topic area that groups related posts. The category page already lists related blog posts that cover depth, so the pillar content should summarize, not repeat.

## METADATA RULES
- slug: URL-friendly, lowercase, hyphenated, no special characters (e.g. "tech-news-india")
- description: 2-3 engaging sentences describing what this category covers, written for an Indian audience. Use natural, relatable phrasing.
- metaTitle: SEO-optimized for Indian search queries, under 60 characters, includes the category concept
- metaDescription: compelling, under 160 characters, uses keywords that Indian users commonly search for
- metaKeywords: 5-8 relevant comma-separated keywords targeting Indian search trends and local terminology

## PILLAR CONTENT RULES
- Write in Markdown format (stored as raw Markdown)
- 100-300 words only — concise and evergreen
- Structure with 1-2 ## headings max
- Write for an Indian audience — use Indian context, examples, terminology
- Cover: what this category encompasses, why it matters in India, key takeaways
- Do NOT include an H1 heading — the page already has one
- Start directly with a ## heading
- Be substantive but brief — related blog posts handle depth
- Use bullet points for key takeaways when appropriate

## FAQ RULES
- 5-8 questions that Indian users would actually search for (think People Also Ask)
- Answers should be 2-3 sentences, direct and authoritative
- Questions should use natural search phrasing (e.g. "What is X in India?", "How to X for beginners?")
- Reference Indian context where relevant (regulations, schemes, market data, cultural context)

Respond ONLY with valid JSON matching this exact schema:
{
  "slug": "string",
  "description": "string",
  "metaTitle": "string",
  "metaDescription": "string",
  "metaKeywords": "string",
  "content": "string (Markdown)",
  "faq": [
    { "question": "string", "answer": "string" }
  ]
}`;

export const DEFAULT_BLOG_CATEGORY_USER_TEMPLATE = `Generate comprehensive blog category metadata, pillar content, and FAQ for: "{{title}}". {{additionalInstructions}}`;

export function buildBlogCategoryPrompt(
  categoryName: string,
  customSystemPrompt?: string | null,
  customUserTemplate?: string | null,
  additionalInstructions?: string | null
): ChatMessage[] {
  const systemPrompt = customSystemPrompt ?? DEFAULT_BLOG_CATEGORY_SYSTEM_PROMPT;
  const userTemplate = customUserTemplate ?? DEFAULT_BLOG_CATEGORY_USER_TEMPLATE;
  
  let userContent = userTemplate
    .replace(/{{name}}/g, categoryName)
    .replace(/{{title}}/g, categoryName);
  
  if (additionalInstructions) {
    userContent = userContent.replace(/{{additionalInstructions}}/g, additionalInstructions);
  } else {
    userContent = userContent.replace(" {{additionalInstructions}}", "").replace("{{additionalInstructions}}", "");
  }

  console.log(`[PROMPT] Blog Category - System: ${systemPrompt.slice(0, 80)}...`);
  console.log(`[PROMPT] Blog Category - User: ${userContent}`);

  return [
    { role: "system", content: systemPrompt },
    { role: "user", content: userContent.trim() },
  ];
}
