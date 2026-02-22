"use client";

import { BannerManager } from "@/components/banner/BannerManager";

export function CTAManager({ slot, className }: { slot?: string; className?: string }) {
  return <BannerManager type="CTA" slot={slot} className={className} />;
}
