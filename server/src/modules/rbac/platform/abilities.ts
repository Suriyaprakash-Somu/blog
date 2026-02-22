import {
  AbilityBuilder,
  createMongoAbility,
  type MongoAbility,
} from "@casl/ability";
import { ACTIONS, SUBJECTS, type Action, type Subject } from "../public/permissions.js";
import { PLATFORM_ROLES, type PlatformRole } from "../../roles/platform/platform.schema.js";

export type PlatformAbility = MongoAbility<[Action, Subject]>;

/**
 * Build platform admin abilities
 */
export function buildPlatformAbility(role: PlatformRole): PlatformAbility {
  const { can, build } = new AbilityBuilder<PlatformAbility>(createMongoAbility);

  switch (role) {
    case PLATFORM_ROLES.OWNER:
      can(ACTIONS.MANAGE, SUBJECTS.ALL);
      can(ACTIONS.DISPLAY_LINK, SUBJECTS.AUDIT_LOG);
      can(ACTIONS.DISPLAY_LINK, SUBJECTS.TENANT);
      can(ACTIONS.DISPLAY_LINK, SUBJECTS.ANALYTICS);
      break;

    case PLATFORM_ROLES.ADMIN:
      can(ACTIONS.MANAGE, SUBJECTS.USER);
      can(ACTIONS.DISPLAY_LINK, SUBJECTS.USER);
      can(ACTIONS.READ, SUBJECTS.TENANT);
      can(ACTIONS.CREATE, SUBJECTS.TENANT);
      can(ACTIONS.UPDATE, SUBJECTS.TENANT);
      can(ACTIONS.DELETE, SUBJECTS.TENANT);
      can(ACTIONS.DISPLAY_LINK, SUBJECTS.TENANT);
      can(ACTIONS.READ, SUBJECTS.PLATFORM_ADMIN);
      can(ACTIONS.READ, SUBJECTS.ROLE);
      can(ACTIONS.READ, SUBJECTS.AUDIT_LOG);
      can(ACTIONS.DISPLAY_LINK, SUBJECTS.AUDIT_LOG);
      can(ACTIONS.READ, SUBJECTS.ANALYTICS);
      can(ACTIONS.DISPLAY_LINK, SUBJECTS.ANALYTICS);
      can(ACTIONS.MANAGE, SUBJECTS.BANNER);
      can(ACTIONS.DISPLAY_LINK, SUBJECTS.BANNER);
      break;

    case PLATFORM_ROLES.MANAGER:
      can(ACTIONS.READ, SUBJECTS.TENANT);
      can(ACTIONS.DISPLAY_LINK, SUBJECTS.TENANT);
      can(ACTIONS.READ, SUBJECTS.ANALYTICS);
      can(ACTIONS.DISPLAY_LINK, SUBJECTS.ANALYTICS);
      can(ACTIONS.READ, SUBJECTS.BANNER);
      can(ACTIONS.DISPLAY_LINK, SUBJECTS.BANNER);
      break;

    case PLATFORM_ROLES.MEMBER:
      can(ACTIONS.READ, SUBJECTS.TENANT); // Minimal access
      can(ACTIONS.DISPLAY_LINK, SUBJECTS.TENANT);
      break;
  }

  return build();
}
