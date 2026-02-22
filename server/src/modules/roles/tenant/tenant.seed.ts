import { eq } from "drizzle-orm";
import { db } from "../../../db/index.js";
import { logger } from "../../../core/logger.js";
import { tenantRoles, TENANT_ROLES } from "./tenant.schema.js";

const DEFAULT_TENANT_ROLES = [
  { name: "Owner", slug: TENANT_ROLES.OWNER, description: "Full tenant access", permissions: [], isSystem: true },
  { name: "Admin", slug: TENANT_ROLES.ADMIN, description: "Tenant administration", permissions: [], isSystem: true },
  { name: "Manager", slug: TENANT_ROLES.MANAGER, description: "Operational management", permissions: [], isSystem: true },
  { name: "Member", slug: TENANT_ROLES.MEMBER, description: "Basic access", permissions: [], isSystem: true },
];

export async function seedTenantRoles(): Promise<void> {
  logger.info("[Seed] Seeding tenant roles...");
  for (const role of DEFAULT_TENANT_ROLES) {
    const existing = await db.select().from(tenantRoles).where(eq(tenantRoles.slug, role.slug)).limit(1);
    if (existing.length === 0) {
      await db.insert(tenantRoles).values(role);
      logger.info(`[Seed] Created tenant role: ${role.name}`);
    }
  }
}
