import type { Branch, NewBranch } from "./branches.schema.js";

// Branch type constants
export const BRANCH_TYPES = ["farm", "outlet", "warehouse", "office"] as const;
export type BranchType = (typeof BRANCH_TYPES)[number];

export const BRANCH_STATUSES = ["active", "inactive"] as const;
export type BranchStatus = (typeof BRANCH_STATUSES)[number];

// API Request Types
export interface CreateBranchBody {
  name: string;
  code?: string;
  type?: BranchType;
  imageFileId: string; // Required
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
  latitude?: string; // Numeric as string from form
  longitude?: string;
  phone?: string;
  email?: string;
  managerId?: string;
  gstin?: string;
  isHeadquarters?: boolean;
}

export type UpdateBranchBody = Partial<CreateBranchBody>;

export interface BranchIdParams {
  id: string;
}

export interface BranchQueryParams {
  page?: string;
  pageSize?: string;
  sorting?: string;
  filters?: string;
}

// API Response Types
export interface BranchListResponse {
  rows: Branch[];
  rowCount: number;
  page: number;
  pageSize: number;
  pageCount: number;
}

// Re-export schema types
export type { Branch, NewBranch };
