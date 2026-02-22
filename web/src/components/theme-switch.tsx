"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { motion } from "framer-motion";

export function ThemeSwitch() {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="h-7 w-12 rounded-full bg-muted border border-input opacity-50" />
    );
  }

  const isDark = resolvedTheme === "dark";

  const toggleTheme = () => {
    setTheme(isDark ? "light" : "dark");
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`relative h-7 w-12 rounded-full border border-input transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
        isDark ? "bg-zinc-950" : "bg-zinc-100"
      }`}
      aria-label="Toggle theme"
    >
      <motion.div
        className="absolute top-0.5 left-0.5 flex h-5.5 w-5.5 items-center justify-center rounded-full bg-background shadow-sm ring-0"
        animate={{
          x: isDark ? 20 : 0,
        }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
      >
        <div className="relative flex items-center justify-center h-full w-full">
          <Sun
            className={`h-3.5 w-3.5 text-yellow-500 absolute transition-opacity duration-200 ${isDark ? "opacity-0 scale-0" : "opacity-100 scale-100"}`}
          />
          <Moon
            className={`h-3.5 w-3.5 text-zinc-900 dark:text-zinc-100 absolute transition-opacity duration-200 ${isDark ? "opacity-100 scale-100" : "opacity-0 scale-0"}`}
          />
        </div>
      </motion.div>
    </button>
  );
}
