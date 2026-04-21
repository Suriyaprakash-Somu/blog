import type { BlogTag, NewBlogTag } from "./blogTags.schema.js";

export const BLOG_TAG_STATUSES = ["active", "inactive"] as const;
export type BlogTagStatus = (typeof BLOG_TAG_STATUSES)[number];

// API Request Types
export interface CreateBlogTagBody {
  name: string;
  slug: string;
  description?: string;
  imageFileId?: string;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  content?: string;
  faq?: Array<{ question: string; answer: string }>;
  status?: BlogTagStatus;
}

export type UpdateBlogTagBody = Partial<CreateBlogTagBody>;

export interface BlogTagIdParams {
  id: string;
}

export interface BlogTagQueryParams {
  page?: string;
  pageSize?: string;
  sorting?: string;
  filters?: string;
}

// API Response Types
export interface BlogTagListResponse {
  rows: BlogTag[];
  rowCount: number;
  page: number;
  pageSize: number;
  pageCount: number;
}

// Re-export schema types
export type { BlogTag, NewBlogTag };
