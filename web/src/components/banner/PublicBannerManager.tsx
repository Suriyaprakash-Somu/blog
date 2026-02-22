"use client";

import { usePathname } from "next/navigation";
import { BannerManager } from "@/components/banner/BannerManager";

export function PublicBannerManager() {
  const pathname = usePathname();
  const isPlatformScope = pathname.startsWith("/platform") || pathname.startsWith("/tenant") || pathname.startsWith("/admin");

  if (isPlatformScope) {
    return null;
  }

  return <BannerManager type="HEADER" />;
}
