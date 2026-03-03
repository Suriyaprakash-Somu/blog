import Link from "next/link";
import { Twitter, Linkedin, Facebook, Instagram, Youtube, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SiteSettings, SocialLinks } from "@/lib/api/public-settings";

/* ── Social icon map ───────────────────────────────── */

const SOCIAL_ICON_MAP: {
  key: keyof SocialLinks;
  icon: React.ElementType;
  label: string;
}[] = [
    { key: "twitter", icon: Twitter, label: "Twitter" },
    { key: "facebook", icon: Facebook, label: "Facebook" },
    { key: "instagram", icon: Instagram, label: "Instagram" },
    { key: "youtube", icon: Youtube, label: "YouTube" },
    { key: "linkedin", icon: Linkedin, label: "LinkedIn" },
    { key: "website", icon: Globe, label: "Website" },
  ];

/* ── Footer ────────────────────────────────────────── */

export function Footer({ siteSettings }: { siteSettings?: SiteSettings }) {
  const currentYear = new Date().getFullYear();

  const lightLogo = siteSettings?.logos?.lightLogoUrl;
  const darkLogo = siteSettings?.logos?.darkLogoUrl;
  const hasLogo = !!lightLogo || !!darkLogo;

  const socialLinks = siteSettings?.socialLinks ?? {};
  const activeSocials = SOCIAL_ICON_MAP.filter(
    (s) => socialLinks[s.key] && socialLinks[s.key]!.trim() !== "",
  );

  const footerLinks = [
    {
      title: "Product",
      links: [
        { name: "Blog", href: "/blog" },
        { name: "Categories", href: "/categories" },
      ],
    },
    {
      title: "Company",
      links: [
        { name: "About Us", href: "/about" },
        { name: "Login", href: "/tenant/login" },
      ],
    },
    {
      title: "Legal",
      links: [
        { name: "Privacy Policy", href: "/privacy-policy" },
        { name: "Terms of Service", href: "/terms-and-conditions" },
        { name: "Cookie Policy", href: "/cookies" },
      ],
    },
  ];

  return (
    <footer className="border-t bg-card/30 backdrop-blur-sm overflow-hidden">
      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-8">
          {/* Brand Column */}
          <div className="flex flex-col gap-6 max-w-sm">
            <Link href="/" className="flex items-center gap-2">
              {hasLogo ? (
                <>
                  {lightLogo && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={lightLogo}
                      alt={siteSettings.identity.siteName}
                      className={cn(
                        "h-10 w-auto object-contain",
                        darkLogo ? "dark:hidden" : "",
                      )}
                    />
                  )}
                  {darkLogo && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={darkLogo}
                      alt={siteSettings.identity.siteName}
                      className={cn(
                        "h-10 w-auto object-contain",
                        lightLogo ? "hidden dark:block" : "",
                      )}
                    />
                  )}
                  {/* Site Name text next to logo (optional, can be hidden on small screens) */}
                  <span className="hidden sm:inline-block text-2xl font-bold tracking-tight text-foreground ml-1">
                    {siteSettings?.identity?.siteName ?? "Brand"}
                  </span>
                </>
              ) : (
                <>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground font-black shadow-lg text-sm shrink-0">
                    {siteSettings?.identity?.shortName ?? "BR"}
                  </div>
                  <span className="text-2xl font-bold tracking-tight text-foreground">
                    {siteSettings?.identity?.siteName ?? "Brand Name"}
                  </span>
                </>
              )}
            </Link>
            <p className="text-muted-foreground leading-relaxed">
              The definitive encyclopedic portal decoding every dimension of
              India. Curated insights, hard facts, and deep dives designed for
              students, researchers, and the intellectually curious.
            </p>
            {/* Social Links — dynamic from settings */}
            {activeSocials.length > 0 && (
              <div className="flex items-center gap-3">
                {activeSocials.map(({ key, icon: Icon, label }) => (
                  <a
                    key={key}
                    href={socialLinks[key]!}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="inline-flex items-center justify-center h-10 w-10 rounded-full text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all"
                  >
                    <Icon className="h-5 w-5" />
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Links Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-8">
            {footerLinks.map((section) => (
              <div key={section.title} className="flex flex-col gap-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground/60">
                  {section.title}
                </h3>
                <nav className="flex flex-col gap-3">
                  {section.links.map((link) => (
                    <Link
                      key={link.name}
                      href={link.href}
                      className="text-base text-muted-foreground hover:text-primary transition-colors flex items-center group"
                    >
                      <span className="w-0 group-hover:w-1.5 h-[1.5px] bg-primary transition-all mr-0 group-hover:mr-2 rounded-full" />
                      {link.name}
                    </Link>
                  ))}
                </nav>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom area */}
        <div className="mt-20 border-t pt-10 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-sm text-muted-foreground">
            &copy; {currentYear} {siteSettings?.identity?.siteName ?? "Brand"}. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-sm font-medium text-muted-foreground">
            <Link href="/rss.xml" className="hover:text-primary transition-colors">
              RSS Feed
            </Link>
            <Link
              href="/sitemap.xml"
              className="hover:text-primary transition-colors"
            >
              Sitemap
            </Link>
          </div>
        </div>
      </div>

      {/* Visual embellishment */}
      <div className="h-1.5 w-full bg-linear-to-r from-primary/20 via-primary to-primary/20" />
    </footer>
  );
}
