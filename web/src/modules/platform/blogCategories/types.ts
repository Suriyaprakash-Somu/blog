export interface PlatformBlogCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  status: "active" | "inactive";
  imageFileId: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  metaKeywords: string | null;
  content: string | null;
  faq: Array<{ question: string; answer: string }> | null;
  createdAt: string;
  updatedAt: string;
  [key: string]: unknown;
}
