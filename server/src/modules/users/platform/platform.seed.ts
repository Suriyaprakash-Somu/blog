import { eq } from "drizzle-orm";
import { db } from "../../../db/index.js";
import { logger } from "../../../core/logger.js";
import { platformUser, platformUserAccount } from "./platform.schema.js";
import { platformRoles, PLATFORM_ROLES } from "../../roles/platform/platform.schema.js";
import { hash } from "bcryptjs";
import { env } from "../../../common/env.js";

const DEFAULT_OWNER = {
  name: "Owner",
  email: "owner@gmail.com",
  password: "Password12345678",
};

export async function seedPlatformOwner() {
  logger.info("[Seed] Checking for Platform Owner...");

  // 1. Get the Owner role ID
  const ownerRole = await db.query.platformRoles.findFirst({
    where: eq(platformRoles.slug, PLATFORM_ROLES.OWNER),
  });

  if (!ownerRole) {
    logger.warn("[Seed] Owner role not found! Run role seeds first.");
    return;
  }

  // 2. Check by email
  const existingOwner = await db.query.platformUser.findFirst({
    where: eq(platformUser.email, DEFAULT_OWNER.email),
  });

  if (!existingOwner) {
    logger.info("[Seed] No Platform Owner found. Creating default owner...");
    
    // Hash password
    const hashedPassword = await hash(DEFAULT_OWNER.password, env.BCRYPT_ROUNDS);

    // Create User
    const [user] = await db.insert(platformUser).values({
      name: DEFAULT_OWNER.name,
      email: DEFAULT_OWNER.email,
      roleId: ownerRole.id,
      emailVerified: true,
    }).returning();

    // Create Account (Credential)
    await db.insert(platformUserAccount).values({
      userId: user.id,
      accountId: user.id,
      providerId: "credential",
      password: hashedPassword,
    });

    logger.info(`[Seed] Created Platform Owner: ${DEFAULT_OWNER.email}`);
  }
}
