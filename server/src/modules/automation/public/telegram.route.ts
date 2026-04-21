import type { FastifyPluginAsync } from "fastify";
import { AutomationService } from "../services/automation.service.js";
import { TelegramBotService } from "../services/telegramBot.service.js";

export const publicAutomationRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post("/telegram/webhook/:secret", async (request, reply) => {
    const { secret } = request.params as { secret: string };

    if (!(await TelegramBotService.verifyWebhookSecret(secret))) {
      return reply.status(404).send({ success: false });
    }

    try {
      await AutomationService.handleTelegramWebhook(request.body as never);
      return { success: true };
    } catch (err) {
      request.log.error({ err }, "Telegram webhook handling failed");
      return reply.status(500).send({
        success: false,
        error: { message: err instanceof Error ? err.message : "Telegram webhook failed" },
      });
    }
  });
};
