import type { MongoAbility } from "@casl/ability";
import type { Action, Subject } from "../rbac/public/permissions.js";
import { MODULE_POLICIES } from "../../access/modulePolicies.js";

type AbilityLike = MongoAbility<[Action, Subject]>;

export interface NavigationPermission {
  action: Action;
  subject: Subject;
}

export interface NavigationItem {
  moduleKey: string;
  id: string;
  title: string;
  path: string;
  section?: string;
  iconKey?: string;
  order?: number;
  permission?: NavigationPermission;
  children?: NavigationItem[];
}

interface FlatNavigationItem extends NavigationItem {
  parentModuleKey?: string;
}

function buildFlatNavigation(scope: "platform" | "tenant"): FlatNavigationItem[] {
  return MODULE_POLICIES.filter((item) => item.scope === scope && item.navigation)
    .map((item) => ({
      moduleKey: item.moduleKey,
      id: item.moduleKey,
      title: item.navigation!.title,
      path: item.navigation!.path,
      section: item.navigation!.section,
      iconKey: item.navigation!.iconKey,
      order: item.navigation!.order,
      permission: item.navigation!.visibleWhen,
      parentModuleKey: item.navigation!.parentModuleKey,
    }))
    .sort((a, b) => (a.order ?? 9999) - (b.order ?? 9999));
}

function buildNavigationTree(items: FlatNavigationItem[]): NavigationItem[] {
  const childrenByParent = new Map<string, FlatNavigationItem[]>();

  for (const item of items) {
    if (!item.parentModuleKey) continue;
    const existing = childrenByParent.get(item.parentModuleKey) ?? [];
    existing.push(item);
    childrenByParent.set(item.parentModuleKey, existing);
  }

  const roots = items.filter((item) => !item.parentModuleKey);

  const toTreeItem = (item: FlatNavigationItem): NavigationItem => {
    const children = (childrenByParent.get(item.moduleKey) ?? [])
      .sort((a, b) => (a.order ?? 9999) - (b.order ?? 9999))
      .map(toTreeItem);

    return {
      moduleKey: item.moduleKey,
      id: item.id,
      title: item.title,
      path: item.path,
      section: item.section,
      iconKey: item.iconKey,
      order: item.order,
      permission: item.permission,
      children: children.length ? children : undefined,
    };
  };

  return roots.map(toTreeItem);
}

function filterNavigationByAbility(items: NavigationItem[], ability: AbilityLike): NavigationItem[] {
  const output: NavigationItem[] = [];

  for (const item of items) {
    if (item.permission && !ability.can(item.permission.action, item.permission.subject)) {
      continue;
    }

    const children = item.children ? filterNavigationByAbility(item.children, ability) : undefined;

    if (item.path === "#" && (!children || children.length === 0)) {
      continue;
    }

    output.push({
      ...item,
      children: children && children.length > 0 ? children : undefined,
    });
  }

  return output;
}

export function buildPlatformNavigation(ability: AbilityLike): NavigationItem[] {
  const tree = buildNavigationTree(buildFlatNavigation("platform"));
  return filterNavigationByAbility(tree, ability);
}

export function buildTenantNavigation(ability: AbilityLike): NavigationItem[] {
  const tree = buildNavigationTree(buildFlatNavigation("tenant"));
  return filterNavigationByAbility(tree, ability);
}
