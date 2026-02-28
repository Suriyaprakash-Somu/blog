export interface PlatformBlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string | null;
  tableOfContents: { id: string; text: string; level: number }[] | null;
  readTimeMinutes: number | null;
  faq: { question: string; answer: string }[] | null;
  status: "draft" | "published" | "archived";
  publishedAt: string | null;
  isFeatured: boolean;
  categoryId: string | null;
  featuredImageFileId: string | null;
  contentImageFileIds: string[] | null;
  authorId: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  metaKeywords: string | null;
  createdAt: string;
  updatedAt: string;
  [key: string]: unknown;
}
