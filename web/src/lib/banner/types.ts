export type BannerRow = {
  id: string;
  title: string;
  description?: string | null;
  pathPattern: string;
  type: "HEADER" | "CTA";
  slot?: string | null;
  targetSegments?: string[] | null;
  imageFileId?: string | null;
  isActive: boolean;
  startDate?: string | null;
  endDate?: string | null;
  props?: Record<string, unknown> | null;
};
