"use client";

import Link from "next/link";
import { ArrowLeft, X, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { filterItemsBySearch } from "./utils";
import { ARIA_LABELS, RADIUS } from "./constants";
import type { SecondarySidebarProps } from "./types";

/**
 * SecondarySidebar component for nested navigation
 */
export function SecondarySidebar({
  isOpen,
  items,
  parentTitle,
  onBack,
  onClose,
  onNavigateDeeper,
  config,
  searchTerm,
}: SecondarySidebarProps): React.ReactElement | null {
  if (!isOpen) return null;

  const filteredItems = filterItemsBySearch(items, searchTerm);

  return (
    <div
      className={cn(
        "absolute inset-0 bg-sidebar border-r border-sidebar-border z-10",
        "animate-in slide-in-from-left duration-200",
      )}
      aria-label={ARIA_LABELS.secondarySidebar}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-sidebar-border">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-sidebar-foreground hover:text-sidebar-primary transition-colors"
          aria-label={ARIA_LABELS.backButton}
        >
          <ArrowLeft size={16} />
          <span className="font-medium">{parentTitle}</span>
        </button>
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded hover:bg-sidebar-accent transition-colors"
          aria-label={ARIA_LABELS.closeButton}
        >
          <X size={16} />
        </button>
      </div>

      <nav className="overflow-y-auto p-2">
        {filteredItems.map((item) => {
          const hasChildren = item.children && item.children.length > 0;

          if (hasChildren) {
            return (
              <button
                key={item.path}
                type="button"
                onClick={() => onNavigateDeeper(item)}
                className={cn(
                  `w-full flex items-center justify-between px-3 py-2.5 ${RADIUS.md}`,
                  "text-sm text-sidebar-foreground",
                  "hover:bg-sidebar-accent transition-colors",
                )}
              >
                <div className="flex items-center gap-3">
                  {item.icon && <item.icon size={16} />}
                  <span>{item.title}</span>
                </div>
                <ChevronRight size={14} />
              </button>
            );
          }

          return (
            <Link
              key={item.path}
              href={item.path}
              onClick={config.closeOnSelect ? onClose : undefined}
              className={cn(
                `flex items-center gap-3 px-3 py-2.5 ${RADIUS.md}`,
                "text-sm text-sidebar-foreground",
                "hover:bg-sidebar-accent transition-colors",
              )}
            >
              {item.icon && <item.icon size={16} />}
              <span>{item.title}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
