"use client";

import { createContext, useContext, useMemo } from "react";
import { usePathname } from "next/navigation";
import { useApiQuery } from "@/hooks/useApiQuery";
import { platformBannersApi } from "@/lib/api/platform-banners";
import { tenantBannersApi } from "@/lib/api/tenant-banners";
import { publicBannersApi } from "@/lib/api/public-banners";
import type { BannerRow } from "@/lib/banner/types";

type BannerApiResponse = {
  rows: BannerRow[];
  rowCount?: number;
};

interface BannerContextValue {
  banners: BannerRow[];
  isLoading: boolean;
}

const BannerContext = createContext<BannerContextValue | null>(null);

function scopeFromPath(pathname: string): "platform" | "tenant" | "public" {
  if (pathname.startsWith("/platform")) return "platform";
  if (pathname.startsWith("/tenant")) return "tenant";
  return "public";
}

export function BannerProvider({
  children,
  initialPublicBanners,
}: {
  children: React.ReactNode;
  initialPublicBanners?: BannerApiResponse | null;
}) {
  const pathname = usePathname();
  const scope = scopeFromPath(pathname || "/");
  const isPlatformAuthRoute = pathname === "/platform/login" || pathname === "/platform/signup";
  const isTenantAuthRoute = pathname === "/tenant/login" || pathname === "/tenant/signup";
  const enabled =
    scope === "public" || (scope === "platform" ? !isPlatformAuthRoute : !isTenantAuthRoute);

  const api =
    scope === "platform"
      ? platformBannersApi.getActive
      : scope === "tenant"
        ? tenantBannersApi.getActive
        : publicBannersApi.getActive;

  const queryParams = undefined;

  const { data, isLoading } = useApiQuery<BannerApiResponse>({
    key: [api.key, scope],
    endpoint: api.endpoint,
    method: api.method,
    queryParams,
    requireOrganization: scope === "tenant",
    enabled,
    options: {
      staleTime: 5 * 60 * 1000,
      initialData: scope === "public" ? initialPublicBanners ?? undefined : undefined,
    },
  });

  const value = useMemo<BannerContextValue>(
    () => ({ banners: data?.rows ?? [], isLoading }),
    [data, isLoading],
  );

  return <BannerContext.Provider value={value}>{children}</BannerContext.Provider>;
}

export function useBanner() {
  const value = useContext(BannerContext);
  if (!value) {
    throw new Error("useBanner must be used within BannerProvider");
  }
  return value;
}
