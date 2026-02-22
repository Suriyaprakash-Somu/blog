"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { RawRuleOf } from "@casl/ability";
import { createContextualCan } from "@casl/react";
import {
  createFullAccessAbility,
  createEmptyAbility,
  createAbilityFromRules,
  type AppAbility,
} from "./ability";

// Create context with full access ability as default (for when not in a provider)
// This ensures Sidebar works in platform admin pages without CASL setup
const AbilityContext = createContext<AppAbility>(createFullAccessAbility());

/**
 * Contextual Can component for declarative permission checks
 * Usage: <Can I="read" a="Branch">...</Can>
 */
export const Can = createContextualCan(AbilityContext.Consumer);

/**
 * Hook to access the current ability instance
 */
export function useAbility(): AppAbility {
  return useContext(AbilityContext);
}

/**
 * Provider component that creates ability from permission rules
 */
export function AbilityProvider({
  children,
  permissions = [],
}: {
  children: ReactNode;
  permissions?: RawRuleOf<AppAbility>[];
}) {
  const ability = useMemo(
    () =>
      permissions.length > 0
        ? createAbilityFromRules(permissions)
        : createEmptyAbility(),
    [permissions],
  );

  return (
    <AbilityContext.Provider value={ability}>
      {children}
    </AbilityContext.Provider>
  );
}
