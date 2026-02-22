"use client";

import { forwardRef } from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { ARIA_LABELS, RADIUS } from "./constants";
import type { SidebarSearchProps } from "./types";

/**
 * SidebarSearch component
 */
export const SidebarSearch = forwardRef<HTMLInputElement, SidebarSearchProps>(
  ({ value, onChange, className }, ref) => {
    return (
      <div className={cn("px-3 pb-3", className)}>
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
            size={16}
          />
          <input
            ref={ref}
            type="text"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder="Search... (Ctrl+/)"
            aria-label={ARIA_LABELS.searchInput}
            className={cn(
              "w-full pl-9 pr-9 py-2 text-sm",
              "bg-sidebar-accent border border-transparent",
              RADIUS.md,
              "text-sidebar-foreground placeholder:text-muted-foreground",
              "focus:outline-none focus:ring-2 focus:ring-sidebar-ring focus:ring-offset-0",
              "focus:bg-sidebar focus:border-sidebar-border",
              "transition-all duration-200",
            )}
          />
          {value && (
            <button
              type="button"
              onClick={() => onChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-sidebar-foreground transition-colors"
              aria-label={ARIA_LABELS.clearSearch}
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>
    );
  },
);

SidebarSearch.displayName = "SidebarSearch";
