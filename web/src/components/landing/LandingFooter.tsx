import Link from "next/link";
import { cn } from "@/lib/utils";
import type { SiteSettings } from "@/lib/api/public-settings";

export function LandingFooter({ siteSettings }: { siteSettings?: SiteSettings }) {
  const currentYear = new Date().getFullYear();
  const siteName = siteSettings?.identity?.siteName ?? "Blog Platform";
  const shortName = siteSettings?.identity?.shortName ?? "BP";
  const lightLogo = siteSettings?.logos?.lightLogoUrl;
  const darkLogo = siteSettings?.logos?.darkLogoUrl;
  const hasLogo = !!lightLogo || !!darkLogo;

  return (
    <footer className="border-t bg-background py-12 md:py-16">
      <div className="container px-4 md:px-6">
        <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4">
          <div className="flex flex-col gap-4">
            <Link href="/" className="flex items-center gap-2">
              {hasLogo ? (
                <>
                  {lightLogo && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={lightLogo}
                      alt={siteName}
                      className={cn(
                        "h-8 w-auto object-contain",
                        darkLogo ? "dark:hidden" : "",
                      )}
                    />
                  )}
                  {darkLogo && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={darkLogo}
                      alt={siteName}
                      className={cn(
                        "h-8 w-auto object-contain",
                        lightLogo ? "hidden dark:block" : "",
                      )}
                    />
                  )}
                  <span className="text-xl font-bold tracking-tight text-primary ml-1">
                    {siteName}
                  </span>
                </>
              ) : (
                <>
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-black shadow-md text-xs shrink-0">
                    {shortName}
                  </div>
                  <span className="text-xl font-bold tracking-tight text-primary">
                    {siteName}
                  </span>
                </>
              )}
            </Link>
            <p className="text-sm text-muted-foreground">
              Empowering creators with modern tools for content management.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold">Product</h3>
            <Link
              href="#features"
              className="text-sm text-muted-foreground hover:underline"
            >
              Features
            </Link>
            <Link
              href="/showcase"
              className="text-sm text-muted-foreground hover:underline"
            >
              Showcase
            </Link>
          </div>
          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold">Company</h3>
            <Link
              href="/about"
              className="text-sm text-muted-foreground hover:underline"
            >
              About Us
            </Link>
            <Link
              href="/tenant/login"
              className="text-sm text-muted-foreground hover:underline"
            >
              Login
            </Link>
          </div>
          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold">Legal</h3>
            <Link
              href="/privacy-policy"
              className="text-sm text-muted-foreground hover:underline"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms-and-conditions"
              className="text-sm text-muted-foreground hover:underline"
            >
              Terms of Service
            </Link>
            <Link
              href="/cookies"
              className="text-sm text-muted-foreground hover:underline"
            >
              Cookie Policy
            </Link>
          </div>
        </div>
        <div className="mt-12 border-t pt-8 text-center text-sm text-muted-foreground">
          &copy; {currentYear} {siteName}. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
