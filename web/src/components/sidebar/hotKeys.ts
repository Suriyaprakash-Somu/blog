"use client";

import { useEffect, useRef, useCallback } from "react";
import { CHORD_TIMEOUT } from "./constants";

/**
 * Detect if running on Mac
 */
function detectMac(): boolean {
  if (typeof window === "undefined") return false;

  const nav = navigator as Navigator & {
    userAgentData?: { platform?: string };
  };

  if (nav.userAgentData?.platform) {
    return nav.userAgentData.platform === "macOS";
  }

  return /Mac|iPod|iPhone|iPad/.test(navigator.platform);
}

const isMac = detectMac();

export const kbdGlyph = isMac ? "⌘" : "Ctrl";

/**
 * Format hotkey for display
 */
export function formatHotkey(hk: string | undefined): string {
  if (!hk) return "";

  const parts = hk.split(" ").map((part) =>
    part
      .replace(/mod\+/gi, kbdGlyph + "+")
      .replace(/ctrl\+/gi, isMac ? "⌃+" : "Ctrl+")
      .replace(/alt\+/gi, isMac ? "⌥+" : "Alt+")
      .replace(/shift\+/gi, isMac ? "⇧+" : "Shift+")
      .toUpperCase()
  );

  return parts.join(" ");
}

/**
 * Normalize hotkey for matching
 */
export function normaliseHotkey(hk: string): string {
  const parts = hk.toLowerCase().trim().split(/\s+/);

  return parts
    .map((part) => {
      part = part.replace(/mod\+/gi, "ctrl+");
      const tokens = part.split("+");
      const key = tokens.pop() ?? "";
      const modifiers = tokens.sort();
      return [...modifiers, key].join("+");
    })
    .join(" ");
}

/**
 * Build combo string from keyboard event
 */
function buildCombo(e: KeyboardEvent): string {
  const modifiers: string[] = [];

  if (e.altKey) modifiers.push("alt");
  if (e.ctrlKey || e.metaKey) modifiers.push("ctrl");
  if (e.shiftKey) modifiers.push("shift");

  modifiers.sort();

  const key = e.key.toLowerCase();

  if (["control", "meta", "alt", "shift"].includes(key)) {
    return "";
  }

  return [...modifiers, key].join("+");
}

/**
 * Hook for global keyboard shortcuts
 */
export function useGlobalHotkeys(map: Map<string, () => void>): void {
  const chordPrefixRef = useRef<string | null>(null);
  const chordTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearChord = useCallback(() => {
    chordPrefixRef.current = null;
    if (chordTimeoutRef.current) {
      clearTimeout(chordTimeoutRef.current);
      chordTimeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") {
        clearChord();
        return;
      }

      const combo = buildCombo(e);
      if (!combo) return;

      if (chordPrefixRef.current) {
        const fullChord = `${chordPrefixRef.current} ${combo}`;
        const exec = map.get(fullChord);

        clearChord();

        if (exec) {
          e.preventDefault();
          exec();
          return;
        }
      }

      const exec = map.get(combo);
      if (exec) {
        e.preventDefault();
        clearChord();
        exec();
        return;
      }

      let isChordStart = false;
      map.forEach((_, key) => {
        if (key.startsWith(combo + " ")) {
          isChordStart = true;
        }
      });

      if (isChordStart) {
        e.preventDefault();
        chordPrefixRef.current = combo;

        chordTimeoutRef.current = setTimeout(() => {
          chordPrefixRef.current = null;
        }, CHORD_TIMEOUT);
      }
    };

    window.addEventListener("keydown", handler);
    return () => {
      window.removeEventListener("keydown", handler);
      clearChord();
    };
  }, [map, clearChord]);
}
