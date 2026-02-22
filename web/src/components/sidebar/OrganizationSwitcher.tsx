"use client";

import type { OrganizationSwitcherProps } from "./types";
import { Building2, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { RADIUS } from "./constants";
import { useTenantSession } from "@/lib/auth/useTenantSession";

export function OrganizationSwitcher({
  className,
}: OrganizationSwitcherProps): React.ReactElement {
  const { data: session } = useTenantSession();

  const orgName = session?.tenant?.name || "Workspace";
  const subtitle = session?.user?.email || "";

  return (
    <button
      type="button"
      className={cn(
        `w-full flex items-center gap-3 p-2 ${RADIUS.md}`,
        "bg-sidebar-accent hover:bg-sidebar-accent/80 transition-colors",
        "text-sidebar-foreground",
        className,
      )}
    >
      <div
        className={`flex items-center justify-center w-8 h-8 ${RADIUS.md} bg-sidebar-primary/20`}
      >
        <Building2 size={16} className="text-sidebar-primary" />
      </div>
      <div className="flex-1 text-left">
        <p className="text-sm font-medium truncate">{orgName}</p>
        {subtitle ? (
          <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
        ) : (
          <p className="text-xs text-muted-foreground truncate">Tenant workspace</p>
        )}
      </div>
      <ChevronDown size={16} className="text-muted-foreground" />
    </button>
  );
}
