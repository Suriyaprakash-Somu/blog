import {
  AbilityBuilder,
  createMongoAbility,
  type MongoAbility,
} from "@casl/ability";
import { ACTIONS, SUBJECTS, type Action, type Subject } from "../public/permissions.js";
import { TENANT_ROLES, type TenantRole } from "../../roles/tenant/tenant.schema.js";

export type TenantAbility = MongoAbility<[Action, Subject]>;

/**
 * Build tenant user abilities
 */
export function buildTenantAbility(role: TenantRole): TenantAbility {
  const { can, build } = new AbilityBuilder<TenantAbility>(createMongoAbility);

  switch (role) {
    case TENANT_ROLES.OWNER:
      can(ACTIONS.MANAGE, SUBJECTS.ALL);
      // can(ACTIONS.DISPLAY_LINK, SUBJECTS.BRANCH);
      can(ACTIONS.DISPLAY_LINK, SUBJECTS.ANALYTICS);
      can(ACTIONS.DISPLAY_LINK, SUBJECTS.BLOG_POST);
      break;

    case TENANT_ROLES.ADMIN:
      // can(ACTIONS.MANAGE, SUBJECTS.USER);
      // can(ACTIONS.DISPLAY_LINK, SUBJECTS.USER);
      can(ACTIONS.READ, SUBJECTS.ROLE);
      // can(ACTIONS.MANAGE, SUBJECTS.BRANCH);
      // can(ACTIONS.DISPLAY_LINK, SUBJECTS.BRANCH);
      can(ACTIONS.READ, SUBJECTS.ANALYTICS);
      can(ACTIONS.DISPLAY_LINK, SUBJECTS.ANALYTICS);
      can(ACTIONS.MANAGE, SUBJECTS.BLOG_POST);
      can(ACTIONS.DISPLAY_LINK, SUBJECTS.BLOG_POST);
      break;

    case TENANT_ROLES.MANAGER:
      // can(ACTIONS.READ, SUBJECTS.USER);
      // can(ACTIONS.READ, SUBJECTS.BRANCH);
      // can(ACTIONS.UPDATE, SUBJECTS.BRANCH);
      // can(ACTIONS.DISPLAY_LINK, SUBJECTS.BRANCH);
      can(ACTIONS.READ, SUBJECTS.ANALYTICS);
      can(ACTIONS.DISPLAY_LINK, SUBJECTS.ANALYTICS);
      can(ACTIONS.READ, SUBJECTS.BLOG_POST);
      can(ACTIONS.UPDATE, SUBJECTS.BLOG_POST);
      can(ACTIONS.DISPLAY_LINK, SUBJECTS.BLOG_POST);
      break;

    case TENANT_ROLES.MEMBER:
      // can(ACTIONS.READ, SUBJECTS.USER);
      // can(ACTIONS.READ, SUBJECTS.BRANCH);
      // can(ACTIONS.DISPLAY_LINK, SUBJECTS.BRANCH);
      can(ACTIONS.READ, SUBJECTS.ANALYTICS);
      can(ACTIONS.DISPLAY_LINK, SUBJECTS.ANALYTICS);
      can(ACTIONS.READ, SUBJECTS.BLOG_POST);
      can(ACTIONS.DISPLAY_LINK, SUBJECTS.BLOG_POST);
      break;
  }

  return build();
}
