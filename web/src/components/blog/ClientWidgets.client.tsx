"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";

// Note: Ensure you have a ProgressBar component or remove this if not needed.
// For now, only loading MobileTOCFab and DesktopSidebar below.

const MobileTOCFab = dynamic(
    () => import("./MobileTOCFab").then((mod) => ({ default: mod.MobileTOCFab })),
    { ssr: false, loading: () => null }
);

const DesktopSidebar = dynamic(
    () => import("./DesktopSidebar").then((mod) => ({ default: mod.DesktopSidebar })),
    { ssr: false, loading: () => null }
);

type Heading = { id: string; text: string; level: number };
type Tag = { id: string; name: string; slug: string };
type SecondaryCategory = { id: string; name: string; slug: string };
type PopularPost = { slug: string; title: string };
type RelatedPost = { slug: string; title: string };

export function ClientWidgets({
    headings = [],
    tags = [],
    secondaryCategories = [],
    popularPosts = [],
    relatedPosts = [],
}: {
    headings?: Heading[];
    tags?: Tag[];
    secondaryCategories?: SecondaryCategory[];
    popularPosts?: PopularPost[];
    relatedPosts?: RelatedPost[];
}) {
    return (
        <Suspense fallback={null}>
            <MobileTOCFab headings={headings} tags={tags} secondaryCategories={secondaryCategories} relatedPosts={relatedPosts} popularPosts={popularPosts} />
        </Suspense>
    );
}

export function SidebarWidgets({
    headings = [],
    tags = [],
    secondaryCategories = [],
    popularPosts = [],
    relatedPosts = [],
}: {
    headings?: Heading[];
    tags?: Tag[];
    secondaryCategories?: SecondaryCategory[];
    popularPosts?: PopularPost[];
    relatedPosts?: RelatedPost[];
}) {
    return (
        <Suspense fallback={null}>
            <DesktopSidebar headings={headings} tags={tags} secondaryCategories={secondaryCategories} relatedPosts={relatedPosts} popularPosts={popularPosts} />
        </Suspense>
    );
}
