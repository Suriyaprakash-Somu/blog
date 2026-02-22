import type { BlogCategory, NewBlogCategory } from "./blogCategories.schema.js";

export const BLOG_CATEGORY_STATUSES = ["active", "inactive"] as const;
export type BlogCategoryStatus = (typeof BLOG_CATEGORY_STATUSES)[number];

// API Request Types
export interface CreateBlogCategoryBody {
  name: string;
  slug: string;
  description?: string;
  status?: BlogCategoryStatus;
  imageFileId?: string;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
}

export type UpdateBlogCategoryBody = Partial<CreateBlogCategoryBody>;

export interface BlogCategoryIdParams {
  id: string;
}

export interface BlogCategoryQueryParams {
  page?: string;
  pageSize?: string;
  sorting?: string;
  filters?: string;
}

// API Response Types
export interface BlogCategoryListResponse {
  rows: BlogCategory[];
  rowCount: number;
  page: number;
  pageSize: number;
  pageCount: number;
}

// Re-export schema types
export type { BlogCategory, NewBlogCategory };
