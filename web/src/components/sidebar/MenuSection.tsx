"use client";

import Link from "next/link";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { isDeepActive, shouldUseSecondary, getMenuItemAria } from "./utils";
import {
  menuItemBaseClasses,
  hotkeyClasses,
  badgeClasses,
  RADIUS,
} from "./constants";
import { formatHotkey } from "./hotKeys";
import type { MenuSectionProps } from "./types";

/**
 * MenuSection component for rendering a group of menu items
 */
export function MenuSection({
  title,
  items,
  collapsed,
  openIdx,
  pathname,
  toggleDropdown,
  keyToggleDropdown,
  keyNavigate,
  setRef,
  startIndex,
  showBadge,
  showHotkeys,
  itemPad,
  onOpenSecondary,
}: MenuSectionProps): React.ReactElement {
  return (
    <div className="mb-3">
      {!collapsed && title && (
        <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {title}
        </div>
      )}

      <div className="space-y-1">
        {items.map((item, idx) => {
          // Prefer stable ids; avoid path-only keys because parent nodes use "#"
          const itemKey = item.id || item.path || `${item.title}-${idx}`;

          const globalIdx = startIndex + idx;
          const isActive = isDeepActive(item, pathname);
          const hasChildren = Boolean(
            item.children && item.children.length > 0,
          );
          const useSecondary = shouldUseSecondary(item);
          const isOpen = openIdx === globalIdx && !useSecondary;

          const ariaProps = getMenuItemAria(
            isActive,
            hasChildren,
            Boolean(isOpen),
          );

          // Item without children
          if (!hasChildren) {
            if (collapsed) {
              return (
                <Link
                  key={itemKey}
                  ref={(el) => setRef(el, globalIdx)}
                  href={item.path}
                  className={cn(
                    menuItemBaseClasses.default,
                    menuItemBaseClasses.collapsed,
                    isActive && menuItemBaseClasses.active,
                    "w-full",
                  )}
                  title={item.title}
                  onKeyDown={keyNavigate(item.path)}
                  {...ariaProps}
                >
                  {item.icon && <item.icon size={18} />}
                </Link>
              );
            }

            return (
              <Link
                key={itemKey}
                ref={(el) => setRef(el, globalIdx)}
                href={item.path}
                className={cn(
                  menuItemBaseClasses.default,
                  menuItemBaseClasses.expanded,
                  itemPad,
                  isActive && menuItemBaseClasses.active,
                )}
                onKeyDown={keyNavigate(item.path)}
                {...ariaProps}
              >
                {item.icon && <item.icon size={18} />}
                <span className="flex-1 truncate">{item.title}</span>
                {showBadge && item.badge && (
                  <span className={badgeClasses}>{item.badge}</span>
                )}
                {showHotkeys && item.hotkey && (
                  <kbd className={hotkeyClasses}>
                    {formatHotkey(item.hotkey)}
                  </kbd>
                )}
              </Link>
            );
          }

          // Item with children - use secondary or dropdown
          if (useSecondary && onOpenSecondary) {
            if (collapsed) {
              return (
                <button
                  key={itemKey}
                  ref={(el) => setRef(el, globalIdx)}
                  type="button"
                  onClick={() => toggleDropdown(globalIdx)}
                  onKeyDown={keyToggleDropdown(globalIdx)}
                  className={cn(
                    menuItemBaseClasses.default,
                    menuItemBaseClasses.collapsed,
                    isActive && menuItemBaseClasses.active,
                    "w-full",
                  )}
                  title={item.title}
                  {...ariaProps}
                >
                  {item.icon && <item.icon size={18} />}
                </button>
              );
            }

            return (
              <button
                key={itemKey}
                ref={(el) => setRef(el, globalIdx)}
                type="button"
                onClick={() => onOpenSecondary(item)}
                className={cn(
                  menuItemBaseClasses.default,
                  menuItemBaseClasses.expanded,
                  itemPad,
                  isActive && menuItemBaseClasses.active,
                  "w-full",
                )}
                {...ariaProps}
              >
                {item.icon && <item.icon size={18} />}
                <span className="flex-1 truncate text-left">{item.title}</span>
                <ChevronRight size={14} />
              </button>
            );
          }

          if (collapsed) {
            return (
              <button
                key={itemKey}
                ref={(el) => setRef(el, globalIdx)}
                type="button"
                onClick={() => toggleDropdown(globalIdx)}
                onKeyDown={keyToggleDropdown(globalIdx)}
                className={cn(
                  menuItemBaseClasses.default,
                  menuItemBaseClasses.collapsed,
                  isActive && menuItemBaseClasses.active,
                  "w-full",
                )}
                title={item.title}
                {...ariaProps}
              >
                {item.icon && <item.icon size={18} />}
              </button>
            );
          }

          // Dropdown menu
          return (
            <div key={itemKey}>
              <button
                ref={(el) => setRef(el, globalIdx)}
                type="button"
                onClick={() => toggleDropdown(globalIdx)}
                onKeyDown={keyToggleDropdown(globalIdx)}
                className={cn(
                  menuItemBaseClasses.default,
                  menuItemBaseClasses.expanded,
                  itemPad,
                  isActive && menuItemBaseClasses.active,
                  "w-full",
                )}
                {...ariaProps}
              >
                {item.icon && <item.icon size={18} />}
                <span className="flex-1 truncate text-left">{item.title}</span>
                <ChevronDown
                  size={14}
                  className={cn(
                    "transition-transform duration-200",
                    isOpen && "rotate-180",
                  )}
                />
              </button>

              {isOpen && item.children && (
                <div className="ml-6 mt-1 space-y-1 border-l border-sidebar-border pl-3">
                  {item.children.map((child) => {
                    const childActive = pathname === child.path;
                    return (
                      <Link
                        key={child.id || child.path}
                        href={child.path}
                        className={cn(
                          `flex items-center gap-2 px-2 py-1.5 text-sm ${RADIUS.md}`,
                          "text-sidebar-foreground hover:bg-sidebar-accent transition-colors",
                          childActive && "bg-sidebar-accent font-medium",
                        )}
                      >
                        {child.icon && <child.icon size={14} />}
                        <span>{child.title}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
