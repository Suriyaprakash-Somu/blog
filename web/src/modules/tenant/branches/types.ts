// Branch type constants
export const BRANCH_TYPES = ["farm", "outlet", "warehouse", "office"] as const;
export type BranchType = (typeof BRANCH_TYPES)[number];

export const BRANCH_STATUSES = ["active", "inactive"] as const;
export type BranchStatus = (typeof BRANCH_STATUSES)[number];

// Branch entity
export interface Branch {
  id: string;
  tenantId: string;
  name: string;
  code?: string | null;
  type: BranchType;
  status: BranchStatus;
  imageFileId?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  pincode?: string | null;
  latitude?: string | null;
  longitude?: string | null;
  phone?: string | null;
  email?: string | null;
  managerId?: string | null;
  gstin?: string | null;
  isHeadquarters: boolean;
  createdAt: string;
  updatedAt: string;
  [key: string]: unknown; // Required by DataTable's RowWithId constraint
}

// Form data structure (used with RHF)
export interface BranchFormData {
  name: string;
  code?: string;
  type: BranchType;
  imageFileId: string; // Required
  addressLine1?: string;
  addressLine2?: string;
  // Location object from MapPicker
  location?: {
    lat?: number;
    lng?: number;
    city?: string;
    state?: string;
    country?: string;
    pincode?: string;
    addressLine?: string;
  };
  phone?: string;
  email?: string;
  managerId?: string;
  gstin?: string;
  isHeadquarters?: boolean;
}

// API response
export interface BranchListResponse {
  rows: Branch[];
  rowCount: number;
  page: number;
  pageSize: number;
  pageCount: number;
}
