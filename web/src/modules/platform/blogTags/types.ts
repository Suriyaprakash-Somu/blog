export interface PlatformBlogTag {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageFileId: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  metaKeywords: string | null;
  status: "active" | "inactive";
  createdAt: string;
  updatedAt: string;
  [key: string]: unknown;
}
