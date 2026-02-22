import type { ServerMenuItem } from "@/lib/auth/sessionTypes";

function flattenPaths(items: ServerMenuItem[]): string[] {
  const paths: string[] = [];

  for (const item of items) {
    if (item.path && item.path !== "#") {
      paths.push(item.path);
    }
    if (item.children?.length) {
      paths.push(...flattenPaths(item.children));
    }
  }

  return paths;
}

export function isPathAllowedByNavigation(pathname: string, navigation: ServerMenuItem[]): boolean {
  const paths = flattenPaths(navigation);

  if (!paths.length) {
    return false;
  }

  return paths.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}
