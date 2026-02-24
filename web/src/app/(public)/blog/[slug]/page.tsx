"use client";

import { useQuery } from "@tanstack/react-query";
import { publicBlogPostsApi } from "@/lib/api/public-blog-posts";
import { clientFetch } from "@/lib/client-fetch";
import { format } from "date-fns";
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTheme } from "next-themes";
import dynamic from "next/dynamic";

// Dynamically import the markdown preview to avoid SSR hydration issues
const MarkdownPreview = dynamic(
  () => import("@uiw/react-md-editor").then((mod) => mod.default.Markdown),
  {
    ssr: false,
    loading: () => (
      <div className="animate-pulse h-96 bg-muted/50 rounded-lg w-full"></div>
    ),
  },
);

interface PublicPostDetail {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  faq: { question: string; answer: string }[];
  publishedAt: string | null;
  readTimeMinutes: number;
  featuredImageUrl: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
}

export default function BlogPostPage() {
  const { slug } = useParams() as { slug: string };
  const { resolvedTheme } = useTheme();

  const {
    data: post,
    isLoading,
    isError,
  } = useQuery({
    queryKey: [publicBlogPostsApi.getBySlug.key, slug],
    queryFn: async () => {
      const res = await clientFetch<{ data: PublicPostDetail }>(
        publicBlogPostsApi.getBySlug.endpoint({ slug }),
      );
      return res.data;
    },
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError || !post) {
    return (
      <div className="container mx-auto px-4 py-32 text-center max-w-2xl">
        <h1 className="text-3xl font-bold mb-4">Post Not Found</h1>
        <p className="text-muted-foreground mb-8">
          The article you are looking for does not exist or has been removed.
        </p>
        <Link
          href="/blog"
          className="inline-flex items-center text-primary font-medium hover:underline"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Blog
        </Link>
      </div>
    );
  }

  return (
    <article className="container mx-auto px-4 py-8 max-w-4xl pb-24">
      <Link
        href="/blog"
        className="inline-flex items-center text-muted-foreground font-medium hover:text-foreground mb-8 text-sm transition-colors"
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to all articles
      </Link>

      <div className="space-y-4 mb-10 text-center">
        <div className="flex items-center justify-center gap-x-4 text-sm mb-4">
          <time
            dateTime={post.publishedAt || new Date().toISOString()}
            className="text-muted-foreground"
          >
            {post.publishedAt
              ? format(new Date(post.publishedAt), "MMMM d, yyyy")
              : "Recently"}
          </time>
          <span className="text-muted-foreground">•</span>
          <span className="text-muted-foreground">
            {post.readTimeMinutes || 5} min read
          </span>
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl text-balance">
          {post.title}
        </h1>
        {post.excerpt && (
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mt-4 text-balance">
            {post.excerpt}
          </p>
        )}
      </div>

      {post.featuredImageUrl && (
        <div className="aspect-video w-full overflow-hidden rounded-2xl bg-muted mb-16 shadow-lg">
          <img
            src={post.featuredImageUrl}
            alt={post.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className="prose prose-lg dark:prose-invert prose-primary mx-auto w-full max-w-none">
        <div data-color-mode={resolvedTheme === "dark" ? "dark" : "light"}>
          <MarkdownPreview
            source={post.content || "_No content provided._"}
            className="bg-transparent! text-foreground!"
            style={{ backgroundColor: "transparent", color: "inherit" }}
          />
        </div>
      </div>

      {post.faq && post.faq.length > 0 && (
        <div className="mt-20 border-t pt-10 mx-auto max-w-3xl">
          <h2 className="text-3xl font-bold tracking-tight mb-8">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            {post.faq.map((item, index) => (
              <div
                key={index}
                className="bg-secondary/20 p-6 rounded-xl border"
              >
                <h3 className="text-lg font-semibold mb-2">{item.question}</h3>
                <p className="text-muted-foreground">{item.answer}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </article>
  );
}
