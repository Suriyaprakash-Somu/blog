"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  motion,
  AnimatePresence,
  useScroll,
  useTransform,
} from "framer-motion";
import { Menu, ArrowRight, X } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { ThemeSwitch } from "@/components/theme-switch";
import { cn } from "@/lib/utils";
import type { SiteSettings } from "@/lib/api/public-settings";

const navLinks = [
  { name: "Home", href: "/" },
  { name: "Blog", href: "/blog" },
  { name: "Categories", href: "/categories" },
];

export function Navbar({ siteSettings }: { siteSettings?: SiteSettings }) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isScrolled, setIsScrolled] = React.useState(false);
  const pathname = usePathname();
  const menuRef = React.useRef<HTMLDivElement>(null);

  const lightLogo = siteSettings?.logos?.lightLogoUrl;
  const darkLogo = siteSettings?.logos?.darkLogoUrl;
  const hasLogo = !!lightLogo || !!darkLogo;

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  React.useEffect(() => {
    if (!isOpen) return;
    const onDocClick = (e: MouseEvent | TouchEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("touchstart", onDocClick, { passive: true });
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("touchstart", onDocClick);
    };
  }, [isOpen]);

  return (
    <motion.header
      initial={false}
      className={cn(
        "fixed top-0 left-0 right-0 z-50 flex items-center h-16 transition-all duration-300 border-b",
        isScrolled
          ? "bg-background/80 backdrop-blur-xl border-border/40 shadow-sm"
          : "bg-transparent border-transparent",
      )}
    >
      <div className="container mx-auto w-full max-w-7xl flex items-center justify-between px-4 md:px-6">
        {/* Logo */}
        <Link href="/" className="group flex items-center gap-2">
          {hasLogo ? (
            <>
              {/* Light mode logo */}
              {lightLogo && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={lightLogo}
                  alt={siteSettings.identity.siteName}
                  className={cn(
                    "h-9 w-auto object-contain",
                    darkLogo ? "dark:hidden" : "",
                  )}
                />
              )}
              {/* Dark mode logo */}
              {darkLogo && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={darkLogo}
                  alt={siteSettings.identity.siteName}
                  className={cn(
                    "h-9 w-auto object-contain",
                    lightLogo ? "hidden dark:block" : "",
                  )}
                />
              )}
              {/* Site Name text next to logo (optional, can be hidden on small screens) */}
              <span className="hidden sm:inline-block text-xl font-bold tracking-tight text-foreground group-hover:text-primary transition-colors ml-1">
                {siteSettings?.identity?.siteName ?? "Brand"}
              </span>
            </>
          ) : (
            <>
              <motion.div
                whileHover={{ rotate: 10, scale: 1.1 }}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground font-black shadow-lg text-sm shrink-0"
              >
                {siteSettings?.identity?.shortName ?? "BR"}
              </motion.div>
              <span className="text-xl font-bold tracking-tight text-foreground group-hover:text-primary transition-colors">
                {siteSettings?.identity?.siteName ?? "Brand Name"}
              </span>
            </>
          )}
        </Link>
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1 bg-muted/40 p-1 rounded-full border border-border/40 backdrop-blur-sm overflow-hidden">
          {navLinks.map((link) => {
            const isActive =
              pathname === link.href ||
              (link.href !== "/" && pathname.startsWith(link.href));
            return (
              <Link
                key={link.name}
                href={link.href}
                className={cn(
                  "relative px-4 py-2 text-sm font-medium transition-all duration-300 rounded-full",
                  isActive
                    ? "text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="active-pill"
                    className="absolute inset-0 bg-primary rounded-full -z-10 shadow-md"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                {link.name}
              </Link>
            );
          })}
        </nav>
        {/* Action Buttons */}
        <div className="hidden md:flex items-center gap-4">
          <ThemeSwitch />
          <div className="h-6 w-px bg-border/60 mx-1" />
          <Link
            href="/tenant/login"
            className="text-sm font-medium hover:text-primary transition-colors"
          >
            Login
          </Link>
          <Link href="/blog">
            <Button
              size="sm"
              className="rounded-full px-5 shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all duration-300 font-semibold h-11"
            >
              Start Reading <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>

        {/* Mobile Nav */}
        <div className="flex items-center gap-4 md:hidden">
          <ThemeSwitch />

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(!isOpen)}
            className="rounded-full hover:bg-primary/10 hover:text-primary transition-colors z-50 relative"
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>

          <AnimatePresence>
            {isOpen && (
              <motion.div
                ref={menuRef}
                initial={{ opacity: 0, x: 20, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 20, scale: 0.95 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className={cn(
                  "fixed z-40 top-4 right-4 bottom-4",
                  "w-[calc(100vw-2rem)] sm:w-[360px] flex flex-col p-6",
                  "rounded-3xl border border-border/50 bg-background/80 backdrop-blur-xl shadow-2xl overflow-y-auto"
                )}
              >
                <div className="mb-8 border-b border-border/50 pb-6 pr-10">
                  <div className="text-left flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-black text-xs">
                      IC
                    </div>
                    <span className="font-bold text-lg tracking-tight">Navigation</span>
                  </div>
                </div>

                <nav className="flex flex-col gap-3 flex-1">
                  {navLinks.map((link, i) => {
                    const isActive =
                      pathname === link.href ||
                      (link.href !== "/" && pathname.startsWith(link.href));
                    return (
                      <motion.div
                        key={link.name}
                        initial={{ x: 20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: i * 0.05 + 0.1 }}
                      >
                        <Link
                          href={link.href}
                          onClick={() => setIsOpen(false)}
                          className={cn(
                            "flex items-center justify-between p-4 rounded-2xl transition-all duration-200 group",
                            isActive
                              ? "bg-primary text-primary-foreground font-bold shadow-md"
                              : "hover:bg-muted font-medium text-foreground",
                          )}
                        >
                          {link.name}
                          <ArrowRight
                            className={cn(
                              "h-4 w-4 transition-transform group-hover:translate-x-1",
                              isActive ? "opacity-100" : "opacity-30",
                            )}
                          />
                        </Link>
                      </motion.div>
                    );
                  })}
                </nav>

                <div className="mt-8 border-t border-border/50 pt-8 flex flex-col gap-3">
                  <Link href="/tenant/login" onClick={() => setIsOpen(false)}>
                    <Button
                      variant="outline"
                      className="w-full rounded-2xl h-12 text-sm font-semibold border-border/50 hover:bg-muted"
                    >
                      Login
                    </Button>
                  </Link>
                  <Link href="/blog" onClick={() => setIsOpen(false)}>
                    <Button className="w-full rounded-2xl h-12 text-sm font-semibold shadow-md shadow-primary/20">
                      Start Reading
                    </Button>
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.header>
  );
}
