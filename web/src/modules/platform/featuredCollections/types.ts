export interface PlatformFeaturedCollection {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isActive: boolean;
  createdByAdminId: string | null;
  updatedByAdminId: string | null;
  createdAt: string;
  updatedAt: string;
  [key: string]: any;
}
