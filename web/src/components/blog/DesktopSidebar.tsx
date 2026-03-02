"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type Heading = { id: string; text: string; level: number };
type Tag = { id: string; name: string; slug: string };
type SecondaryCategory = { id: string; name: string; slug: string };
type PopularPost = { slug: string; title: string };

export function DesktopSidebar({
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
    const [activeId, setActiveId] = useState<string | null>(null);

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

    const hasTOC = headings.length > 0;
    const hasPopular = popularPosts.length > 0;
    const hasTags = tags.length > 0;
    const hasSecondaryCategories = secondaryCategories.length > 0;

    if (!hasTOC && !hasPopular && !hasTags && !hasSecondaryCategories) return null;

    return (
        <aside className="sticky top-24 hidden lg:flex flex-col gap-8 max-h-[calc(100vh-8rem)] overflow-y-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent pr-2 pb-8">
            {/* TOC Section */}
            {hasTOC && (
                <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground/60 mb-4 px-2">
                        On this page
                    </h3>
                    <ul className="space-y-3 px-2 relative">
                        <div className="absolute left-2.5 top-0 bottom-0 w-px bg-border/40" />
                        {headings.map((h) => {
                            const isActive = h.id === activeId;
                            return (
                                <li key={h.id} className="relative z-10">
                                    <Link
                                        href={`#${h.id}`}
                                        style={{ paddingLeft: (h.level - 1) * 12 + 10 }}
                                        className={cn(
                                            "block text-sm leading-tight transition-colors line-clamp-2 py-0.5",
                                            isActive
                                                ? "font-semibold text-primary"
                                                : "text-muted-foreground hover:text-foreground"
                                        )}
                                    >
                                        {isActive && (
                                            <div className="absolute left-0 top-1.5 w-1.5 h-1.5 rounded-full bg-primary ring-4 ring-background" />
                                        )}
                                        {h.text}
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            )}

            {/* Secondary Categories */}
            {hasSecondaryCategories && (
                <div className="px-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground/60 mb-4">
                        Categories
                    </h3>
                    <div className="flex flex-col gap-2">
                        {secondaryCategories.map((cat) => (
                            <Link
                                key={cat.id}
                                href={`/categories/${cat.slug}`}
                                className="text-xs text-primary hover:underline transition-colors whitespace-nowrap font-medium w-fit"
                            >
                                {cat.name}
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {/* Tags Section */}
            {hasTags && (
                <div className="px-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground/60 mb-4">
                        Tags
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        {tags.map((tag) => (
                            <Link
                                key={tag.id}
                                href={`/tags/${tag.slug}`}
                                className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors whitespace-nowrap"
                            >
                                {tag.name}
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {/* Popular Posts */}
            {hasPopular && (
                <div className="px-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground/60 mb-4">
                        Popular Posts
                    </h3>
                    <ul className="space-y-4">
                        {popularPosts.map((post, i) => (
                            <li key={i} className="group">
                                <Link href={`/blog/${post.slug}`} className="block">
                                    <h4 className="text-sm font-medium leading-tight group-hover:text-primary transition-colors line-clamp-2">
                                        {post.title}
                                    </h4>
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </aside>
    );
}
