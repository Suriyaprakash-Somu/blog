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
import { Menu, ArrowRight } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ThemeSwitch } from "@/components/theme-switch";
import { cn } from "@/lib/utils";

const navLinks = [
  { name: "Home", href: "/" },
  { name: "Blog", href: "/blog" },
  { name: "Categories", href: "/categories" },
];

export function Navbar() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isScrolled, setIsScrolled] = React.useState(false);
  const pathname = usePathname();

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <motion.header
      initial={false}
      animate={{
        height: isScrolled ? "72px" : "80px",
      }}
      className={cn(
        "fixed top-0 left-0 right-0 z-50 flex items-center transition-all duration-300 border-b",
        isScrolled
          ? "bg-background/80 backdrop-blur-xl border-border/40 shadow-sm"
          : "bg-transparent border-transparent",
      )}
    >
      <div className="container mx-auto w-full max-w-7xl flex items-center justify-between px-4 md:px-6">
        {/* Logo */}
        <Link href="/" className="group flex items-center gap-2">
          <motion.div
            whileHover={{ rotate: 10, scale: 1.1 }}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground font-black shadow-lg text-sm"
          >
            IC
          </motion.div>
          <span className="text-xl font-bold tracking-tight text-foreground group-hover:text-primary transition-colors">
            Indian Context
          </span>
        </Link>
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1 bg-muted/40 p-1 rounded-full border border-border/40 backdrop-blur-sm">
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
            href="/platform/login"
            className="text-sm font-medium hover:text-primary transition-colors"
          >
            Editor Login
          </Link>
          <Link href="/articles">
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
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger
              className={cn(
                buttonVariants({ variant: "ghost", size: "icon" }),
                "rounded-full hover:bg-primary/10 hover:text-primary transition-colors",
              )}
            >
              <Menu className="h-6 w-6" />
              <span className="sr-only">Toggle menu</span>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-[300px] sm:w-[400px] flex flex-col p-6"
            >
              <SheetHeader className="mb-8 border-b pb-6">
                <SheetTitle className="text-left flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-black text-xs">
                    IC
                  </div>
                  <span className="font-bold">Navigation</span>
                </SheetTitle>
              </SheetHeader>

              <nav className="flex flex-col gap-4 flex-1">
                {navLinks.map((link, i) => {
                  const isActive =
                    pathname === link.href ||
                    (link.href !== "/" && pathname.startsWith(link.href));
                  return (
                    <motion.div
                      key={link.name}
                      initial={{ x: 20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: i * 0.1 }}
                    >
                      <Link
                        href={link.href}
                        onClick={() => setIsOpen(false)}
                        className={cn(
                          "flex items-center justify-between p-4 rounded-2xl transition-all duration-300 group",
                          isActive
                            ? "bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/20"
                            : "hover:bg-muted font-medium",
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

              <div className="mt-auto border-t pt-8 flex flex-col gap-4">
                <Link href="/platform/login" onClick={() => setIsOpen(false)}>
                  <Button
                    variant="outline"
                    className="w-full rounded-2xl h-12 text-base font-semibold"
                  >
                    Editor Login
                  </Button>
                </Link>
                <Link href="/articles" onClick={() => setIsOpen(false)}>
                  <Button className="w-full rounded-2xl h-12 text-base font-semibold shadow-lg shadow-primary/20">
                    Start Reading
                  </Button>
                </Link>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </motion.header>
  );
}
