export interface TenantUser {
  id: string;
  tenantId: string;
  name: string;
  email: string;
  phone?: string | null;
  roleId: string | null;
  status: "active" | "inactive";
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
  [key: string]: unknown;
}

export interface RoleOption {
  id: string;
  name: string;
  slug: string;
}

export interface TenantUserFormData {
  name: string;
  email: string;
  phone?: string;
  roleSlug: "owner" | "admin" | "manager" | "member";
  status?: "active" | "inactive";
  emailVerified?: boolean;
  password?: string;
}
