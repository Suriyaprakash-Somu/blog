import { eq } from "drizzle-orm";
import { db } from "../../../db/index.js";
import { logger } from "../../../core/logger.js";
import { platformRoles, PLATFORM_ROLES } from "./platform.schema.js";

const DEFAULT_PLATFORM_ROLES = [
  { name: "Owner", slug: PLATFORM_ROLES.OWNER, description: "Full platform access", permissions: [], isSystem: true },
  { name: "Admin", slug: PLATFORM_ROLES.ADMIN, description: "Platform administration", permissions: [], isSystem: true },
  { name: "Manager", slug: PLATFORM_ROLES.MANAGER, description: "Platform management", permissions: [], isSystem: true },
  { name: "Member", slug: PLATFORM_ROLES.MEMBER, description: "Basic access", permissions: [], isSystem: true },
];

export async function seedPlatformRoles(): Promise<void> {
  logger.info("[Seed] Seeding platform roles...");
  for (const role of DEFAULT_PLATFORM_ROLES) {
    const existing = await db.select().from(platformRoles).where(eq(platformRoles.slug, role.slug)).limit(1);
    if (existing.length === 0) {
      await db.insert(platformRoles).values(role);
      logger.info(`[Seed] Created platform role: ${role.name}`);
    }
  }
}
