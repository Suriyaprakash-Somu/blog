export interface PlatformFeaturedItem {
  id: string;
  collectionId: string;
  entityType: "POST" | "CATEGORY" | "TAG";
  entityId: string;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
