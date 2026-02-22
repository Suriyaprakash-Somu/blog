export type BannerType = "HEADER" | "CTA";
export type BannerTargetSegment = "USER" | "GUEST";

export interface PlatformBanner {
  id: string;
  title: string;
  description?: string | null;
  pathPattern: string;
  type: BannerType;
  slot?: string | null;
  targetSegments?: BannerTargetSegment[] | null;
  imageFileId?: string | null;
  isActive: boolean;
  startDate?: string | null;
  endDate?: string | null;
  props?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
  [key: string]: unknown;
}
