import { and, asc, desc, eq, inArray, isNull, lte, or, sql } from "drizzle-orm";
import { LRUCache } from "lru-cache";
import crypto from "node:crypto";
import { db } from "../../../db/index.js";
import { blogCategories } from "../../blogCategories/blogCategories.schema.js";
import { blogPosts } from "../../blogPosts/blogPosts.schema.js";
import { blogPostTags } from "../../blogPosts/blogPostTags.schema.js";
import { blogPostSecondaryCategories } from "../../blogPosts/blogPostSecondaryCategories.schema.js";
import {
  blogPostGeneratedSchema,
  buildBlogPostPrompt,
} from "../../blogPosts/prompts/generate.js";
import { blogTags } from "../../blogTags/blogTags.schema.js";
import { prompts as promptsTable } from "../../prompts/prompts.schema.js";
import { generateWithCache, LLMGenerationError } from "../../settings/llm/completion.js";
import {
  automationTopicCandidates,
  automationTopicSessions,
  feedItems,
  rssSources,
} from "../automation.schema.js";
import { fetchRssFeed } from "./rssFetcher.js";
import { TelegramBotService, type TelegramUpdate } from "./telegramBot.service.js";
import {
  calculateReadTime,
  extractContentImageIds,
  extractTableOfContents,
  slugify,
} from "../../../utils/text.js";
import { webRevalidatePaths } from "../../../utils/webRevalidate.js";

const SESSION_EXPIRY_HOURS = 24;
const DEFAULT_TOPIC_LIMIT = 10;
const DEFAULT_SELECTION_PAGE_SIZE = 10;
const DEFAULT_TOPICS_PAGE_SIZE = 10;

// Telegram can retry webhook deliveries (or tunnels can duplicate requests).
// Dedup by update_id/callback_query.id so button clicks are idempotent.
const telegramWebhookDedup = new LRUCache<string, true>({ max: 10_000, ttl: 1000 * 60 * 30 });

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

function getTelegramDedupKey(update: unknown): string | null {
  if (!isRecord(update)) return null;

  const updateId = update.update_id;
  if (typeof updateId === "number" && Number.isFinite(updateId)) {
    return `update:${updateId}`;
  }

  const callback = update.callback_query;
  if (isRecord(callback) && typeof callback.id === "string" && callback.id) {
    return `callback:${callback.id}`;
  }

  const message = update.message;
  if (isRecord(message)) {
    const messageId = message.message_id;
    const chat = message.chat;
    const chatId = isRecord(chat) ? chat.id : undefined;
    if ((typeof messageId === "number" || typeof messageId === "string") && (typeof chatId === "number" || typeof chatId === "string")) {
      return `message:${chatId}:${messageId}`;
    }
  }

  return null;
}

interface FeedTopicCandidate {
  feedItemId: string;
  title: string;
  description: string | null;
  sourceUrl: string;
  sourceAuthor: string | null;
  sourcePublishedAt: Date | null;
}

interface FeedTopicListItem {
  id: string;
  title: string;
  url: string;
  sourceName: string;
  publishedAt: Date | null;
  processingStatus: "unprocessed" | "ignored" | "processed" | "failed";
}

interface ResolvedBlogPostPrompt {
  systemPrompt: string | null;
  userPromptTemplate: string | null;
}

interface CategoryOption {
  id: string;
  name: string;
}

interface TagOption {
  id: string;
  name: string;
}

function truncateText(value: string, maxLength: number) {
  return value.length > maxLength ? `${value.slice(0, maxLength - 1)}...` : value;
}

function formatTelegramDate(value: Date | null) {
  return value ? value.toISOString().slice(0, 10) : "unknown date";
}

function computeStableGuid(params: { sourceUrl: string; url?: string | null; title?: string | null; pubDate?: Date | null }) {
  const base = `${params.sourceUrl}|${params.url || ""}|${params.title || ""}|${params.pubDate?.toISOString() || ""}`;
  return crypto.createHash("sha256").update(base).digest("hex");
}

export class AutomationService {
  static async syncAllFeeds() {
    const activeSources = await db
      .select()
      .from(rssSources)
      .where(eq(rssSources.isActive, true));

    console.log(`[RSS SYNC] Starting sync for ${activeSources.length} sources`);

    let totalNewItems = 0;

    for (const source of activeSources) {
      try {
        const items = await fetchRssFeed(source.url);
        let newCount = 0;

        for (const item of items) {
          const title = item.title?.trim() || "";
          const url = item.link?.trim() || "";

          // Skip rows that can't generate a meaningful draft.
          if (!title || !url) continue;

          const publishedAt = item.isoDate
            ? new Date(item.isoDate)
            : item.pubDate
              ? new Date(item.pubDate)
              : null;

          const safePublishedAt = publishedAt && !Number.isNaN(publishedAt.getTime()) ? publishedAt : null;

          const guid = (item.guid || url).trim() || computeStableGuid({
            sourceUrl: source.url,
            url,
            title,
            pubDate: safePublishedAt,
          });

          const existing = await db
            .select({ id: feedItems.id })
            .from(feedItems)
            .where(and(eq(feedItems.sourceId, source.id), eq(feedItems.guid, guid)))
            .limit(1);

          if (existing.length === 0) {
            await db.insert(feedItems).values({
              sourceId: source.id,
              guid,
              url,
              title,
              description: item.summary || "",
              content: item.content || "",
              author: item.creator || "",
              publishedAt: safePublishedAt,
              processingStatus: "unprocessed",
            });
            newCount++;
          }
        }

        totalNewItems += newCount;

        await db
          .update(rssSources)
          .set({ lastSyncedAt: new Date(), updatedAt: new Date() })
          .where(eq(rssSources.id, source.id));

        console.log(`[RSS SYNC] Finished source "${source.name}": ${newCount} new items`);
      } catch (err) {
        console.error(`[RSS SYNC] Failed for source "${source.name}":`, err);
      }
    }

    return {
      success: true,
      sourceCount: activeSources.length,
      newItems: totalNewItems,
    };
  }

  static async getTopTopicCandidates(limit = DEFAULT_TOPIC_LIMIT): Promise<FeedTopicCandidate[]> {
    const rows = await db
      .select({
        feedItemId: feedItems.id,
        title: feedItems.title,
        description: feedItems.description,
        sourceUrl: feedItems.url,
        sourceAuthor: feedItems.author,
        sourcePublishedAt: feedItems.publishedAt,
      })
      .from(feedItems)
      .where(eq(feedItems.processingStatus, "unprocessed"))
      .orderBy(desc(feedItems.publishedAt), desc(feedItems.createdAt))
      .limit(limit);

    return rows;
  }

  private static async getTopicsPage(page: number, pageSize = DEFAULT_TOPICS_PAGE_SIZE) {
    const safePage = Math.max(0, page);

    const rows = await db
      .select({
        id: feedItems.id,
        title: feedItems.title,
        url: feedItems.url,
        publishedAt: feedItems.publishedAt,
        processingStatus: feedItems.processingStatus,
        sourceName: rssSources.name,
      })
      .from(feedItems)
      .leftJoin(rssSources, eq(rssSources.id, feedItems.sourceId))
      .where(inArray(feedItems.processingStatus, ["unprocessed", "ignored"]))
      .orderBy(
        sql`case when ${feedItems.processingStatus} = 'unprocessed' then 0 else 1 end`,
        desc(feedItems.publishedAt),
        desc(feedItems.createdAt),
      )
      .limit(pageSize + 1)
      .offset(safePage * pageSize);

    const items = rows.slice(0, pageSize).map((row) => ({
      id: row.id,
      title: row.title,
      url: row.url,
      publishedAt: row.publishedAt,
      processingStatus: row.processingStatus,
      sourceName: row.sourceName ?? "Unknown",
    })) as FeedTopicListItem[];

    return {
      page: safePage,
      items,
      hasNext: rows.length > pageSize,
      hasPrev: safePage > 0,
    };
  }

  private static buildTopicsMessage(params: { page: number; items: FeedTopicListItem[] }) {
    const lines = [
      "RSS topics",
      "",
      `Page: ${params.page + 1}`,
      "",
      ...params.items.map((item, index) => {
        const statusBadge = item.processingStatus === "ignored" ? "[ignored] " : "";
        return `${index + 1}. ${statusBadge}${item.title}\n   ${item.sourceName} | ${formatTelegramDate(item.publishedAt)}`;
      }),
      "",
      "Pick a number to generate a draft (use Open to view the source).",
      "Use Ignore/Unignore to manage the list.",
      "Tip: use /sync to fetch fresh items.",
    ];

    return lines.join("\n");
  }

  private static buildTopicsKeyboard(params: { page: number; items: FeedTopicListItem[]; hasPrev: boolean; hasNext: boolean }) {
    const rows: Array<Array<{ text: string; callback_data?: string; url?: string }>> = params.items.map((item, index) => {
      const statusAction = item.processingStatus === "ignored" ? "unprocessed" : "ignored";
      const statusLabel = item.processingStatus === "ignored" ? "Unignore" : "Ignore";

      return [
      {
        text: `${index + 1}`,
        callback_data: `rsstopicpick:${item.id}`,
      },
      {
        text: "Open",
        url: item.url,
      },
      {
        text: statusLabel,
        callback_data: `rsstopicset:${params.page}:${item.id}:${statusAction}`,
      },
    ];
    });

    const navRow: Array<{ text: string; callback_data: string }> = [];
    if (params.hasPrev) navRow.push({ text: "Prev", callback_data: `rsstopicsnav:${params.page - 1}` });
    if (params.hasNext) navRow.push({ text: "Next", callback_data: `rsstopicsnav:${params.page + 1}` });
    if (navRow.length > 0) rows.push(navRow);

    rows.push([
      { text: "Sync RSS", callback_data: "rsscmd:sync" },
      { text: "Refresh", callback_data: `rsstopicsnav:${params.page}` },
    ]);

    return { inline_keyboard: rows };
  }

  private static async showTopics(params: { chatId: string | number; messageId?: number; page?: number }) {
    const page = params.page ?? 0;
    const pageData = await AutomationService.getTopicsPage(page);

    const text = AutomationService.buildTopicsMessage({ page: pageData.page, items: pageData.items });
    const replyMarkup = AutomationService.buildTopicsKeyboard({
      page: pageData.page,
      items: pageData.items,
      hasPrev: pageData.hasPrev,
      hasNext: pageData.hasNext,
    });

    if (params.messageId) {
      await TelegramBotService.editMessageText({
        chatId: params.chatId,
        messageId: params.messageId,
        text,
        replyMarkup,
      });
      return;
    }

    await TelegramBotService.sendMessage({
      chatId: params.chatId,
      text,
      replyMarkup,
    });
  }

  private static async getActiveCategoriesPage(page: number, pageSize = DEFAULT_SELECTION_PAGE_SIZE) {
    const safePage = Math.max(0, page);
    const rows = await db
      .select({ id: blogCategories.id, name: blogCategories.name })
      .from(blogCategories)
      .where(eq(blogCategories.status, "active"))
      .orderBy(asc(blogCategories.name))
      .limit(pageSize + 1)
      .offset(safePage * pageSize);

    return {
      page: safePage,
      items: rows.slice(0, pageSize) as CategoryOption[],
      hasNext: rows.length > pageSize,
      hasPrev: safePage > 0,
    };
  }

  private static async getActiveTagsPage(page: number, pageSize = DEFAULT_SELECTION_PAGE_SIZE) {
    const safePage = Math.max(0, page);
    const rows = await db
      .select({ id: blogTags.id, name: blogTags.name })
      .from(blogTags)
      .where(eq(blogTags.status, "active"))
      .orderBy(asc(blogTags.name))
      .limit(pageSize + 1)
      .offset(safePage * pageSize);

    return {
      page: safePage,
      items: rows.slice(0, pageSize) as TagOption[],
      hasNext: rows.length > pageSize,
      hasPrev: safePage > 0,
    };
  }

  static async createTopicSession(limit = DEFAULT_TOPIC_LIMIT) {
    const candidates = await AutomationService.getTopTopicCandidates(limit);
    if (candidates.length === 0) {
      return null;
    }

    const expiresAt = new Date(Date.now() + SESSION_EXPIRY_HOURS * 60 * 60 * 1000);

    return db.transaction(async (tx) => {
      await tx
        .update(automationTopicSessions)
        .set({ status: "cancelled", updatedAt: new Date() })
        .where(eq(automationTopicSessions.status, "pending"));

      const [session] = await tx
        .insert(automationTopicSessions)
        .values({ expiresAt })
        .returning();

      const insertedCandidates = await tx
        .insert(automationTopicCandidates)
        .values(
          candidates.map((candidate, index) => ({
            sessionId: session.id,
            feedItemId: candidate.feedItemId,
            rank: index,
            title: candidate.title,
            description: candidate.description,
            sourceUrl: candidate.sourceUrl,
            sourceAuthor: candidate.sourceAuthor,
            sourcePublishedAt: candidate.sourcePublishedAt,
          }))
        )
        .returning();

      return { session, candidates: insertedCandidates };
    });
  }

  private static buildTopicSelectionMessage(params: {
    sessionId: string;
    expiresAt: Date;
    candidates: Array<{
      rank: number;
      title: string;
      description: string | null;
      sourcePublishedAt: Date | null;
    }>;
  }) {
    const lines = [
      "RSS topic review",
      "",
      `Session: ${params.sessionId}`,
      `Expires: ${params.expiresAt.toISOString()}`,
      "",
      "Choose one topic to generate as a draft:",
      "",
      ...params.candidates.map((candidate) => {
        const summary = candidate.description ? truncateText(candidate.description, 120) : "No summary available.";
        return `${candidate.rank + 1}. ${candidate.title}\n   ${summary}\n   ${formatTelegramDate(candidate.sourcePublishedAt)}`;
      }),
    ];

    return lines.join("\n");
  }

  private static buildTopicSelectionKeyboard(sessionId: string, candidates: Array<{ rank: number; title: string }>) {
    return {
      inline_keyboard: [
        ...candidates.map((candidate) => [
          {
            text: `${candidate.rank + 1}. ${truncateText(candidate.title, 48)}`,
            callback_data: `rsspick:${sessionId}:${candidate.rank}`,
          },
        ]),
        [{ text: "Skip this batch", callback_data: `rssskip:${sessionId}` }],
      ],
    };
  }

  private static buildCategorySelectionMessage(params: {
    sessionId: string;
    draftTitle: string;
    page: number;
    items: CategoryOption[];
    isSecondary?: boolean;
    primaryCategoryName?: string;
  }) {
    const lines = [
      "Draft generated successfully.",
      "",
      `Title: ${params.draftTitle}`,
      `Session: ${params.sessionId}`,
      "",
    ];

    if (params.isSecondary) {
      lines.push(`Primary category: ${params.primaryCategoryName || "Unknown"}`);
      lines.push("");
      lines.push(`Choose a SECONDARY category (optional, page ${params.page + 1}) or tap Skip secondary:`);
    } else {
      lines.push(`Choose the PRIMARY category (page ${params.page + 1}):`);
    }

    lines.push("");
    lines.push(...params.items.map((item, index) => `${index + 1}. ${item.name}`));

    return lines.join("\n");
  }

  private static buildCategorySelectionKeyboard(params: {
    sessionId: string;
    page: number;
    items: CategoryOption[];
    hasPrev: boolean;
    hasNext: boolean;
    isSecondary?: boolean;
  }) {
    const rows: Array<Array<{ text: string; callback_data: string }>> = params.items.map((item, index) => [
      {
        text: `${index + 1}. ${truncateText(item.name, 48)}`,
        callback_data: params.isSecondary
          ? `rsscat2:${params.sessionId}:${params.page}:${index}`
          : `rsscat:${params.sessionId}:${params.page}:${index}`,
      },
    ]);

    const navRow: Array<{ text: string; callback_data: string }> = [];
    if (params.hasPrev) {
      navRow.push({ text: "Prev", callback_data: params.isSecondary
        ? `rsscat2nav:${params.sessionId}:${params.page - 1}`
        : `rsscatnav:${params.sessionId}:${params.page - 1}`
      });
    }
    if (params.hasNext) {
      navRow.push({ text: "Next", callback_data: params.isSecondary
        ? `rsscat2nav:${params.sessionId}:${params.page + 1}`
        : `rsscatnav:${params.sessionId}:${params.page + 1}`
      });
    }
    if (navRow.length > 0) {
      rows.push(navRow);
    }

    if (params.isSecondary) {
      rows.push([
        { text: "Back to primary", callback_data: `rsscatback:${params.sessionId}` },
        { text: "Skip secondary", callback_data: `rsscatskip:${params.sessionId}` },
      ]);
    }

    return { inline_keyboard: rows };
  }

  private static buildTagSelectionMessage(params: {
    sessionId: string;
    draftTitle: string;
    categoryName: string;
    page: number;
    items: TagOption[];
    selectedTagIds: string[];
  }) {
    return [
      "Draft generated successfully.",
      "",
      `Title: ${params.draftTitle}`,
      `Primary category: ${params.categoryName}`,
      `Selected tags: ${params.selectedTagIds.length}`,
      "",
      `Choose tags (page ${params.page + 1}). Tap to toggle, then save:`,
      "",
      ...params.items.map((item, index) => {
        const checked = params.selectedTagIds.includes(item.id) ? "[x]" : "[ ]";
        return `${index + 1}. ${checked} ${item.name}`;
      }),
    ].join("\n");
  }

  private static buildTagSelectionKeyboard(params: {
    sessionId: string;
    page: number;
    items: TagOption[];
    selectedTagIds: string[];
    hasPrev: boolean;
    hasNext: boolean;
  }) {
    const rows: Array<Array<{ text: string; callback_data: string }>> = params.items.map((item, index) => [
      {
        text: `${params.selectedTagIds.includes(item.id) ? "✓" : "○"} ${truncateText(item.name, 42)}`,
        callback_data: `rsstag:${params.sessionId}:${params.page}:${index}`,
      },
    ]);

    const navRow: Array<{ text: string; callback_data: string }> = [];
    if (params.hasPrev) {
      navRow.push({ text: "Prev", callback_data: `rsstagnav:${params.sessionId}:${params.page - 1}` });
    }
    if (params.hasNext) {
      navRow.push({ text: "Next", callback_data: `rsstagnav:${params.sessionId}:${params.page + 1}` });
    }
    if (navRow.length > 0) {
      rows.push(navRow);
    }

    rows.push([
      { text: "Save tags", callback_data: `rsstagsave:${params.sessionId}` },
      { text: "Skip tags", callback_data: `rsstagskip:${params.sessionId}` },
    ]);

    return { inline_keyboard: rows };
  }

  static async notifyTopicSession(sessionId: string) {
    const chatId = await TelegramBotService.getAllowedChatId();
    return AutomationService.notifyTopicSessionToChat(sessionId, chatId);
  }

  private static async notifyTopicSessionToChat(sessionId: string, chatId: string | number) {
    const [session] = await db
      .select()
      .from(automationTopicSessions)
      .where(eq(automationTopicSessions.id, sessionId))
      .limit(1);

    if (!session) {
      throw new Error("Topic session not found");
    }

    const candidates = await db
      .select({ rank: automationTopicCandidates.rank, title: automationTopicCandidates.title, description: automationTopicCandidates.description, sourcePublishedAt: automationTopicCandidates.sourcePublishedAt })
      .from(automationTopicCandidates)
      .where(eq(automationTopicCandidates.sessionId, sessionId))
      .orderBy(asc(automationTopicCandidates.rank));

    if (candidates.length === 0) {
      throw new Error("Topic session has no candidates");
    }

    const sent = await TelegramBotService.sendMessage({
      chatId,
      text: AutomationService.buildTopicSelectionMessage({
        sessionId,
        expiresAt: session.expiresAt,
        candidates,
      }),
      replyMarkup: AutomationService.buildTopicSelectionKeyboard(sessionId, candidates),
    });

    await db
      .update(automationTopicSessions)
      .set({
        telegramChatId: String(chatId),
        telegramMessageId: sent.message_id,
        updatedAt: new Date(),
      })
      .where(eq(automationTopicSessions.id, sessionId));

    return { sessionId, messageId: sent.message_id, candidateCount: candidates.length };
  }

  static async syncAndNotifyTelegram(limit = DEFAULT_TOPIC_LIMIT) {
    await AutomationService.syncAllFeeds();
    const topicSession = await AutomationService.createTopicSession(limit);

    if (!topicSession) {
      return { success: false, message: "No unprocessed feed items available" };
    }

    const notification = await AutomationService.notifyTopicSession(topicSession.session.id);

    return {
      success: true,
      sessionId: topicSession.session.id,
      candidateCount: notification.candidateCount,
      message: "Topic shortlist sent to Telegram",
    };
  }

  static async syncAndNotifyTelegramToChat(chatId: string | number, limit = DEFAULT_TOPIC_LIMIT) {
    await AutomationService.syncAllFeeds();
    const topicSession = await AutomationService.createTopicSession(limit);

    if (!topicSession) {
      await TelegramBotService.sendMessage({
        chatId,
        text: "No unprocessed feed items available.",
      });
      return { success: false, message: "No unprocessed feed items available" };
    }

    const notification = await AutomationService.notifyTopicSessionToChat(topicSession.session.id, chatId);

    return {
      success: true,
      sessionId: topicSession.session.id,
      candidateCount: notification.candidateCount,
      message: "Topic shortlist sent to Telegram",
    };
  }

  private static async createSessionFromFeedItem(params: { feedItemId: string; chatId: string | number; messageId: number }) {
    const expiresAt = new Date(Date.now() + SESSION_EXPIRY_HOURS * 60 * 60 * 1000);

    const { sessionId, title } = await db.transaction(async (tx) => {
      // Ensure idempotency across retries/double-clicks by taking a DB-level lock
      // on the feed item id for the duration of this transaction.
      const lock = await tx.execute(
        sql`select pg_try_advisory_xact_lock(hashtext(${params.feedItemId}::text)) as ok`,
      );
      const ok = Boolean((lock.rows?.[0] as { ok?: boolean } | undefined)?.ok);
      if (!ok) {
        throw new Error("This topic is already being processed. Try again in a moment.");
      }

      const [feedItem] = await tx
        .select({
          id: feedItems.id,
          title: feedItems.title,
          description: feedItems.description,
          url: feedItems.url,
          author: feedItems.author,
          publishedAt: feedItems.publishedAt,
          processingStatus: feedItems.processingStatus,
        })
        .from(feedItems)
        .where(eq(feedItems.id, params.feedItemId))
        .limit(1);

      if (!feedItem) {
        throw new Error("Topic not found");
      }

      if (feedItem.processingStatus !== "unprocessed" && feedItem.processingStatus !== "ignored") {
        throw new Error(`Topic is ${feedItem.processingStatus}`);
      }

      await tx
        .update(automationTopicSessions)
        .set({ status: "cancelled", updatedAt: new Date() })
        .where(eq(automationTopicSessions.status, "pending"));

      const [session] = await tx
        .insert(automationTopicSessions)
        .values({
          expiresAt,
          status: "selected",
          workflowStep: "topic_selection",
          telegramChatId: String(params.chatId),
          telegramMessageId: params.messageId,
          selectedCandidateRank: 0,
        })
        .returning({ id: automationTopicSessions.id });

      await tx.insert(automationTopicCandidates).values({
        sessionId: session.id,
        feedItemId: feedItem.id,
        rank: 0,
        title: feedItem.title,
        description: feedItem.description,
        sourceUrl: feedItem.url,
        sourceAuthor: feedItem.author,
        sourcePublishedAt: feedItem.publishedAt,
        isSelected: true,
      });

      return { sessionId: session.id, title: feedItem.title };
    });

    return { sessionId, title };
  }

  private static async handleTelegramTopicPicked(params: {
    feedItemId: string;
    callbackQueryId: string;
    chatId: string | number;
    messageId: number;
  }) {
    try {
      const { sessionId, title } = await AutomationService.createSessionFromFeedItem({
        feedItemId: params.feedItemId,
        chatId: params.chatId,
        messageId: params.messageId,
      });

      await TelegramBotService.answerCallbackQuery({
        callbackQueryId: params.callbackQueryId,
        text: "Topic selected. Draft generation started.",
      });

      await TelegramBotService.editMessageText({
        chatId: params.chatId,
        messageId: params.messageId,
        text: `Generating draft for:\n\n${title}`,
      });

      void AutomationService.generateDraftForSession(sessionId)
        .then(async () => {
          await AutomationService.showCategorySelection({
            sessionId,
            chatId: params.chatId,
            messageId: params.messageId,
            page: 0,
          });
        })
        .catch(async (err) => {
          await TelegramBotService.editMessageText({
            chatId: params.chatId,
            messageId: params.messageId,
            text: `Draft generation failed.\n\n${err instanceof Error ? err.message : "Unknown error"}`,
          });
        });
    } catch (err) {
      await TelegramBotService.answerCallbackQuery({
        callbackQueryId: params.callbackQueryId,
        text: err instanceof Error ? err.message : "Unable to select topic",
        showAlert: true,
      });
    }
  }

  private static async getSessionWithDraft(sessionId: string) {
    const [session] = await db
      .select()
      .from(automationTopicSessions)
      .where(eq(automationTopicSessions.id, sessionId))
      .limit(1);

    if (!session) {
      throw new Error("Topic session not found");
    }

    if (session.expiresAt.getTime() <= Date.now() && !["completed", "cancelled", "failed", "generated"].includes(session.status)) {
      await db
        .update(automationTopicSessions)
        .set({ status: "expired", updatedAt: new Date() })
        .where(eq(automationTopicSessions.id, sessionId));
      throw new Error("Topic session has expired");
    }

    const [draft] = session.generatedPostId
      ? await db
          .select({ id: blogPosts.id, title: blogPosts.title, categoryId: blogPosts.categoryId })
          .from(blogPosts)
          .where(eq(blogPosts.id, session.generatedPostId))
          .limit(1)
      : [];

    return { session, draft: draft ?? null };
  }

  private static async showCategorySelection(params: { sessionId: string; chatId: string | number; messageId: number; page?: number; isSecondary?: boolean; }) {
    const { session, draft } = await AutomationService.getSessionWithDraft(params.sessionId);
    if (!draft) {
      throw new Error("Draft not found for this session");
    }

    const categoryPage = await AutomationService.getActiveCategoriesPage(params.page ?? 0);
    
    if (!params.isSecondary) {
      await db
        .update(automationTopicSessions)
        .set({ status: "categorizing", workflowStep: "category_selection", updatedAt: new Date() })
        .where(eq(automationTopicSessions.id, params.sessionId));
    }

    const primaryCategoryName = session.assignedCategoryId
      ? (await db
          .select({ name: blogCategories.name })
          .from(blogCategories)
          .where(eq(blogCategories.id, session.assignedCategoryId))
          .limit(1))[0]?.name ?? "Unknown"
      : undefined;

    await TelegramBotService.editMessageText({
      chatId: params.chatId,
      messageId: params.messageId,
      text: AutomationService.buildCategorySelectionMessage({
        sessionId: params.sessionId,
        draftTitle: draft.title,
        page: categoryPage.page,
        items: categoryPage.items,
        isSecondary: params.isSecondary,
        primaryCategoryName,
      }),
      replyMarkup: AutomationService.buildCategorySelectionKeyboard({
        sessionId: params.sessionId,
        page: categoryPage.page,
        items: categoryPage.items,
        hasPrev: categoryPage.hasPrev,
        hasNext: categoryPage.hasNext,
        isSecondary: params.isSecondary,
      }),
    });
  }

  private static async showSecondaryCategorySelection(params: { sessionId: string; chatId: string | number; messageId: number; page?: number; }) {
    await AutomationService.showCategorySelection({
      sessionId: params.sessionId,
      chatId: params.chatId,
      messageId: params.messageId,
      page: params.page,
      isSecondary: true,
    });
  }

  private static async showTagSelection(params: { sessionId: string; chatId: string | number; messageId: number; page?: number; }) {
    const { session, draft } = await AutomationService.getSessionWithDraft(params.sessionId);
    if (!draft) {
      throw new Error("Draft not found for this session");
    }
    if (!session.assignedCategoryId) {
      throw new Error("Primary category has not been assigned yet");
    }

    const [category] = await db
      .select({ name: blogCategories.name })
      .from(blogCategories)
      .where(eq(blogCategories.id, session.assignedCategoryId))
      .limit(1);

    const tagPage = await AutomationService.getActiveTagsPage(params.page ?? 0);
    const selectedTagIds = session.selectedTagIds ?? [];

    await db
      .update(automationTopicSessions)
      .set({ status: "tagging", workflowStep: "tag_selection", updatedAt: new Date() })
      .where(eq(automationTopicSessions.id, params.sessionId));

    await TelegramBotService.editMessageText({
      chatId: params.chatId,
      messageId: params.messageId,
      text: AutomationService.buildTagSelectionMessage({
        sessionId: params.sessionId,
        draftTitle: draft.title,
        categoryName: category?.name ?? "Unknown",
        page: tagPage.page,
        items: tagPage.items,
        selectedTagIds,
      }),
      replyMarkup: AutomationService.buildTagSelectionKeyboard({
        sessionId: params.sessionId,
        page: tagPage.page,
        items: tagPage.items,
        selectedTagIds,
        hasPrev: tagPage.hasPrev,
        hasNext: tagPage.hasNext,
      }),
    });
  }

  private static async assignCategoryFromPage(params: { sessionId: string; page: number; index: number; isSecondary?: boolean; }) {
    const pageData = await AutomationService.getActiveCategoriesPage(params.page);
    const category = pageData.items[params.index];
    if (!category) {
      throw new Error("Category option not found");
    }

    const { session, draft } = await AutomationService.getSessionWithDraft(params.sessionId);
    if (!draft) {
      throw new Error("Draft not found for this session");
    }

    if (params.isSecondary) {
      await db.transaction(async (tx) => {
        await tx
          .delete(blogPostSecondaryCategories)
          .where(eq(blogPostSecondaryCategories.postId, draft.id));

        await tx
          .insert(blogPostSecondaryCategories)
          .values({ postId: draft.id, categoryId: category.id });

        await tx
          .update(automationTopicSessions)
          .set({
            assignedSecondaryCategoryId: category.id,
            updatedAt: new Date(),
          })
          .where(eq(automationTopicSessions.id, session.id));
      });

      return { category, isSecondary: true };
    }

    await db.transaction(async (tx) => {
      await tx
        .update(blogPosts)
        .set({ categoryId: category.id, updatedAt: new Date() })
        .where(eq(blogPosts.id, draft.id));

      // Changing primary category should clear any prior secondary category selection.
      await tx
        .delete(blogPostSecondaryCategories)
        .where(eq(blogPostSecondaryCategories.postId, draft.id));

      await tx
        .update(automationTopicSessions)
        .set({
          assignedCategoryId: category.id,
          assignedSecondaryCategoryId: null,
          status: "categorizing",
          workflowStep: "category_selection",
          updatedAt: new Date(),
        })
        .where(eq(automationTopicSessions.id, session.id));
    });

    return { category, isSecondary: false };
  }

  private static async toggleTagFromPage(params: { sessionId: string; page: number; index: number; }) {
    const tagPage = await AutomationService.getActiveTagsPage(params.page);
    const tag = tagPage.items[params.index];
    if (!tag) {
      throw new Error("Tag option not found");
    }

    const [session] = await db
      .select({ selectedTagIds: automationTopicSessions.selectedTagIds })
      .from(automationTopicSessions)
      .where(eq(automationTopicSessions.id, params.sessionId))
      .limit(1);

    if (!session) {
      throw new Error("Topic session not found");
    }

    const selectedTagIds = session.selectedTagIds ?? [];
    const nextSelectedTagIds = selectedTagIds.includes(tag.id)
      ? selectedTagIds.filter((value) => value !== tag.id)
      : [...selectedTagIds, tag.id];

    await db
      .update(automationTopicSessions)
      .set({ selectedTagIds: nextSelectedTagIds, updatedAt: new Date() })
      .where(eq(automationTopicSessions.id, params.sessionId));

    return nextSelectedTagIds;
  }

  private static async finalizeTagAssignments(sessionId: string) {
    const { session, draft } = await AutomationService.getSessionWithDraft(sessionId);
    if (!draft) {
      throw new Error("Draft not found for this session");
    }

    const selectedTagIds = session.selectedTagIds ?? [];

    await db.transaction(async (tx) => {
      await tx.delete(blogPostTags).where(eq(blogPostTags.postId, draft.id));

      if (selectedTagIds.length > 0) {
        await tx.insert(blogPostTags).values(
          selectedTagIds.map((tagId) => ({ postId: draft.id, tagId })),
        );
      }

      await tx
        .update(automationTopicSessions)
        .set({ status: "tagging", workflowStep: "completed", updatedAt: new Date() })
        .where(eq(automationTopicSessions.id, sessionId));
    });

    const categoryName = session.assignedCategoryId
      ? (
          await db
            .select({ name: blogCategories.name })
            .from(blogCategories)
            .where(eq(blogCategories.id, session.assignedCategoryId))
            .limit(1)
        )[0]?.name ?? "Unknown"
      : "Not assigned";

    const tagNames = selectedTagIds.length > 0
      ? await db
          .select({ name: blogTags.name })
          .from(blogTags)
          .where(inArray(blogTags.id, selectedTagIds))
      : [];

    return {
      draftId: draft.id,
      draftTitle: draft.title,
      categoryName,
      tagNames: tagNames.map((tag) => tag.name),
    };
  }

  private static buildPublishActionKeyboard(sessionId: string) {
    return {
      inline_keyboard: [
        [
          { text: "Publish Now", callback_data: `rsspublish:${sessionId}:publish` },
          { text: "Keep as Draft", callback_data: `rsspublish:${sessionId}:keep_draft` },
        ],
      ],
    };
  }

  private static async showPublishAction(params: { sessionId: string; chatId: string | number; messageId: number; }) {
    const { session, draft } = await AutomationService.getSessionWithDraft(params.sessionId);
    if (!draft) {
      throw new Error("Draft not found for this session");
    }

    const categoryName = session.assignedCategoryId
      ? (
          await db
            .select({ name: blogCategories.name })
            .from(blogCategories)
            .where(eq(blogCategories.id, session.assignedCategoryId))
            .limit(1)
        )[0]?.name ?? "Unknown"
      : "Not assigned";

    const tagNames = session.selectedTagIds && session.selectedTagIds.length > 0
      ? await db
          .select({ name: blogTags.name })
          .from(blogTags)
          .where(inArray(blogTags.id, session.selectedTagIds))
      : [];

    await TelegramBotService.editMessageText({
      chatId: params.chatId,
      messageId: params.messageId,
      text: `Draft assignment completed.\n\nTitle: ${draft.title}\nDraft ID: ${draft.id}\nPrimary category: ${categoryName}\nTags: ${tagNames.length > 0 ? tagNames.map((t) => t.name).join(", ") : "None"}\n\nChoose an action:`,
      replyMarkup: AutomationService.buildPublishActionKeyboard(params.sessionId),
    });
  }

  private static async resolveBlogPostPrompt(): Promise<ResolvedBlogPostPrompt> {
    const [defaultTemplate] = await db
      .select({ systemPrompt: promptsTable.systemPrompt, userPromptTemplate: promptsTable.userPromptTemplate })
      .from(promptsTable)
      .where(
        and(
          eq(promptsTable.module, "prompt_blog_post"),
          eq(promptsTable.isDefault, true),
          eq(promptsTable.isTemplate, true),
          isNull(promptsTable.deletedAt),
        )
      )
      .limit(1);

    if (defaultTemplate) {
      return defaultTemplate;
    }

    const [activePrompt] = await db
      .select({ systemPrompt: promptsTable.systemPrompt, userPromptTemplate: promptsTable.userPromptTemplate })
      .from(promptsTable)
      .where(
        and(
          eq(promptsTable.module, "prompt_blog_post"),
          eq(promptsTable.isActive, true),
          isNull(promptsTable.deletedAt),
        )
      )
      .limit(1);

    return {
      systemPrompt: activePrompt?.systemPrompt ?? null,
      userPromptTemplate: activePrompt?.userPromptTemplate ?? null,
    };
  }

  private static buildGroundedBlogPostMessages(params: {
    title: string;
    prompt: ResolvedBlogPostPrompt;
    sourceItems: Array<{
      title: string;
      description: string | null;
      content: string | null;
      url: string;
      author: string | null;
      publishedAt: Date | null;
    }>;
  }) {
    const messages = buildBlogPostPrompt(
      params.title,
      params.prompt.systemPrompt,
      params.prompt.userPromptTemplate,
    );

    const sourceMaterial = params.sourceItems
      .map((item, index) => {
        const parts = [
          `SOURCE ${index + 1}: ${item.title}`,
          `URL: ${item.url || "n/a"}`,
          `AUTHOR: ${item.author || "n/a"}`,
          `PUBLISHED: ${item.publishedAt?.toISOString() || "n/a"}`,
          `SUMMARY: ${item.description || "n/a"}`,
        ];

        if (item.content?.trim()) {
          parts.push(`CONTENT: ${truncateText(item.content, 3000)}`);
        }

        return parts.join("\n");
      })
      .join("\n\n");

    const lastMessage = messages[messages.length - 1];
    lastMessage.content +=
      "\n\nUSE THIS SOURCE MATERIAL AS GROUNDING:\n" +
      sourceMaterial +
      "\n\nGenerate only a draft-ready article. Prioritize India-centric analysis and investigative depth.";

    return messages;
  }

  private static async createDraftFromFeedItems(params: {
    title: string;
    sourceItems: Array<{
      id: string;
      title: string;
      description: string | null;
      content: string | null;
      url: string;
      author: string | null;
      publishedAt: Date | null;
    }>;
  }) {
    const prompt = await AutomationService.resolveBlogPostPrompt();
    const messages = AutomationService.buildGroundedBlogPostMessages({
      title: params.title,
      prompt,
      sourceItems: params.sourceItems,
    });

    const result = await generateWithCache({
      messages,
      temperature: 0.7,
      maxTokens: 16000,
      jsonMode: true,
      cacheKey: `rss_auto:${params.title}:${Date.now()}`,
      enableCache: true,
      module: "blog_post",
      inputTitle: params.title,
      schema: blogPostGeneratedSchema,
    });

    const generated = result.data;
    const content = generated.content || "";
    const faq = Array.isArray(generated.faq) ? generated.faq : [];

    const [insertedPost] = await db
      .insert(blogPosts)
      .values({
        title: params.title,
        slug: generated.slug || slugify(params.title),
        excerpt: generated.excerpt || "",
        content,
        metaTitle: generated.metaTitle || params.title,
        metaDescription: generated.metaDescription || "",
        metaKeywords: generated.metaKeywords || "",
        faq,
        status: "draft",
        tableOfContents: extractTableOfContents(content),
        readTimeMinutes: calculateReadTime(content),
        contentImageFileIds: extractContentImageIds(content),
        authorType: "platform",
      })
      .returning();

    await db
      .update(feedItems)
      .set({ processingStatus: "processed", processingError: null })
      .where(inArray(feedItems.id, params.sourceItems.map((item) => item.id)));

    return insertedPost;
  }

  static async autoGenerateDraft() {
    const candidates = await AutomationService.getTopTopicCandidates(1);
    if (candidates.length === 0) {
      return { success: false, message: "No new feed items to process" };
    }

    const [feedItem] = await db
      .select()
      .from(feedItems)
      .where(eq(feedItems.id, candidates[0].feedItemId))
      .limit(1);

    if (!feedItem) {
      return { success: false, message: "Feed item not found" };
    }

    try {
      const draft = await AutomationService.createDraftFromFeedItems({
        title: feedItem.title,
        sourceItems: [feedItem],
      });

      return { success: true, data: draft, title: draft.title };
    } catch (err) {
      if (err instanceof LLMGenerationError) {
        throw new Error(`RSS automation failed: LLM response could not be parsed. Cache key: ${err.cacheKey}`);
      }
      throw err;
    }
  }

  static async autoGenerateDraftFromFeedItemId(feedItemId: string) {
    const [feedItem] = await db
      .select()
      .from(feedItems)
      .where(eq(feedItems.id, feedItemId))
      .limit(1);

    if (!feedItem) {
      throw new Error("Feed item not found");
    }

    if (feedItem.processingStatus === "processed") {
      throw new Error("Feed item already processed");
    }

    try {
      const draft = await AutomationService.createDraftFromFeedItems({
        title: feedItem.title,
        sourceItems: [feedItem],
      });

      return draft;
    } catch (err) {
      if (err instanceof LLMGenerationError) {
        throw new Error(
          `RSS automation failed: LLM response could not be parsed. Cache key: ${err.cacheKey}`,
        );
      }
      throw err;
    }
  }

  private static async markSessionCancelled(sessionId: string) {
    const [session] = await db
      .update(automationTopicSessions)
      .set({ status: "cancelled", updatedAt: new Date() })
      .where(
        and(
          eq(automationTopicSessions.id, sessionId),
          eq(automationTopicSessions.status, "pending"),
        )
      )
      .returning();

    return session ?? null;
  }

  private static async selectTopicCandidate(sessionId: string, rank: number) {
    return db.transaction(async (tx) => {
      const [session] = await tx
        .select()
        .from(automationTopicSessions)
        .where(eq(automationTopicSessions.id, sessionId))
        .limit(1);

      if (!session) {
        throw new Error("Topic session not found");
      }
      if (session.status !== "pending") {
        throw new Error(`Topic session is ${session.status}`);
      }
      if (session.expiresAt.getTime() <= Date.now()) {
        await tx
          .update(automationTopicSessions)
          .set({ status: "expired", updatedAt: new Date() })
          .where(eq(automationTopicSessions.id, sessionId));
        throw new Error("Topic session has expired");
      }

      const [candidate] = await tx
        .select()
        .from(automationTopicCandidates)
        .where(
          and(
            eq(automationTopicCandidates.sessionId, sessionId),
            eq(automationTopicCandidates.rank, rank),
          )
        )
        .limit(1);

      if (!candidate) {
        throw new Error("Topic candidate not found");
      }

      await tx
        .update(automationTopicSessions)
        .set({
          status: "selected",
          selectedCandidateRank: rank,
          updatedAt: new Date(),
        })
        .where(eq(automationTopicSessions.id, sessionId));

      await tx
        .update(automationTopicCandidates)
        .set({ isSelected: true })
        .where(eq(automationTopicCandidates.id, candidate.id));

      return { session, candidate };
    });
  }

  static async generateDraftForSession(sessionId: string) {
    const [session] = await db
      .select()
      .from(automationTopicSessions)
      .where(eq(automationTopicSessions.id, sessionId))
      .limit(1);

    if (!session) {
      throw new Error("Topic session not found");
    }
    if (session.selectedCandidateRank === null || session.selectedCandidateRank === undefined) {
      throw new Error("No topic candidate selected for this session");
    }

    const [candidate] = await db
      .select()
      .from(automationTopicCandidates)
      .where(
        and(
          eq(automationTopicCandidates.sessionId, sessionId),
          eq(automationTopicCandidates.rank, session.selectedCandidateRank),
        )
      )
      .limit(1);

    if (!candidate) {
      throw new Error("Selected topic candidate not found");
    }

    const [feedItem] = await db
      .select()
      .from(feedItems)
      .where(eq(feedItems.id, candidate.feedItemId))
      .limit(1);

    if (!feedItem) {
      throw new Error("Selected feed item not found");
    }

    try {
      const draft = await AutomationService.createDraftFromFeedItems({
        title: candidate.title,
        sourceItems: [feedItem],
      });

      await db
        .update(automationTopicSessions)
        .set({
          status: "generated",
          workflowStep: "draft_generated",
          generatedPostId: draft.id,
          errorMessage: null,
          updatedAt: new Date(),
        })
        .where(eq(automationTopicSessions.id, sessionId));

      return draft;
    } catch (err) {
      await db
        .update(automationTopicSessions)
        .set({
          status: "failed",
          errorMessage: err instanceof Error ? err.message : "Draft generation failed",
          updatedAt: new Date(),
        })
        .where(eq(automationTopicSessions.id, sessionId));

      await db
        .update(feedItems)
        .set({
          processingStatus: "failed",
          processingError: err instanceof Error ? err.message : "Draft generation failed",
        })
        .where(eq(feedItems.id, candidate.feedItemId));

      throw err;
    }
  }

  private static async handleTelegramCandidatePicked(params: {
    sessionId: string;
    rank: number;
    callbackQueryId: string;
    chatId: string | number;
    messageId: number;
  }) {
    try {
      const { candidate } = await AutomationService.selectTopicCandidate(params.sessionId, params.rank);

      await TelegramBotService.answerCallbackQuery({
        callbackQueryId: params.callbackQueryId,
        text: "Topic selected. Draft generation started.",
      });

      await TelegramBotService.editMessageText({
        chatId: params.chatId,
        messageId: params.messageId,
        text: `Generating draft for:\n\n${candidate.title}`,
      });

      void AutomationService.generateDraftForSession(params.sessionId)
        .then(async () => {
          await AutomationService.showCategorySelection({
            sessionId: params.sessionId,
            chatId: params.chatId,
            messageId: params.messageId,
            page: 0,
          });
        })
        .catch(async (err) => {
          await TelegramBotService.editMessageText({
            chatId: params.chatId,
            messageId: params.messageId,
            text: `Draft generation failed.\n\n${err instanceof Error ? err.message : "Unknown error"}`,
          });
        });
    } catch (err) {
      await TelegramBotService.answerCallbackQuery({
        callbackQueryId: params.callbackQueryId,
        text: err instanceof Error ? err.message : "Unable to select topic",
        showAlert: true,
      });
    }
  }

  private static async handleTelegramSessionSkip(params: {
    sessionId: string;
    callbackQueryId: string;
    chatId: string | number;
    messageId: number;
  }) {
    const session = await AutomationService.markSessionCancelled(params.sessionId);
    if (!session) {
      await TelegramBotService.answerCallbackQuery({
        callbackQueryId: params.callbackQueryId,
        text: "This session is no longer pending.",
        showAlert: true,
      });
      return;
    }

    await TelegramBotService.answerCallbackQuery({
      callbackQueryId: params.callbackQueryId,
      text: "Topic batch skipped.",
    });

    await TelegramBotService.editMessageText({
      chatId: params.chatId,
      messageId: params.messageId,
      text: `RSS topic batch skipped.\n\nSession: ${params.sessionId}`,
    });
  }

  private static async handleSecondaryCategorySkip(params: {
    sessionId: string;
    callbackQueryId: string;
    chatId: string | number;
    messageId: number;
  }) {
    const { draft } = await AutomationService.getSessionWithDraft(params.sessionId);
    if (!draft) {
      throw new Error("Draft not found for this session");
    }

    await db.transaction(async (tx) => {
      // If a secondary category was already selected, clear it.
      await tx
        .delete(blogPostSecondaryCategories)
        .where(eq(blogPostSecondaryCategories.postId, draft.id));

      await tx
        .update(automationTopicSessions)
        .set({
          assignedSecondaryCategoryId: null,
          status: "tagging",
          workflowStep: "tag_selection",
          updatedAt: new Date(),
        })
        .where(eq(automationTopicSessions.id, params.sessionId));
    });

    await TelegramBotService.answerCallbackQuery({
      callbackQueryId: params.callbackQueryId,
      text: "Secondary category skipped.",
    });

    await AutomationService.showTagSelection({
      sessionId: params.sessionId,
      chatId: params.chatId,
      messageId: params.messageId,
      page: 0,
    });
  }

  static async handleTelegramWebhook(update: TelegramUpdate) {
    const dedupKey = getTelegramDedupKey(update as unknown);
    if (dedupKey) {
      if (telegramWebhookDedup.has(dedupKey)) {
        return { handled: true };
      }
      telegramWebhookDedup.set(dedupKey, true);
    }

    try {
    if ("message" in update) {
      const chatId = String(update.message.chat.id);
      if (!update.message.text) {
        return { handled: true, kind: "message" };
      }

      const telegramConfig = await TelegramBotService.getConfig();

      if (!telegramConfig.allowedChatId) {
        await TelegramBotService.sendMessage({
          chatId,
          text: `Telegram bot connected. Your chat id is ${chatId}. Save this chat id in Platform Settings -> Integrations -> Telegram Automation to enable automation actions.`,
        });
        return { handled: true, kind: "message" };
      }

      if (!(await TelegramBotService.isAllowedChat(chatId))) {
        await TelegramBotService.sendMessage({
          chatId,
          text: "This bot is restricted to the configured admin account.",
        });
        return { handled: true, kind: "message" };
      }

      if (update.message.text.trim().toLowerCase() === "/start") {
        await TelegramBotService.sendMessage({
          chatId,
          text: "RSS automation bot is connected.\n\nCommands:\n/sync - fetch latest RSS items\n/topics - browse synced topics and generate drafts",
          replyMarkup: {
            inline_keyboard: [[
              { text: "Sync RSS", callback_data: "rsscmd:sync" },
              { text: "Browse topics", callback_data: "rsscmd:topics" },
            ]],
          },
        });
      }

      const normalizedText = update.message.text.trim().toLowerCase();
      const wantsSync =
        normalizedText === "/sync" ||
        normalizedText.startsWith("/sync ") ||
        normalizedText === "sync";

      if (wantsSync) {
        await TelegramBotService.sendMessage({
          chatId,
          text: "Syncing RSS feeds...",
        });

        const result = await AutomationService.syncAllFeeds();
        await TelegramBotService.sendMessage({
          chatId,
          text: `RSS sync completed.\n\nSources: ${result.sourceCount}\nNew items: ${result.newItems}`,
        });
      }

      const wantsTopics =
        normalizedText === "/topics" ||
        normalizedText.startsWith("/topics ") ||
        normalizedText === "topics" ||
        normalizedText === "fetch topics" ||
        normalizedText === "fetch topic";

      if (wantsTopics) {
        const parts = update.message.text.trim().split(/\s+/);
        const requestedPage = parts.length >= 2 ? Number.parseInt(parts[1] || "", 10) : NaN;
        const page = Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage - 1 : 0;
        await AutomationService.showTopics({ chatId, page });
      }

      return { handled: true, kind: "message" };
    }

    if ("callback_query" in update) {
      const callback = update.callback_query;
      const callbackData = callback.data || "";
      const message = callback.message;
      const chatId = String(message?.chat.id || "");

      if (!message) {
        await TelegramBotService.answerCallbackQuery({
          callbackQueryId: callback.id,
          text: "Missing Telegram message context.",
          showAlert: true,
        });
        return { handled: true, kind: "callback" };
      }

      if (!(await TelegramBotService.isAllowedChat(chatId))) {
        await TelegramBotService.answerCallbackQuery({
          callbackQueryId: callback.id,
          text: "Unauthorized Telegram account.",
          showAlert: true,
        });
        return { handled: true, kind: "callback" };
      }

      if (callbackData === "rsscmd:topics") {
        await TelegramBotService.answerCallbackQuery({
          callbackQueryId: callback.id,
          text: "Loading topics...",
        });

        await AutomationService.showTopics({
          chatId,
          page: 0,
        });
        return { handled: true, kind: "callback" };
      }

      if (callbackData === "rsscmd:sync") {
        await TelegramBotService.answerCallbackQuery({
          callbackQueryId: callback.id,
          text: "Syncing RSS...",
        });

        const result = await AutomationService.syncAllFeeds();

        await TelegramBotService.sendMessage({
          chatId,
          text: `RSS sync completed.\n\nSources: ${result.sourceCount}\nNew items: ${result.newItems}`,
        });

        // If user clicked the sync button from the topics list, refresh that message.
        if (message?.message_id) {
          await AutomationService.showTopics({ chatId, messageId: message.message_id, page: 0 });
        }

        return { handled: true, kind: "callback" };
      }

      const topicsNavMatch = callbackData.match(/^rsstopicsnav:(\d+)$/i);
      if (topicsNavMatch) {
        try {
          await TelegramBotService.answerCallbackQuery({
            callbackQueryId: callback.id,
            text: "Loading topics...",
          });

          await AutomationService.showTopics({
            chatId,
            messageId: message.message_id,
            page: Number(topicsNavMatch[1]),
          });
        } catch (err) {
          await TelegramBotService.answerCallbackQuery({
            callbackQueryId: callback.id,
            text: err instanceof Error ? err.message : "Unable to load topics",
            showAlert: true,
          });
        }
        return { handled: true, kind: "callback" };
      }

      const topicSetMatch = callbackData.match(
        /^rsstopicset:(\d+):([0-9a-f-]{36}):(unprocessed|ignored)$/i,
      );
      if (topicSetMatch) {
        try {
          const page = Number(topicSetMatch[1]);
          const feedItemId = topicSetMatch[2];
          const nextStatus = topicSetMatch[3] as "unprocessed" | "ignored";

          await db
            .update(feedItems)
            .set({ processingStatus: nextStatus })
            .where(eq(feedItems.id, feedItemId));

          await TelegramBotService.answerCallbackQuery({
            callbackQueryId: callback.id,
            text: nextStatus === "ignored" ? "Ignored." : "Restored.",
          });

          await AutomationService.showTopics({
            chatId,
            messageId: message.message_id,
            page,
          });
        } catch (err) {
          await TelegramBotService.answerCallbackQuery({
            callbackQueryId: callback.id,
            text: err instanceof Error ? err.message : "Unable to update item",
            showAlert: true,
          });
        }
        return { handled: true, kind: "callback" };
      }

      const topicPickMatch = callbackData.match(/^rsstopicpick:([0-9a-f-]{36})$/i);
      if (topicPickMatch) {
        await AutomationService.handleTelegramTopicPicked({
          feedItemId: topicPickMatch[1],
          callbackQueryId: callback.id,
          chatId,
          messageId: message.message_id,
        });
        return { handled: true, kind: "callback" };
      }

      const pickMatch = callbackData.match(/^rsspick:([0-9a-f-]{36}):(\d{1,2})$/i);
      if (pickMatch) {
        await AutomationService.handleTelegramCandidatePicked({
          sessionId: pickMatch[1],
          rank: Number(pickMatch[2]),
          callbackQueryId: callback.id,
          chatId,
          messageId: message.message_id,
        });
        return { handled: true, kind: "callback" };
      }

      const skipMatch = callbackData.match(/^rssskip:([0-9a-f-]{36})$/i);
      if (skipMatch) {
        await AutomationService.handleTelegramSessionSkip({
          sessionId: skipMatch[1],
          callbackQueryId: callback.id,
          chatId,
          messageId: message.message_id,
        });
        return { handled: true, kind: "callback" };
      }

      const categoryPickMatch = callbackData.match(/^rsscat:([0-9a-f-]{36}):(\d+):(\d+)$/i);
      if (categoryPickMatch) {
        try {
          await TelegramBotService.answerCallbackQuery({
            callbackQueryId: callback.id,
            text: "Primary category selected. Choose secondary category (optional).",
          });
          await AutomationService.assignCategoryFromPage({
            sessionId: categoryPickMatch[1],
            page: Number(categoryPickMatch[2]),
            index: Number(categoryPickMatch[3]),
          });
          await AutomationService.showSecondaryCategorySelection({
            sessionId: categoryPickMatch[1],
            chatId,
            messageId: message.message_id,
            page: 0,
          });
        } catch (err) {
          await TelegramBotService.answerCallbackQuery({
            callbackQueryId: callback.id,
            text: err instanceof Error ? err.message : "Unable to assign category",
            showAlert: true,
          });
        }
        return { handled: true, kind: "callback" };
      }

      const categoryNavMatch = callbackData.match(/^rsscatnav:([0-9a-f-]{36}):(\d+)$/i);
      if (categoryNavMatch) {
        try {
          await TelegramBotService.answerCallbackQuery({
            callbackQueryId: callback.id,
            text: "Loading categories...",
          });
          await AutomationService.showCategorySelection({
            sessionId: categoryNavMatch[1],
            chatId,
            messageId: message.message_id,
            page: Number(categoryNavMatch[2]),
          });
        } catch (err) {
          await TelegramBotService.answerCallbackQuery({
            callbackQueryId: callback.id,
            text: err instanceof Error ? err.message : "Unable to load categories",
            showAlert: true,
          });
        }
        return { handled: true, kind: "callback" };
      }

      const secondaryCategoryPickMatch = callbackData.match(/^rsscat2:([0-9a-f-]{36}):(\d+):(\d+)$/i);
      if (secondaryCategoryPickMatch) {
        try {
          await TelegramBotService.answerCallbackQuery({
            callbackQueryId: callback.id,
            text: "Secondary category selected.",
          });
          await AutomationService.assignCategoryFromPage({
            sessionId: secondaryCategoryPickMatch[1],
            page: Number(secondaryCategoryPickMatch[2]),
            index: Number(secondaryCategoryPickMatch[3]),
            isSecondary: true,
          });
          await db
            .update(automationTopicSessions)
            .set({
              status: "tagging",
              workflowStep: "tag_selection",
              updatedAt: new Date(),
            })
            .where(eq(automationTopicSessions.id, secondaryCategoryPickMatch[1]));

          await AutomationService.showTagSelection({
            sessionId: secondaryCategoryPickMatch[1],
            chatId,
            messageId: message.message_id,
            page: 0,
          });
        } catch (err) {
          await TelegramBotService.answerCallbackQuery({
            callbackQueryId: callback.id,
            text: err instanceof Error ? err.message : "Unable to assign secondary category",
            showAlert: true,
          });
        }
        return { handled: true, kind: "callback" };
      }

      const secondaryCategoryNavMatch = callbackData.match(/^rsscat2nav:([0-9a-f-]{36}):(\d+)$/i);
      if (secondaryCategoryNavMatch) {
        try {
          await TelegramBotService.answerCallbackQuery({
            callbackQueryId: callback.id,
            text: "Loading categories...",
          });
          await AutomationService.showSecondaryCategorySelection({
            sessionId: secondaryCategoryNavMatch[1],
            chatId,
            messageId: message.message_id,
            page: Number(secondaryCategoryNavMatch[2]),
          });
        } catch (err) {
          await TelegramBotService.answerCallbackQuery({
            callbackQueryId: callback.id,
            text: err instanceof Error ? err.message : "Unable to load categories",
            showAlert: true,
          });
        }
        return { handled: true, kind: "callback" };
      }

      const categorySkipMatch = callbackData.match(/^rsscatskip:([0-9a-f-]{36})$/i);
      if (categorySkipMatch) {
        await AutomationService.handleSecondaryCategorySkip({
          sessionId: categorySkipMatch[1],
          callbackQueryId: callback.id,
          chatId,
          messageId: message.message_id,
        });
        return { handled: true, kind: "callback" };
      }

      const categoryBackMatch = callbackData.match(/^rsscatback:([0-9a-f-]{36})$/i);
      if (categoryBackMatch) {
        try {
          await TelegramBotService.answerCallbackQuery({
            callbackQueryId: callback.id,
            text: "Back to primary categories...",
          });

          await AutomationService.showCategorySelection({
            sessionId: categoryBackMatch[1],
            chatId,
            messageId: message.message_id,
            page: 0,
            isSecondary: false,
          });
        } catch (err) {
          await TelegramBotService.answerCallbackQuery({
            callbackQueryId: callback.id,
            text: err instanceof Error ? err.message : "Unable to go back",
            showAlert: true,
          });
        }
        return { handled: true, kind: "callback" };
      }

      const tagToggleMatch = callbackData.match(/^rsstag:([0-9a-f-]{36}):(\d+):(\d+)$/i);
      if (tagToggleMatch) {
        try {
          await AutomationService.toggleTagFromPage({
            sessionId: tagToggleMatch[1],
            page: Number(tagToggleMatch[2]),
            index: Number(tagToggleMatch[3]),
          });
          await TelegramBotService.answerCallbackQuery({
            callbackQueryId: callback.id,
            text: "Tag selection updated.",
          });
          await AutomationService.showTagSelection({
            sessionId: tagToggleMatch[1],
            chatId,
            messageId: message.message_id,
            page: Number(tagToggleMatch[2]),
          });
        } catch (err) {
          await TelegramBotService.answerCallbackQuery({
            callbackQueryId: callback.id,
            text: err instanceof Error ? err.message : "Unable to update tag selection",
            showAlert: true,
          });
        }
        return { handled: true, kind: "callback" };
      }

      const tagNavMatch = callbackData.match(/^rsstagnav:([0-9a-f-]{36}):(\d+)$/i);
      if (tagNavMatch) {
        try {
          await TelegramBotService.answerCallbackQuery({
            callbackQueryId: callback.id,
            text: "Loading tags...",
          });
          await AutomationService.showTagSelection({
            sessionId: tagNavMatch[1],
            chatId,
            messageId: message.message_id,
            page: Number(tagNavMatch[2]),
          });
        } catch (err) {
          await TelegramBotService.answerCallbackQuery({
            callbackQueryId: callback.id,
            text: err instanceof Error ? err.message : "Unable to load tags",
            showAlert: true,
          });
        }
        return { handled: true, kind: "callback" };
      }

      const tagSaveMatch = callbackData.match(/^rsstagsave:([0-9a-f-]{36})$/i);
      if (tagSaveMatch) {
        try {
          await AutomationService.finalizeTagAssignments(tagSaveMatch[1]);
          await TelegramBotService.answerCallbackQuery({
            callbackQueryId: callback.id,
            text: "Draft assignment completed.",
          });
          await AutomationService.showPublishAction({
            sessionId: tagSaveMatch[1],
            chatId,
            messageId: message.message_id,
          });
        } catch (err) {
          await TelegramBotService.answerCallbackQuery({
            callbackQueryId: callback.id,
            text: err instanceof Error ? err.message : "Unable to finalize draft assignments",
            showAlert: true,
          });
        }
        return { handled: true, kind: "callback" };
      }

      const tagSkipMatch = callbackData.match(/^rsstagskip:([0-9a-f-]{36})$/i);
      if (tagSkipMatch) {
        try {
          const [session] = await db
            .update(automationTopicSessions)
            .set({ selectedTagIds: [], updatedAt: new Date() })
            .where(eq(automationTopicSessions.id, tagSkipMatch[1]))
            .returning();

          if (!session) {
            throw new Error("Topic session not found");
          }

          await AutomationService.finalizeTagAssignments(tagSkipMatch[1]);
          await TelegramBotService.answerCallbackQuery({
            callbackQueryId: callback.id,
            text: "Tag selection skipped.",
          });
          await AutomationService.showPublishAction({
            sessionId: tagSkipMatch[1],
            chatId,
            messageId: message.message_id,
          });
        } catch (err) {
          await TelegramBotService.answerCallbackQuery({
            callbackQueryId: callback.id,
            text: err instanceof Error ? err.message : "Unable to skip tags",
            showAlert: true,
          });
        }
        return { handled: true, kind: "callback" };
      }

      const publishMatch = callbackData.match(/^rsspublish:([0-9a-f-]{36}):(publish|keep_draft)$/i);
      if (publishMatch) {
        try {
          const sessionId = publishMatch[1];
          const action = publishMatch[2] as "publish" | "keep_draft";

          const [session] = await db
            .select({ generatedPostId: automationTopicSessions.generatedPostId })
            .from(automationTopicSessions)
            .where(eq(automationTopicSessions.id, sessionId))
            .limit(1);

          if (!session || !session.generatedPostId) {
            throw new Error("Session or draft not found");
          }

          if (action === "publish") {
            await db
              .update(blogPosts)
              .set({
                status: "published",
                publishedAt: new Date(),
                updatedAt: new Date(),
              })
              .where(eq(blogPosts.id, session.generatedPostId));
          }

          if (action === "publish") {
            // Best-effort: notify Next.js to refresh sitemap/rss and hub pages.
            const [detail] = await db
              .select({
                slug: blogPosts.slug,
                categorySlug: blogCategories.slug,
              })
              .from(blogPosts)
              .leftJoin(blogCategories, eq(blogPosts.categoryId, blogCategories.id))
              .where(eq(blogPosts.id, session.generatedPostId))
              .limit(1);

            const tags = await db
              .select({ slug: blogTags.slug })
              .from(blogPostTags)
              .innerJoin(blogTags, eq(blogPostTags.tagId, blogTags.id))
              .where(eq(blogPostTags.postId, session.generatedPostId));

            const secondaryCategories = await db
              .select({ slug: blogCategories.slug })
              .from(blogPostSecondaryCategories)
              .innerJoin(blogCategories, eq(blogPostSecondaryCategories.categoryId, blogCategories.id))
              .where(eq(blogPostSecondaryCategories.postId, session.generatedPostId));

            const paths = [
              "/blog",
              "/sitemap.xml",
              "/rss.xml",
              detail?.slug ? `/blog/${detail.slug}` : null,
              detail?.categorySlug ? `/categories/${detail.categorySlug}` : null,
              ...secondaryCategories.map((c) => (c.slug ? `/categories/${c.slug}` : null)),
              ...tags.map((t) => (t.slug ? `/tags/${t.slug}` : null)),
            ].filter(Boolean) as string[];

            try {
              await webRevalidatePaths(paths);
            } catch {
              // Ignore: SEO freshness is best-effort.
            }
          }

          await db
            .update(automationTopicSessions)
            .set({
              status: "completed",
              workflowStep: "completed",
              updatedAt: new Date(),
            })
            .where(eq(automationTopicSessions.id, sessionId));

          const [draft] = await db
            .select({ title: blogPosts.title })
            .from(blogPosts)
            .where(eq(blogPosts.id, session.generatedPostId))
            .limit(1);

          await TelegramBotService.answerCallbackQuery({
            callbackQueryId: callback.id,
            text: action === "publish" ? "Post published!" : "Saved as draft",
          });

          await TelegramBotService.editMessageText({
            chatId,
            messageId: message.message_id,
            text: `Draft ${action === "publish" ? "published" : "saved"} successfully.\n\nTitle: ${draft?.title || "N/A"}\nPost ID: ${session.generatedPostId}\nStatus: ${action === "publish" ? "published" : "draft"}\n\nYou can view it in the platform admin panel.`,
          });
        } catch (err) {
          await TelegramBotService.answerCallbackQuery({
            callbackQueryId: callback.id,
            text: err instanceof Error ? err.message : "Unable to update post status",
            showAlert: true,
          });
        }
        return { handled: true, kind: "callback" };
      }

      await TelegramBotService.answerCallbackQuery({
        callbackQueryId: callback.id,
        text: "Unknown action.",
        showAlert: true,
      });
      return { handled: true, kind: "callback" };
    }

    return { handled: false };
    } catch (err) {
      if (dedupKey) {
        telegramWebhookDedup.delete(dedupKey);
      }
      throw err;
    }
  }

  static async expireOldSessions() {
    await db
      .update(automationTopicSessions)
      .set({ status: "expired", updatedAt: new Date() })
      .where(
        and(
          eq(automationTopicSessions.status, "pending"),
          lte(automationTopicSessions.expiresAt, new Date()),
        )
      );
  }
}
