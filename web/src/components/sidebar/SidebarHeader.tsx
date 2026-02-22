"use client";

import Link from "next/link";
import type { SidebarHeaderProps } from "./types";
import { RADIUS } from "./constants";

/**
 * SidebarHeader component with logo and title
 */
export function SidebarHeader({
  collapsed,
  logo,
  title = "App Name",
  homeLink = "/",
}: SidebarHeaderProps): React.ReactElement {
  return (
    <div className="border-b border-sidebar-border bg-sidebar h-[65px]">
      {!collapsed && (
        <Link
          href={homeLink}
          className="flex items-center gap-3 px-4 py-3 hover:bg-sidebar-accent transition-colors"
        >
          {logo ? (
            logo
          ) : (
            <div
              className={`flex items-center justify-center w-8 h-8 ${RADIUS.md} bg-sidebar-primary text-sidebar-primary-foreground font-bold text-sm`}
            >
              {title.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="flex flex-col">
            <h2 className="font-bold text-base text-sidebar-foreground leading-tight">
              {title}
            </h2>
            <span className="text-[10px] text-muted-foreground">Dashboard</span>
          </div>
        </Link>
      )}

      {collapsed && (
        <Link
          href={homeLink}
          className="flex items-center justify-center py-3 hover:bg-sidebar-accent transition-colors"
          title={title}
        >
          {logo ? (
            logo
          ) : (
            <div
              className={`flex items-center justify-center w-8 h-8 ${RADIUS.md} bg-sidebar-primary text-sidebar-primary-foreground font-bold text-sm`}
            >
              {title.charAt(0).toUpperCase()}
            </div>
          )}
        </Link>
      )}
    </div>
  );
}
