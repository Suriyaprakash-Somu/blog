import Link from "next/link";
import { Mail, Github, Twitter, Linkedin } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  const footerLinks = [
    {
      title: "Product",
      links: [
        { name: "Blog", href: "/blog" },
        { name: "Categories", href: "/categories" },
        { name: "Pricing", href: "/pricing" },
      ],
    },
    {
      title: "Company",
      links: [
        { name: "About Us", href: "/about" },
        { name: "Contact", href: "/contact" },
        { name: "Careers", href: "/careers" },
        { name: "Admin Login", href: "/platform/login" },
      ],
    },
    {
      title: "Legal",
      links: [
        { name: "Privacy Policy", href: "/privacy" },
        { name: "Terms of Service", href: "/terms" },
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
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground font-black shadow-lg text-sm">
                IC
              </div>
              <span className="text-2xl font-bold tracking-tight text-foreground">
                Indian Context
              </span>
            </Link>
            <p className="text-muted-foreground leading-relaxed">
              The definitive encyclopedic portal decoding every dimension of India. Curated insights, hard facts, and deep dives designed for students, researchers, and the intellectually curious.
            </p>
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full hover:bg-primary/10 hover:text-primary transition-all"
              >
                <Twitter className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full hover:bg-primary/10 hover:text-primary transition-all"
              >
                <Github className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full hover:bg-primary/10 hover:text-primary transition-all"
              >
                <Linkedin className="h-5 w-5" />
              </Button>
            </div>
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

        {/* Newsletter / Bottom area */}
        <div className="mt-20 border-t pt-10 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-sm text-muted-foreground">
            &copy; {currentYear} Indian Context. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-sm font-medium text-muted-foreground">
            <Link href="/rss" className="hover:text-primary transition-colors">
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

// Minimal Button internal implementation to avoid dependency issues if needed,
// but assuming @/components/ui/button exist:
import { Button } from "@/components/ui/button";
