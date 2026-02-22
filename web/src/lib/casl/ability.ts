import {
  createMongoAbility,
  type MongoAbility,
  type RawRuleOf,
} from "@casl/ability";

export type AppAbility = MongoAbility<[string, string]>;

/**
 * Create an empty ability for unauthenticated users
 */
export function createEmptyAbility(): AppAbility {
  return createMongoAbility<[string, string]>([]);
}

/**
 * Create a full access ability (for when no CASL context exists)
 * This allows all actions on all subjects
 */
export function createFullAccessAbility(): AppAbility {
  return createMongoAbility<[string, string]>([
    { action: "manage", subject: "all" },
  ]);
}

/**
 * Create ability from permission rules
 */
export function createAbilityFromRules(
  rules: RawRuleOf<AppAbility>[],
): AppAbility {
  return createMongoAbility<[string, string]>(rules);
}
