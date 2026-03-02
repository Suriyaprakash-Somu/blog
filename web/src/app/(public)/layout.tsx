import type { ReactNode } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { getPublicSiteSettings } from "@/lib/api/public-settings";

export default async function PublicLayout({ children }: { children: ReactNode }) {
  const siteSettings = await getPublicSiteSettings();

  return (
    <div className="flex min-h-screen flex-col selection:bg-primary/30">
      <Navbar siteSettings={siteSettings} />
      <main className="flex-1 w-full flex flex-col pt-16">{children}</main>
      <Footer siteSettings={siteSettings} />
    </div>
  );
}
