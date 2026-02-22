export interface PlatformUser {
  id: string;
  name: string;
  email: string;
  roleId: string | null;
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

export interface PlatformUserFormData {
  name: string;
  email: string;
  roleSlug: "owner" | "admin" | "manager" | "member";
  emailVerified?: boolean;
  password?: string;
}
