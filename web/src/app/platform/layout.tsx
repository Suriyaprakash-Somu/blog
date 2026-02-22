"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Sidebar } from "@/components/sidebar/Sidebar";
import { AbilityProvider } from "@/lib/casl";
import { usePlatformSession } from "@/lib/auth/usePlatformSession";
import { clientFetch } from "@/lib/client-fetch";
import { mapServerMenuToSidebar } from "@/lib/navigation/serverMenu";
import { isPathAllowedByNavigation } from "@/lib/access/navigationAccess";
import { BannerManager } from "@/components/banner/BannerManager";

export default function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const DASHBOARD_PATH = "/platform/dashboard";
  const router = useRouter();
  const pathname = usePathname();
  const isAuthRoute =
    pathname === "/platform/login" || pathname === "/platform/signup";
  const isDashboardRoute =
    pathname === DASHBOARD_PATH || pathname.startsWith(`${DASHBOARD_PATH}/`);
  const { data: adminSession, loading } = usePlatformSession({
    enabled: !isAuthRoute,
  });
  const isAllowedRoute =
    isAuthRoute ||
    isDashboardRoute ||
    (!loading && !!adminSession && isPathAllowedByNavigation(pathname, adminSession.navigation ?? []));

  useEffect(() => {
    if (loading || isAuthRoute) return;
    if (!adminSession) {
      router.replace("/platform/login");
      return;
    }

    if (isDashboardRoute) {
      return;
    }

    const allowed = isPathAllowedByNavigation(pathname, adminSession.navigation ?? []);
    if (!allowed) {
      router.replace(DASHBOARD_PATH);
    }
  }, [adminSession, loading, router, isAuthRoute, pathname, isDashboardRoute]);

  if (isAuthRoute) {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        Loading...
      </div>
    );
  }

  if (!adminSession) {
    return null;
  }

  if (!isAllowedRoute) {
    return null;
  }

  const handleLogout = async () => {
    try {
      await clientFetch(`/api/auth/platform/logout`, {
        method: "POST",
        body: {}, // Fix: Fastify complains if Content-Type is json but body is empty
      });
      router.replace("/platform/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <AbilityProvider permissions={adminSession.permissions ?? []}>
      <Sidebar
        menuItems={mapServerMenuToSidebar(adminSession.navigation ?? [])}
        title="Platform Admin"
        onLogout={handleLogout}
        showOrganizationSwitcher={false}
      >
        <BannerManager type="HEADER" />
        {children}
      </Sidebar>
    </AbilityProvider>
  );
}
