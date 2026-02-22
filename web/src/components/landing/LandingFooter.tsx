import Link from "next/link";

export function LandingFooter() {
  return (
    <footer className="border-t bg-background py-12 md:py-16">
      <div className="container px-4 md:px-6">
        <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4">
          <div className="flex flex-col gap-4">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-xl font-bold tracking-tight text-primary">
                Blog Platform
              </span>
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
              href="/pricing"
              className="text-sm text-muted-foreground hover:underline"
            >
              Pricing
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
              href="/contact"
              className="text-sm text-muted-foreground hover:underline"
            >
              Contact
            </Link>
            <Link
              href="/careers"
              className="text-sm text-muted-foreground hover:underline"
            >
              Careers
            </Link>
            <Link
              href="/platform/login"
              className="text-sm text-muted-foreground hover:underline"
            >
              Admin Login
            </Link>
          </div>
          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold">Legal</h3>
            <Link
              href="/privacy"
              className="text-sm text-muted-foreground hover:underline"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              className="text-sm text-muted-foreground hover:underline"
            >
              Terms of Service
            </Link>
          </div>
        </div>
        <div className="mt-12 border-t pt-8 text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} Blog Platform. All rights
          reserved.
        </div>
      </div>
    </footer>
  );
}
