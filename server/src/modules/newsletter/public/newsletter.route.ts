import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { db } from "../../../db/index.js";
import { newsletterSubscribers } from "../newsletter.schema.js";

const subscribeSchema = z.object({
    email: z.string().email(),
});

export const publicNewsletterRoutes: FastifyPluginAsync = async (fastify) => {
    fastify.post(
        "/subscribe",
        async (request, reply) => {
            const parsed = subscribeSchema.safeParse(request.body);
            if (!parsed.success) {
                return reply.status(400).send({ success: false, message: "Invalid email" });
            }

            const { email } = parsed.data;

            try {
                await db
                    .insert(newsletterSubscribers)
                    .values({ email })
                    .onConflictDoNothing({ target: newsletterSubscribers.email });

                return { success: true, message: "Successfully subscribed to the waitlist." };
            } catch (error) {
                fastify.log.error(error);
                return reply.status(500).send({ success: false, message: "Failed to subscribe" });
            }
        }
    );
};
