"use client";

import Link from "next/link";
import { forwardRef } from "react";
import { ChevronRight, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { isDeepActive } from "./utils";
import { RADIUS } from "./constants";
import type { FlyoutMenuProps, NavStackItem } from "./types";

/**
 * FlyoutMenu component for collapsed sidebar
 */
export const FlyoutMenu = forwardRef<HTMLDivElement, FlyoutMenuProps>(
  (
    {
      currentItem,
      pathname,
      style,
      navStack,
      onNavigateDeeper,
      onGoBack,
      onClose,
    },
    ref,
  ) => {
    const currentNav = navStack[navStack.length - 1] as
      | NavStackItem
      | undefined;
    const items = currentNav?.items ?? currentItem.children ?? [];
    const title = currentNav?.title ?? currentItem.title;
    const showBack = navStack.length > 0;

    return (
      <div
        ref={ref}
        className={`fixed z-50 min-w-48 bg-popover border border-border ${RADIUS.lg} shadow-lg py-1`}
        style={style}
      >
        <div className="px-3 py-2 border-b border-border flex items-center gap-2">
          {showBack && (
            <button
              type="button"
              onClick={onGoBack}
              className="p-1 rounded hover:bg-accent transition-colors"
            >
              <ArrowLeft size={14} />
            </button>
          )}
          <span className="text-sm font-medium text-foreground">{title}</span>
        </div>

        <div className="py-1">
          {items.map((item) => {
            const isActive = isDeepActive(item, pathname);
            const hasChildren = item.children && item.children.length > 0;

            if (hasChildren) {
              return (
                <button
                  key={item.path}
                  type="button"
                  onClick={() => onNavigateDeeper(item)}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2 text-sm",
                    "hover:bg-accent transition-colors",
                    isActive && "bg-accent font-medium",
                  )}
                >
                  <div className="flex items-center gap-2">
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
                onClick={onClose}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 text-sm",
                  "hover:bg-accent transition-colors",
                  isActive && "bg-accent font-medium",
                )}
              >
                {item.icon && <item.icon size={16} />}
                <span>{item.title}</span>
              </Link>
            );
          })}
        </div>
      </div>
    );
  },
);

FlyoutMenu.displayName = "FlyoutMenu";
