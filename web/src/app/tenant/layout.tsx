"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Sidebar } from "@/components/sidebar/Sidebar";
import { useTenantSession } from "@/lib/auth/useTenantSession";
import { clientFetch } from "@/lib/client-fetch";
import { AbilityProvider } from "@/lib/casl";
import { mapServerMenuToSidebar } from "@/lib/navigation/serverMenu";
import { isPathAllowedByNavigation } from "@/lib/access/navigationAccess";
import { BannerManager } from "@/components/banner/BannerManager";

export default function TenantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const DASHBOARD_PATH = "/tenant/dashboard";
  const router = useRouter();
  const pathname = usePathname();
  const isAuthRoute = pathname === "/tenant/login" || pathname === "/tenant/signup";
  const isDashboardRoute =
    pathname === DASHBOARD_PATH || pathname.startsWith(`${DASHBOARD_PATH}/`);
  const { data: session, isLoading } = useTenantSession();
  const isImpersonating = Boolean(session?.impersonator?.adminId);
  const isAllowedRoute =
    isAuthRoute ||
    isDashboardRoute ||
    (!isLoading && !!session && isPathAllowedByNavigation(pathname, session.navigation ?? []));

  useEffect(() => {
    if (isLoading || isAuthRoute) {
      return;
    }

    if (!session) {
      router.replace("/tenant/login");
      return;
    }

    if (isDashboardRoute) {
      return;
    }

    const allowed = isPathAllowedByNavigation(pathname, session.navigation ?? []);
    if (!allowed) {
      router.replace(DASHBOARD_PATH);
    }
  }, [session, isLoading, router, pathname, isAuthRoute, isDashboardRoute]);

  if (isAuthRoute) {
    return <>{children}</>;
  }

  const handleLogout = async () => {
    try {
      await clientFetch("/api/auth/tenant/logout", {
        method: "POST",
        body: {},
      });
      window.location.href = isImpersonating ? "/platform/tenants" : "/tenant/login";
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-muted/40">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!session) {
    return null; // Will redirect
  }

  if (!isAllowedRoute) {
    return null;
  }

  return (
    <AbilityProvider permissions={session.permissions}>
      <Sidebar
        menuItems={mapServerMenuToSidebar(session.navigation ?? [])}
        title={session.tenant?.name || "Workspace"}
        onLogout={handleLogout}
        showOrganizationSwitcher={false}
        user={session.user}
        roleName={session.role?.name}
      >
        {isImpersonating ? (
          <div className="mb-4 flex items-center justify-between rounded-md bg-amber-500 px-4 py-2 text-sm font-medium text-white">
            <span>
              You are impersonating <strong>{session.user.name}</strong>. Actions are audited.
            </span>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded bg-white/20 px-2 py-1 text-xs hover:bg-white/30"
            >
              Exit
            </button>
          </div>
        ) : null}
        <BannerManager type="HEADER" className="mb-4" />
        {children}
      </Sidebar>
    </AbilityProvider>
  );
}
