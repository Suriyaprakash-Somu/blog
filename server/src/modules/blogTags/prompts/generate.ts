/**
 * Blog Tag Generation Prompt
 *
 * Given a tag name, generates:
 *  - slug, description, metaTitle, metaDescription, metaKeywords
 */

import { z } from "zod";
import type { ChatMessage } from "../../settings/llm/completion.js";

/* ------------------------------------------------------------------ */
/*  Output schema (for validation)                                    */
/* ------------------------------------------------------------------ */

export const blogTagGeneratedSchema = z.object({
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

export type BlogTagGenerated = z.infer<typeof blogTagGeneratedSchema>;

/* ------------------------------------------------------------------ */
/*  Prompt builder                                                    */
/* ------------------------------------------------------------------ */

export const DEFAULT_BLOG_TAG_SYSTEM_PROMPT = `You are an expert SEO content strategist for an Indian blog platform targeting readers in India.

Given a blog tag name, generate THREE things:
1. High-quality metadata optimized for Indian audiences and search trends
2. Pillar content — a brief, evergreen overview (100-300 words in Markdown) that establishes topical authority for this tag
3. FAQ — 5-8 frequently asked questions with concise, authoritative answers targeting Indian search queries

A tag is more specific and granular than a category — it represents a focused topic or keyword that readers might search for. The tag page already lists related blog posts that cover depth, so the pillar content should summarize, not repeat.

## METADATA RULES
- slug: URL-friendly, lowercase, hyphenated, no special characters (e.g. "react-hooks")
- description: 1-2 concise sentences describing what this tag covers, written for an Indian audience
- metaTitle: SEO-optimized for Indian search queries, under 60 characters, includes the tag concept
- metaDescription: compelling, under 160 characters, uses keywords that Indian users commonly search for
- metaKeywords: 5-8 relevant comma-separated keywords targeting Indian search trends

## PILLAR CONTENT RULES
- Write in Markdown format (stored as raw Markdown)
- 100-300 words only — concise and evergreen
- Structure with 1-2 ## headings max
- Write for an Indian audience — use Indian context, examples, terminology
- Cover: what it is, why it matters in India, key takeaways
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

export const DEFAULT_BLOG_TAG_USER_TEMPLATE = `Generate comprehensive blog tag metadata, pillar content, and FAQ for: "{{title}}". {{additionalInstructions}}`;

export function buildBlogTagPrompt(
  tagName: string,
  customSystemPrompt?: string | null,
  customUserTemplate?: string | null,
  additionalInstructions?: string | null
): ChatMessage[] {
  const systemPrompt = customSystemPrompt ?? DEFAULT_BLOG_TAG_SYSTEM_PROMPT;
  const userTemplate = customUserTemplate ?? DEFAULT_BLOG_TAG_USER_TEMPLATE;
  
  let userContent = userTemplate
    .replace(/{{name}}/g, tagName)
    .replace(/{{title}}/g, tagName);
  
  if (additionalInstructions) {
    userContent = userContent.replace(/{{additionalInstructions}}/g, additionalInstructions);
  } else {
    userContent = userContent.replace(" {{additionalInstructions}}", "").replace("{{additionalInstructions}}", "");
  }

  console.log(`[PROMPT] Blog Tag - System: ${systemPrompt.slice(0, 80)}...`);
  console.log(`[PROMPT] Blog Tag - User: ${userContent}`);

  return [
    { role: "system", content: systemPrompt },
    { role: "user", content: userContent.trim() },
  ];
}
