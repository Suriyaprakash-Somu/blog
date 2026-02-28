"use client";

import { usePathname } from "next/navigation";
import { useMemo } from "react";

export interface BreadcrumbCrumb {
  label: string;
  href: string;
  isLast: boolean;
}

const LABEL_MAP: Record<string, string> = {
  platform: "Platform",
  dashboard: "Dashboard",
  blog: "Blog",
  "blog-categories": "Categories",
  "blog-posts": "Posts",
  "blog-tags": "Tags",
  tenants: "Tenants",
  users: "Users",
  settings: "Settings",
  analytics: "Analytics",
  "audit-logs": "Audit Logs",
  categories: "Categories",
  tags: "Tags",
};

export function useBreadcrumbs() {
  const pathname = usePathname();

  const breadcrumbs = useMemo(() => {
    const pathSegments = pathname.split("/").filter(Boolean);
    
    return pathSegments.map((segment, index) => {
      const href = `/${pathSegments.slice(0, index + 1).join("/")}`;
      
      // Try to find a human-friendly label from the map, 
      // otherwise capitalize and replace hyphens
      let label = LABEL_MAP[segment.toLowerCase()];
      
      if (!label) {
        label = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, " ");
      }
      
      const isLast = index === pathSegments.length - 1;

      return { label, href, isLast };
    });
  }, [pathname]);

  return breadcrumbs;
}
