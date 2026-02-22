/**
 * Sidebar Constants
 * Animation variants, CSS presets, and configuration values
 */

import type { DrawerBreakpoint, SidebarDensity } from "./types";

export const sidebarAnimations = {
  expanded: { width: "var(--sidebar-width, 16rem)" },
  collapsed: { width: "var(--sidebar-collapsed-width, 4rem)" },
  transition: {
    duration: 0.3,
    ease: [0.25, 0.1, 0.25, 1],
  },
};

export const secondarySidebarAnimations = {
  slideRight: {
    initial: { x: "-100%", opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: "-100%", opacity: 0 },
  },
  slideLeft: {
    initial: { x: "100%", opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: "100%", opacity: 0 },
  },
  transition: {
    type: "spring",
    stiffness: 300,
    damping: 30,
  },
};

export const flyoutAnimations = {
  initial: { opacity: 0, x: -8 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -8 },
  transition: {
    duration: 0.15,
    ease: "easeOut",
  },
};

export const dropdownAnimations = {
  initial: { opacity: 0, height: 0 },
  animate: {
    opacity: 1,
    height: "auto",
    transition: {
      height: { duration: 0.2, ease: "easeOut" },
      opacity: { duration: 0.15, delay: 0.05 },
    },
  },
  exit: {
    opacity: 0,
    height: 0,
    transition: {
      height: { duration: 0.15 },
      opacity: { duration: 0.1 },
    },
  },
};

export const CHORD_TIMEOUT = 1500;
export const SEARCH_DEBOUNCE = 150;
export const TOOLTIP_DELAY = 500;

export const BREAKPOINTS = {
  mobile: 768,
  tablet: 1024,
  desktop: 1280,
} as const;

export const HIDE_BUTTON: Record<DrawerBreakpoint, string> = {
  sm: "sm:hidden",
  md: "md:hidden",
  lg: "lg:hidden",
  xl: "xl:hidden",
};

export const SHOW_PILL: Record<DrawerBreakpoint, string> = {
  sm: "hidden sm:block",
  md: "hidden md:block",
  lg: "hidden lg:block",
  xl: "hidden xl:block",
};

export const DESKTOP_SIDEBAR: Record<DrawerBreakpoint, string> = {
  sm: "sm:relative sm:translate-x-0",
  md: "md:relative md:translate-x-0",
  lg: "lg:relative lg:translate-x-0",
  xl: "xl:relative xl:translate-x-0",
};

export const ITEM_PAD: Record<SidebarDensity, string> = {
  base: "px-4 py-3 gap-3 text-sm",
  compact: "px-3 py-2 gap-2 text-[13px]",
  cozy: "px-5 py-4 gap-4 text-base",
};

export const SEARCH_H: Record<SidebarDensity, string> = {
  base: "py-2",
  compact: "py-1.5",
  cozy: "py-3",
};

export const PILL_W: Record<SidebarDensity, string> = {
  base: "h-8 w-8",
  compact: "h-7 w-7",
  cozy: "h-9 w-9",
};

export const RADIUS = {
  base: "rounded",
  sm: "rounded-sm",
  md: "rounded-md",
  lg: "rounded-lg",
  full: "rounded-full",
  none: "rounded-none",
} as const;

export type RadiusSize = keyof typeof RADIUS;

export const menuItemBaseClasses = {
  default: [
    `flex items-center ${RADIUS.md}`,
    "text-[13px]",
    "hover:bg-sidebar-accent transition-colors duration-150",
    "text-sidebar-foreground hover:text-sidebar-accent-foreground",
  ].join(" "),
  active: ["bg-sidebar-accent text-sidebar-primary font-medium"].join(" "),
  collapsed: "justify-center px-2 py-2.5",
  expanded: "gap-3 px-3 py-2.5",
};

export const hotkeyClasses =
  `px-1.5 py-0.5 text-[10px] font-mono bg-muted ${RADIUS.sm} border shrink-0`;

export const badgeClasses =
  `bg-sidebar-accent text-sidebar-primary text-xs font-semibold px-2 py-0.5 ${RADIUS.full}`;

export const ARIA_LABELS = {
  sidebar: "Main navigation",
  secondarySidebar: "Secondary navigation",
  backButton: "Go back to previous menu",
  closeButton: "Close menu",
  searchInput: "Search menu items",
  clearSearch: "Clear search",
} as const;
