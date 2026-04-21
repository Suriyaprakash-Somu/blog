import { eq } from "drizzle-orm";
import { db } from "../../../db/index.js";
import { platformSettings } from "../../../db/schema/settings.js";

export interface TelegramAutomationConfig {
  botToken?: string;
  allowedChatId?: string;
  webhookSecret?: string;
}

export interface TelegramCallbackQueryUpdate {
  callback_query: {
    id: string;
    data?: string;
    message?: {
      message_id: number;
      chat: { id: number | string };
      text?: string;
    };
    from: {
      id: number;
      username?: string;
    };
  };
}

export interface TelegramMessageUpdate {
  message: {
    message_id: number;
    text?: string;
    chat: { id: number | string };
    from?: {
      id: number;
      username?: string;
    };
  };
}

export type TelegramUpdate = TelegramCallbackQueryUpdate | TelegramMessageUpdate;

async function getTelegramAutomationConfig(): Promise<TelegramAutomationConfig> {
  const [row] = await db
    .select({ value: platformSettings.value })
    .from(platformSettings)
    .where(eq(platformSettings.key, "telegram_automation"))
    .limit(1);

  return (row?.value ?? {}) as TelegramAutomationConfig;
}

async function getTelegramApiUrl(method: string) {
  const config = await getTelegramAutomationConfig();
  if (!config.botToken) {
    throw new Error("Telegram bot token is not configured in platform settings");
  }

  return `https://api.telegram.org/bot${config.botToken}/${method}`;
}

async function callTelegram<T>(method: string, payload: Record<string, unknown>): Promise<T> {
  const response = await fetch(await getTelegramApiUrl(method), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const json = (await response.json().catch(() => null)) as
    | { ok: boolean; result?: T; description?: string }
    | null;

  if (!response.ok || !json?.ok) {
    throw new Error(json?.description || `Telegram API request failed for ${method}`);
  }

  return json.result as T;
}

export class TelegramBotService {
  static async getConfig() {
    return getTelegramAutomationConfig();
  }

  static async getAllowedChatId() {
    const config = await getTelegramAutomationConfig();
    if (!config.allowedChatId) {
      throw new Error("Telegram allowed chat id is not configured in platform settings");
    }

    return config.allowedChatId;
  }

  static async isAllowedChat(chatId: string | number) {
    const config = await getTelegramAutomationConfig();
    return Boolean(config.allowedChatId) && String(chatId) === String(config.allowedChatId);
  }

  static async verifyWebhookSecret(secret: string) {
    const config = await getTelegramAutomationConfig();
    return Boolean(config.webhookSecret) && secret === config.webhookSecret;
  }

  static async sendMessage(params: {
    chatId: string | number;
    text: string;
    replyMarkup?: Record<string, unknown>;
  }) {
    return callTelegram<{ message_id: number }>("sendMessage", {
      chat_id: String(params.chatId),
      text: params.text,
      reply_markup: params.replyMarkup,
      disable_web_page_preview: true,
    });
  }

  static async editMessageText(params: {
    chatId: string | number;
    messageId: number;
    text: string;
    replyMarkup?: Record<string, unknown>;
  }) {
    return callTelegram("editMessageText", {
      chat_id: String(params.chatId),
      message_id: params.messageId,
      text: params.text,
      reply_markup: params.replyMarkup,
      disable_web_page_preview: true,
    });
  }

  static async answerCallbackQuery(params: {
    callbackQueryId: string;
    text?: string;
    showAlert?: boolean;
  }) {
    try {
      return await callTelegram("answerCallbackQuery", {
        callback_query_id: params.callbackQueryId,
        text: params.text,
        show_alert: params.showAlert ?? false,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);

      // Callback queries have a short response window. If we miss it, don't fail the whole webhook.
      if (
        message.includes("query is too old") ||
        message.includes("response timeout expired") ||
        message.includes("query ID is invalid")
      ) {
        return null;
      }

      throw err;
    }
  }
}
