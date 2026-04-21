import "dotenv/config";
import { db, closeDatabase } from "../db/index.js";
import { prompts as promptsTable } from "../modules/prompts/prompts.schema.js";
import { 
  DEFAULT_BLOG_POST_SYSTEM_PROMPT,
  DEFAULT_BLOG_POST_USER_TEMPLATE 
} from "../modules/blogPosts/prompts/generate.js";
import { 
  DEFAULT_BLOG_CATEGORY_SYSTEM_PROMPT,
  DEFAULT_BLOG_CATEGORY_USER_TEMPLATE 
} from "../modules/blogCategories/prompts/generate.js";
import { 
  DEFAULT_BLOG_TAG_SYSTEM_PROMPT,
  DEFAULT_BLOG_TAG_USER_TEMPLATE 
} from "../modules/blogTags/prompts/generate.js";

const DEFAULT_RSS_TOPIC_SYSTEM_PROMPT = [
    "You are a content strategist. Pick the best topic from the feed items below for an India-focused blog post.",
    "",
    "RECENT POSTS (avoid duplicating):",
    "{RECENT_POSTS}",
    "",
    "FEED ITEMS:",
    "{FEED_ITEMS}",
    "",
    "Pick the most compelling topic. Prefer India-relevant topics but any significant global topic with Indian impact is fine.",
    "",
    "Respond with ONLY this JSON:",
    '{"selectedTitle": "Your chosen title", "reasoning": "Why you chose it", "sourceIndices": [0, 1]}'
].join("\n");

const DEFAULT_RSS_TOPIC_USER_TEMPLATE = 'Select the best topic from the provided feed items. {{additionalInstructions}}';

async function main() {
  console.log("[seed-prompts] Starting prompt injection...");

  const promptsData = [
    {
      module: "prompt_blog_post",
      name: "Default V1",
      systemPrompt: DEFAULT_BLOG_POST_SYSTEM_PROMPT,
      userPromptTemplate: DEFAULT_BLOG_POST_USER_TEMPLATE,
      isActive: true,
      version: 1,
    },
    {
      module: "prompt_blog_category",
      name: "Default V1",
      systemPrompt: DEFAULT_BLOG_CATEGORY_SYSTEM_PROMPT,
      userPromptTemplate: DEFAULT_BLOG_CATEGORY_USER_TEMPLATE,
      isActive: true,
      version: 1,
    },
    {
      module: "prompt_blog_tag",
      name: "Default V1",
      systemPrompt: DEFAULT_BLOG_TAG_SYSTEM_PROMPT,
      userPromptTemplate: DEFAULT_BLOG_TAG_USER_TEMPLATE,
      isActive: true,
      version: 1,
    },
    {
      module: "prompt_rss_topic",
      name: "Default V1",
      systemPrompt: DEFAULT_RSS_TOPIC_SYSTEM_PROMPT,
      userPromptTemplate: DEFAULT_RSS_TOPIC_USER_TEMPLATE,
      isActive: true,
      version: 1,
    },
  ];

  for (const prompt of promptsData) {
    await db
      .insert(promptsTable)
      .values({
        module: prompt.module,
        name: prompt.name,
        systemPrompt: prompt.systemPrompt,
        userPromptTemplate: prompt.userPromptTemplate,
        isActive: prompt.isActive,
        version: prompt.version,
      });
  }

  console.log("[seed-prompts] Done successfully inserting old data into new prompts table.");
}

main()
  .catch((err) => {
    console.error("[seed-prompts] FAILED", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closeDatabase().catch(() => undefined);
  });
