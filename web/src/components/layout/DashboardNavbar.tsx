"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  Bell,
  ChevronLeft,
  ChevronRight,
  Home,
  LogOut,
  Menu,
  Search,
  Settings,
  User,
  LayoutGrid,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button, buttonVariants } from "@/components/ui/button";
import { ThemeSwitch } from "@/components/theme-switch";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { cn } from "@/lib/utils";
import { useBreadcrumbs } from "@/hooks/useBreadcrumbs";

interface DashboardNavbarProps {
  onLogout?: () => void;
  toggleMobile: () => void;
  toggleSidebar: () => void;
  collapsed: boolean;
  title?: string;
  user?: { name?: string | null; email?: string | null } | null;
  roleName?: string | null;
}

export function DashboardNavbar({
  onLogout,
  toggleMobile,
  toggleSidebar,
  collapsed,
  title = "Dashboard",
  user,
  roleName,
}: DashboardNavbarProps) {
  const pathname = usePathname();
  const breadcrumbs = useBreadcrumbs();

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-border/40 bg-background/60 px-4 backdrop-blur-xl transition-all duration-300 md:px-6">
      <div className="flex items-center gap-4">
        {/* Mobile Menu Toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden rounded-xl hover:bg-primary/10 hover:text-primary"
          onClick={toggleMobile}
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle mobile menu</span>
        </Button>

        {/* Desktop Sidebar Toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="hidden md:flex rounded-xl hover:bg-primary/10 hover:text-primary transition-all duration-300"
          onClick={toggleSidebar}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
          ) : (
            <ChevronLeft className="h-5 w-5 transition-transform group-hover:-translate-x-0.5" />
          )}
        </Button>

        {/* Breadcrumbs */}
        <Breadcrumb className="hidden sm:block">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink
                render={<Link href="/platform/dashboard">
                  <LayoutGrid className="h-3.5 w-3.5" />
                  <span>Dashboard</span>
                </Link>}
                className="flex items-center gap-1.5 hover:text-primary transition-colors cursor-pointer"
              />
            </BreadcrumbItem>
            {breadcrumbs.slice(2).map((crumb) => (
              <React.Fragment key={crumb.href}>
                <BreadcrumbSeparator>
                  <ChevronRight className="h-3.5 w-3.5" />
                </BreadcrumbSeparator>
                <BreadcrumbItem>
                  {crumb.isLast ? (
                    <BreadcrumbPage className="font-semibold text-foreground">
                      {crumb.label}
                    </BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink
                      render={<Link href={crumb.href}>{crumb.label}</Link>}
                      className="hover:text-primary transition-colors cursor-pointer"
                    />
                  )}
                </BreadcrumbItem>
              </React.Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        {/* Search - Decorative for now */}
        <div className="relative hidden lg:block">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="search"
            placeholder="Search commands..."
            className="h-9 w-64 rounded-full border border-border/40 bg-muted/20 pl-9 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all"
          />
          <div className="absolute right-2.5 top-1.5 hidden items-center gap-1 rounded border bg-background px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground opacity-100 sm:flex">
            <span className="text-xs">⌘</span>K
          </div>
        </div>

        <div className="flex items-center gap-1.5 md:gap-3">
          <ThemeSwitch />

          <Button
            variant="ghost"
            size="icon"
            className="rounded-full relative hover:bg-primary/10 hover:text-primary transition-colors"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute top-2 right-2 flex h-2 w-2 rounded-full bg-primary border-2 border-background" />
          </Button>

          <div className="h-6 w-px bg-border/60 mx-1" />

          {/* User Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger
              className={cn(
                buttonVariants({ variant: "ghost" }),
                "relative h-10 w-10 md:h-11 md:w-auto md:px-2 md:py-1 rounded-xl hover:bg-muted/50 transition-all flex items-center gap-2",
              )}
            >
              <Avatar className="h-8 w-8 rounded-lg border border-border/40 shadow-sm transition-transform group-hover:scale-105">
                <AvatarImage
                  src={`https://avatar.vercel.sh/${user?.email || "admin"}.png`}
                  alt={user?.name || "User"}
                />
                <AvatarFallback className="rounded-lg bg-primary/10 text-primary font-bold text-xs">
                  {user?.name
                    ? user.name.charAt(0).toUpperCase()
                    : "A"}
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:flex flex-col items-start gap-0 text-left">
                <span className="text-xs font-bold leading-none line-clamp-1">
                  {user?.name || "Administrator"}
                </span>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end">
              <DropdownMenuGroup>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-bold leading-none">
                      {user?.name || "Administrator"}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.email || "admin@example.com"}
                    </p>
                  </div>
                </DropdownMenuLabel>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer gap-2 rounded-lg">
                <User className="h-4 w-4" />
                <span>My Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer gap-2 rounded-lg">
                <Settings className="h-4 w-4" />
                <span>Account Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer gap-2 text-destructive focus:text-destructive rounded-lg"
                onClick={onLogout}
              >
                <LogOut className="h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
