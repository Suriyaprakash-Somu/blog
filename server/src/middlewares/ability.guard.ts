import type { MongoAbility } from "@casl/ability";
import type { FastifyReply, FastifyRequest } from "fastify";
import { buildPlatformAbility } from "../modules/rbac/platform/abilities.js";
import { ACTIONS, type Action, SUBJECTS, type Subject } from "../modules/rbac/public/permissions.js";
import { buildTenantAbility } from "../modules/rbac/tenant/abilities.js";
import type { PlatformRole } from "../modules/roles/platform/platform.schema.js";
import type { TenantRole } from "../modules/roles/tenant/tenant.schema.js";
import { getPlatformUserFromSession } from "./auth.guard.js";

const ACTION_VALUES = new Set<string>(Object.values(ACTIONS));
const SUBJECT_VALUES = new Set<string>(Object.values(SUBJECTS));

function assertValidRequirement(action: Action, subject: Subject) {
  if (!ACTION_VALUES.has(action)) {
    throw new Error(`Invalid RBAC action: ${String(action)}`);
  }
  if (!SUBJECT_VALUES.has(subject)) {
    throw new Error(`Invalid RBAC subject: ${String(subject)}`);
  }
}

export interface AbilityRequirement {
  action: Action;
  subject: Subject;
}

export interface PermissionExpression {
  anyOf?: AbilityRequirement[];
  allOf?: AbilityRequirement[];
}

function evaluatePermissionExpression(
  ability: MongoAbility<[Action, Subject]>,
  expression: PermissionExpression,
): boolean {
  if (ability.can(ACTIONS.MANAGE, SUBJECTS.ALL)) {
    return true;
  }

  const hasAny = expression.anyOf && expression.anyOf.length > 0;
  const hasAll = expression.allOf && expression.allOf.length > 0;

  if (hasAny && hasAll) {
    return (
      expression.anyOf!.some(({ action, subject }) => ability.can(action, subject)) &&
      expression.allOf!.every(({ action, subject }) => ability.can(action, subject))
    );
  }

  if (hasAny) {
    return expression.anyOf!.some(({ action, subject }) => ability.can(action, subject));
  }

  if (hasAll) {
    return expression.allOf!.every(({ action, subject }) => ability.can(action, subject));
  }

  return false;
}

export function platformAbilityGuard(action: Action, subject: Subject) {
  assertValidRequirement(action, subject);
  return async (request: FastifyRequest, reply: FastifyReply) => {
    let platformUser: typeof request.platformUser | null | undefined = request.platformUser;

    if (!platformUser) {
      const resolved = await getPlatformUserFromSession(request);
      if (resolved) {
        request.platformUser = resolved;
        platformUser = resolved;
      } else {
        platformUser = null;
      }
    }

    if (!platformUser?.role) {
      return reply.status(401).send({ error: "Unauthorized" });
    }

    const ability = buildPlatformAbility(platformUser.role.slug as PlatformRole);
    const allowed = ability.can(action, subject) || ability.can(ACTIONS.MANAGE, SUBJECTS.ALL);

    if (!allowed) {
      return reply.status(403).send({ error: "Forbidden" });
    }
  };
}

export function tenantAbilityGuard(action: Action, subject: Subject) {
  assertValidRequirement(action, subject);
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const tenantSession = request.tenantSession;

    if (!tenantSession?.role) {
      return reply.status(401).send({ error: "Unauthorized" });
    }

    const ability = buildTenantAbility(tenantSession.role.slug as TenantRole);
    const allowed = ability.can(action, subject) || ability.can(ACTIONS.MANAGE, SUBJECTS.ALL);

    if (!allowed) {
      return reply.status(403).send({ error: "Forbidden" });
    }
  };
}

export function platformAnyAbilityGuard(requirements: AbilityRequirement[]) {
  for (const r of requirements) {
    assertValidRequirement(r.action, r.subject);
  }
  return async (request: FastifyRequest, reply: FastifyReply) => {
    let platformUser: typeof request.platformUser | null | undefined = request.platformUser;

    if (!platformUser) {
      const resolved = await getPlatformUserFromSession(request);
      if (resolved) {
        request.platformUser = resolved;
        platformUser = resolved;
      } else {
        platformUser = null;
      }
    }

    if (!platformUser?.role) {
      return reply.status(401).send({ error: "Unauthorized" });
    }

    const ability = buildPlatformAbility(platformUser.role.slug as PlatformRole);
    const allowed =
      ability.can(ACTIONS.MANAGE, SUBJECTS.ALL) ||
      requirements.some(({ action, subject }) => ability.can(action, subject));

    if (!allowed) {
      return reply.status(403).send({ error: "Forbidden" });
    }
  };
}

export function tenantAnyAbilityGuard(requirements: AbilityRequirement[]) {
  for (const r of requirements) {
    assertValidRequirement(r.action, r.subject);
  }
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const tenantSession = request.tenantSession;

    if (!tenantSession?.role) {
      return reply.status(401).send({ error: "Unauthorized" });
    }

    const ability = buildTenantAbility(tenantSession.role.slug as TenantRole);
    const allowed =
      ability.can(ACTIONS.MANAGE, SUBJECTS.ALL) ||
      requirements.some(({ action, subject }) => ability.can(action, subject));

    if (!allowed) {
      return reply.status(403).send({ error: "Forbidden" });
    }
  };
}

export function platformPermissionGuard(expression: PermissionExpression) {
  for (const r of expression.anyOf ?? []) {
    assertValidRequirement(r.action, r.subject);
  }
  for (const r of expression.allOf ?? []) {
    assertValidRequirement(r.action, r.subject);
  }
  return async (request: FastifyRequest, reply: FastifyReply) => {
    let platformUser: typeof request.platformUser | null | undefined = request.platformUser;

    if (!platformUser) {
      const resolved = await getPlatformUserFromSession(request);
      if (resolved) {
        request.platformUser = resolved;
        platformUser = resolved;
      } else {
        platformUser = null;
      }
    }

    if (!platformUser?.role) {
      return reply.status(401).send({ error: "Unauthorized" });
    }

    const ability = buildPlatformAbility(platformUser.role.slug as PlatformRole);
    const allowed = evaluatePermissionExpression(ability, expression);

    if (!allowed) {
      return reply.status(403).send({ error: "Forbidden" });
    }
  };
}

export function tenantPermissionGuard(expression: PermissionExpression) {
  for (const r of expression.anyOf ?? []) {
    assertValidRequirement(r.action, r.subject);
  }
  for (const r of expression.allOf ?? []) {
    assertValidRequirement(r.action, r.subject);
  }
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const tenantSession = request.tenantSession;

    if (!tenantSession?.role) {
      return reply.status(401).send({ error: "Unauthorized" });
    }

    const ability = buildTenantAbility(tenantSession.role.slug as TenantRole);
    const allowed = evaluatePermissionExpression(ability, expression);

    if (!allowed) {
      return reply.status(403).send({ error: "Forbidden" });
    }
  };
}
