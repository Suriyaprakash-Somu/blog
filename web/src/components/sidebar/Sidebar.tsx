"use client";

import {
  useState,
  useRef,
  useMemo,
  useEffect,
  useCallback,
  type CSSProperties,
} from "react";
import { ChevronLeft, ChevronRight, LogOut } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { MenuSection } from "./MenuSection";
import { SidebarHeader } from "./SidebarHeader";
import { SecondarySidebar } from "./SecondarySidebar";
import { SidebarSearch } from "./SidebarSearch";
import { FlyoutMenu } from "./FlyoutMenu";
import { useFilteredMenuSections } from "./useFilteredMenuSections";
import { useGlobalHotkeys, normaliseHotkey } from "./hotKeys";
import {
  HIDE_BUTTON,
  SHOW_PILL,
  DESKTOP_SIDEBAR,
  ITEM_PAD,
  SEARCH_H,
  PILL_W,
  RADIUS,
} from "./constants";
import { cn } from "@/lib/utils";
import { OrganizationSwitcher } from "./OrganizationSwitcher";
import { useAbility } from "@/lib/casl";
import { ThemeSwitch } from "@/components/theme-switch";
import type {
  SidebarProps,
  MenuItem,
  NavStackItem,
  SecondarySidebarConfig,
} from "./types";
import { DashboardNavbar } from "../layout/DashboardNavbar";

/**
 * Main Sidebar component with navigation, search, and nested menus
 */
export function Sidebar({
  children,
  menuItems = [],
  secondarySidebar,
  drawerBreakpoint = "md",
  showCollapse = true,
  showBadge = true,
  showHotkeys = true,
  showSearch = true,
  showOrganizationSwitcher = true,
  density = "compact",
  onLogout,
  logo,
  title = "App Name",
  homeLink = "/",
  user,
  roleName,
}: SidebarProps): React.ReactElement {
  const pathname = usePathname();
  const router = useRouter();
  const ability = useAbility();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [openDropdown, setOpenDropdown] = useState<number | null>(null);
  const [flyoutStyle, setFlyoutStyle] = useState<CSSProperties>({});

  const [navStack, setNavStack] = useState<NavStackItem[]>([]);
  const secondaryOpen = navStack.length > 0;
  const currentNav = navStack[navStack.length - 1];

  const [flyoutNavStack, setFlyoutNavStack] = useState<NavStackItem[]>([]);

  const searchRef = useRef<HTMLInputElement>(null);
  const menuRefs = useRef<(HTMLElement | null)[]>([]);
  const flyoutRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLElement>(null);

  const hideBtn = HIDE_BUTTON[drawerBreakpoint];
  const showPill = SHOW_PILL[drawerBreakpoint];
  const desktopCt = DESKTOP_SIDEBAR[drawerBreakpoint];
  const toggleMobile = () => setMobileOpen((open) => !open);
  const toggleSidebar = () => {
    setCollapsed((prev) => !prev);
    setOpenDropdown(null);
    setFlyoutNavStack([]);
  };

  const secondaryConfig: SecondarySidebarConfig = {
    behavior: "overlay",
    showOn: "click",
    closeOnSelect: true,
    closeOnOutsideClick: true,
    animationDirection: "slide-right",
    ...secondarySidebar,
  };

  const openSecondary = useCallback((item: MenuItem) => {
    if (item.children && item.children.length > 0) {
      setNavStack((prev) => [
        ...prev,
        { items: item.children!, title: item.title, parentPath: item.path },
      ]);
    }
  }, []);

  const navigateDeeper = useCallback(
    (item: MenuItem) => {
      if (item.children && item.children.length > 0) {
        setNavStack((prev) => [
          ...prev,
          { items: item.children!, title: item.title, parentPath: item.path },
        ]);
      } else {
        router.push(item.path);
        if (secondaryConfig.closeOnSelect) {
          setNavStack([]);
        }
      }
    },
    [router, secondaryConfig.closeOnSelect],
  );

  const goBack = useCallback(() => {
    setNavStack((prev) => prev.slice(0, -1));
  }, []);

  const closeSecondary = useCallback(() => {
    setNavStack([]);
  }, []);

  const flyoutNavigateDeeper = useCallback(
    (item: MenuItem) => {
      if (item.children && item.children.length > 0) {
        setFlyoutNavStack((prev) => [
          ...prev,
          { items: item.children!, title: item.title, parentPath: item.path },
        ]);
      } else {
        router.push(item.path);
        setOpenDropdown(null);
        setFlyoutNavStack([]);
      }
    },
    [router],
  );

  const flyoutGoBack = useCallback(() => {
    setFlyoutNavStack((prev) => prev.slice(0, -1));
  }, []);

  const flyoutClose = useCallback(() => {
    setOpenDropdown(null);
    setFlyoutNavStack([]);
  }, []);

  // Sync flyout stack
  if (openDropdown === null && flyoutNavStack.length > 0) {
    setFlyoutNavStack([]);
  }

  useEffect(() => {
    if (!secondaryOpen || !secondaryConfig.closeOnOutsideClick) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target as Node)
      ) {
        closeSecondary();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [secondaryOpen, secondaryConfig.closeOnOutsideClick, closeSecondary]);

  const effectiveCollapsed = mobileOpen ? false : collapsed;
  const widthClass = effectiveCollapsed ? "w-17" : "w-64";

  const itemPad = ITEM_PAD[density];
  const searchPad = SEARCH_H[density];
  const pillSize = PILL_W[density];

  const hotkeyMap = useMemo(() => {
    const map = new Map<string, () => void>();

    if (showHotkeys) {
      menuItems.forEach((item) => {
        if (item.hotkey && item.path !== "#") {
          map.set(normaliseHotkey(item.hotkey), () => {
            router.push(item.path);
          });
        }

        const registerChildHotkeys = (children?: MenuItem[]) => {
          children?.forEach((child) => {
            if (child.hotkey && child.path !== "#") {
              map.set(normaliseHotkey(child.hotkey), () => {
                router.push(child.path);
              });
            }
            registerChildHotkeys(child.children);
          });
        };

        registerChildHotkeys(item.children);
      });
    }

    return map;
  }, [menuItems, router, showHotkeys]);

  useEffect(() => {
    if (!showSearch) return;
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key === "/") {
        e.preventDefault();
        searchRef.current?.focus();
        searchRef.current?.select();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [showSearch]);

  useGlobalHotkeys(hotkeyMap);

  const searchTerm = search.trim().toLowerCase();

  const { sections, filteredFlat } = useFilteredMenuSections(
    menuItems,
    searchTerm,
    ability,
  );

  useEffect(() => {
    menuRefs.current = menuRefs.current.slice(0, filteredFlat.length);
    const handler = (event: MouseEvent) => {
      if (
        flyoutRef.current &&
        !flyoutRef.current.contains(event.target as Node) &&
        menuRefs.current.every(
          (refItem) => refItem && !refItem.contains(event.target as Node),
        )
      ) {
        setOpenDropdown(null);
      }
    };
    window.addEventListener("mousedown", handler);
    return () => window.removeEventListener("mousedown", handler);
  }, [filteredFlat.length]);

  const toggleDropdown = (idx: number) => {
    if (effectiveCollapsed) {
      const el = menuRefs.current[idx];
      if (el) {
        const { top, width } = el.getBoundingClientRect();
        setFlyoutStyle({ top, left: width + 15 });
      }
    }
    setOpenDropdown((prev) => (prev === idx ? null : idx));
  };

  const keyToggleDropdown = (idx: number) => (event: React.KeyboardEvent) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      toggleDropdown(idx);
    }
  };

  const keyNavigate = (path: string) => (event: React.KeyboardEvent) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      router.push(path);
    }
  };

  return (
    <div className="fixed inset-0 flex overflow-hidden bg-background">
      {mobileOpen && (
        <button
          type="button"
          onClick={toggleMobile}
          aria-label="Close menu overlay"
          className={cn("fixed inset-0 bg-black/60 z-40", hideBtn)}
        />
      )}

      <nav
        ref={sidebarRef}
        aria-label="Primary"
        className={cn(
          "flex flex-col shadow-lg bg-sidebar border-r border-sidebar-border",
          "transition-all duration-300",
          widthClass,
          desktopCt,
          "fixed inset-y-0 left-0 z-50",
          "transform",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <SidebarHeader
          collapsed={effectiveCollapsed}
          logo={logo}
          title={title}
          homeLink={homeLink}
        />

        {showSearch && !collapsed && (
          <SidebarSearch
            ref={searchRef}
            value={search}
            onChange={setSearch}
            className={searchPad}
          />
        )}

        <div className="flex-1 flex flex-col overflow-hidden relative">
          <nav className="grow overflow-y-auto scrollbar-hide pt-2 px-2">
            {sections.map((section, idx) => {
              const start = sections
                .slice(0, idx)
                .reduce((sum, sec) => sum + sec.items.length, 0);
              return (
                <MenuSection
                  key={section.title}
                  title={section.title}
                  items={section.items}
                  collapsed={effectiveCollapsed}
                  openIdx={openDropdown}
                  pathname={pathname}
                  searchTerm={searchTerm}
                  toggleDropdown={toggleDropdown}
                  keyToggleDropdown={keyToggleDropdown}
                  keyNavigate={keyNavigate}
                  setRef={(el, index) => {
                    menuRefs.current[index] = el;
                  }}
                  startIndex={start}
                  showBadge={showBadge}
                  showHotkeys={showHotkeys}
                  itemPad={itemPad}
                  onOpenSecondary={openSecondary}
                />
              );
            })}
          </nav>

          {secondaryOpen && (
            <div className="absolute inset-0 overflow-hidden pointer-events-none z-20">
              <div className="pointer-events-auto h-full">
                <SecondarySidebar
                  isOpen={secondaryOpen}
                  items={currentNav?.items ?? []}
                  parentTitle={currentNav?.title ?? ""}
                  onBack={goBack}
                  onClose={closeSecondary}
                  onNavigateDeeper={navigateDeeper}
                  config={secondaryConfig}
                  width={widthClass}
                  collapsed={effectiveCollapsed}
                  searchTerm={searchTerm}
                />
              </div>
            </div>
          )}
        </div>

        {effectiveCollapsed &&
          openDropdown !== null &&
          filteredFlat[openDropdown] && (
            <FlyoutMenu
              ref={flyoutRef}
              currentItem={filteredFlat[openDropdown]}
              pathname={pathname}
              style={flyoutStyle}
              navStack={flyoutNavStack}
              onNavigateDeeper={flyoutNavigateDeeper}
              onGoBack={flyoutGoBack}
              onClose={flyoutClose}
            />
          )}

        {!effectiveCollapsed && showOrganizationSwitcher && (
          <div className="border-t border-sidebar-border bg-sidebar p-3 mt-auto">
            <OrganizationSwitcher />
          </div>
        )}
      </nav>

      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardNavbar
          onLogout={onLogout ?? (() => { })}
          toggleMobile={toggleMobile}
          toggleSidebar={toggleSidebar}
          collapsed={collapsed}
          title={title}
          user={user}
          roleName={roleName}
        />

        <main className="flex-1 p-4 md:p-6 bg-background/50 overflow-y-auto scrollbar-hide flex flex-col">
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
