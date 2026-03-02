"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { List, X } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type Heading = { id: string; text: string; level: number };
type Tag = { id: string; name: string; slug: string };
type SecondaryCategory = { id: string; name: string; slug: string };
type PopularPost = { slug: string; title: string; views?: number; isPinned?: boolean; isFeatured?: boolean };

export function MobileTOCFab({
    headings = [],
    tags = [],
    secondaryCategories = [],
    popularPosts = [],
}: {
    headings?: Heading[];
    tags?: Tag[];
    secondaryCategories?: SecondaryCategory[];
    popularPosts?: PopularPost[];
}) {
    const [open, setOpen] = useState(false);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<"toc" | "categories" | "popular">("toc");
    const panelRef = useRef<HTMLDivElement>(null);

    const ids = useMemo(() => headings.map((h) => h.id), [headings]);

    useEffect(() => {
        if (!ids.length) return;

        const observer = new IntersectionObserver(
            (entries) => {
                const visible = entries
                    .filter((e) => e.isIntersecting)
                    .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

                if (visible[0]?.target?.id) {
                    setActiveId(visible[0].target.id);
                    return;
                }

                const above = entries
                    .map((e) => e.target)
                    .filter((el) => el.getBoundingClientRect().top <= 100);

                const lastAbove = above[above.length - 1];
                if (lastAbove) setActiveId(lastAbove.id);
            },
            {
                root: null,
                rootMargin: "-20% 0px -70% 0px",
                threshold: [0, 0.1, 0.25, 0.5, 0.75, 1],
            }
        );

        ids.forEach((id) => {
            const el = document.getElementById(id);
            if (el) observer.observe(el);
        });

        return () => observer.disconnect();
    }, [ids]);

    const onLinkClick = () => setOpen(false);

    useEffect(() => {
        if (!open) return;
        const onDocClick = (e: MouseEvent | TouchEvent) => {
            const panel = panelRef.current;
            if (!panel) return;
            if (!panel.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener("mousedown", onDocClick);
        document.addEventListener("touchstart", onDocClick, { passive: true });
        return () => {
            document.removeEventListener("mousedown", onDocClick);
            document.removeEventListener("touchstart", onDocClick);
        };
    }, [open]);

    const hasTOC = headings.length > 0;
    const hasPopular = popularPosts.length > 0;
    const hasTags = tags.length > 0;
    const hasSecondaryCategories = secondaryCategories.length > 0;

    if (!hasTOC && !hasPopular && !hasTags && !hasSecondaryCategories) return null;

    return (
        <div className="lg:hidden">
            <Button
                type="button"
                variant="outline"
                size="icon"
                title="Table of Contents"
                onClick={() => setOpen((v) => !v)}
                aria-expanded={open}
                aria-controls="mobile-toc-panel"
                aria-label={open ? "Close table of contents" : "Open table of contents"}
                className="fixed right-3 top-1/2 -translate-y-1/2 z-40 rounded-full bg-primary/90 border-primary backdrop-blur shadow-lg w-10 h-10 text-primary-foreground hover:bg-primary focus:ring-2 focus:ring-primary/50 transition-all"
            >
                {open ? <X className="h-5 w-5" /> : <List className="h-5 w-5" />}
            </Button>

            <div
                id="mobile-toc-panel"
                ref={panelRef}
                className={cn(
                    "fixed z-40 top-1/2 -translate-y-1/2 right-3",
                    "w-[85vw] max-w-[320px] rounded-2xl border border-border/50 bg-background/80 backdrop-blur-xl shadow-2xl",
                    "transition-all duration-300 ease-out origin-right",
                    open ? "scale-100 opacity-100 pointer-events-auto" : "scale-95 opacity-0 pointer-events-none"
                )}
                role="dialog"
                aria-label="Table of contents"
            >
                {/* Tab Header */}
                <div className="p-3 border-b border-border/50 overflow-x-auto scrollbar-hide">
                    <div className="flex items-center gap-2 min-w-max">
                        {hasTOC && (
                            <button
                                onClick={() => setActiveTab("toc")}
                                className={cn(
                                    "text-[11px] uppercase tracking-wider px-3 py-1.5 rounded-full transition-colors whitespace-nowrap font-medium",
                                    activeTab === "toc"
                                        ? "bg-primary text-primary-foreground shadow-sm"
                                        : "text-muted-foreground hover:bg-muted/80"
                                )}
                            >
                                On this page
                            </button>
                        )}
                        {hasSecondaryCategories || hasTags ? (
                            <button
                                onClick={() => setActiveTab("categories")}
                                className={cn(
                                    "text-[11px] uppercase tracking-wider px-3 py-1.5 rounded-full transition-colors whitespace-nowrap font-medium",
                                    activeTab === "categories"
                                        ? "bg-primary text-primary-foreground shadow-sm"
                                        : "text-muted-foreground hover:bg-muted/80"
                                )}
                            >
                                {hasSecondaryCategories && hasTags ? "Categories & Tags" : hasSecondaryCategories ? "Categories" : "Tags"}
                            </button>
                        ) : null}
                        {hasPopular && (
                            <button
                                onClick={() => setActiveTab("popular")}
                                className={cn(
                                    "text-[11px] uppercase tracking-wider px-3 py-1.5 rounded-full transition-colors whitespace-nowrap font-medium",
                                    activeTab === "popular"
                                        ? "bg-primary text-primary-foreground shadow-sm"
                                        : "text-muted-foreground hover:bg-muted/80"
                                )}
                            >
                                Popular
                            </button>
                        )}
                    </div>
                </div>

                {/* Scrollable container */}
                <div className="max-h-[60vh] overflow-y-auto p-4 text-sm scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
                    {/* TOC Section */}
                    {activeTab === "toc" && hasTOC && (
                        <ul className="space-y-3">
                            {headings.map((h) => {
                                const isActive = h.id === activeId;
                                return (
                                    <li key={h.id}>
                                        <Link
                                            href={`#${h.id}`}
                                            onClick={onLinkClick}
                                            style={{ paddingLeft: (h.level - 1) * 12 }}
                                            className={cn(
                                                "block leading-snug transition-colors line-clamp-2",
                                                isActive
                                                    ? "font-semibold text-primary"
                                                    : "text-muted-foreground hover:text-foreground"
                                            )}
                                        >
                                            {h.text}
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    )}

                    {/* Categories Section */}
                    {activeTab === "categories" && (hasSecondaryCategories || hasTags) && (
                        <div className="space-y-6">
                            {hasSecondaryCategories && (
                                <div>
                                    <h3 className="text-[10px] uppercase tracking-wider font-bold mb-3 text-muted-foreground/80">
                                        Categories
                                    </h3>
                                    <div className="flex flex-wrap gap-2">
                                        {secondaryCategories.map((cat) => (
                                            <Link
                                                key={cat.id}
                                                href={`/categories/${cat.slug}`}
                                                onClick={onLinkClick}
                                                className="text-xs px-2.5 py-1 rounded-md bg-transparent text-primary hover:underline transition-colors whitespace-nowrap font-medium"
                                            >
                                                {cat.name}
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {hasTags && (
                                <div>
                                    <h3 className="text-[10px] uppercase tracking-wider font-bold mb-3 text-muted-foreground/80">
                                        Tags
                                    </h3>
                                    <div className="flex flex-wrap gap-2">
                                        {tags.map((tag) => (
                                            <Link
                                                key={tag.id}
                                                href={`/tags/${tag.slug}`}
                                                onClick={onLinkClick}
                                                className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors whitespace-nowrap"
                                            >
                                                {tag.name}
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Popular Section */}
                    {activeTab === "popular" && hasPopular && (
                        <div>
                            <h3 className="text-[10px] uppercase tracking-wider font-bold mb-3 text-muted-foreground/80">
                                Trending
                            </h3>
                            <ul className="space-y-3">
                                {popularPosts.map((post, i) => (
                                    <li key={i} className="group border-b border-border/30 pb-3 last:border-0 last:pb-0">
                                        <Link
                                            href={`/blog/${post.slug}`}
                                            onClick={onLinkClick}
                                            className="block"
                                        >
                                            <h4 className="text-sm font-medium leading-tight group-hover:text-primary transition-colors line-clamp-2 mb-1">
                                                {post.title}
                                            </h4>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
