import type { Metadata } from "next";
import { PageShell } from "@/components/layout/PageShell";
import { CTAManager } from "@/components/banner/CTAManager";
import { getPublicSiteSettings } from "@/lib/api/public-settings";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getPublicSiteSettings();
  const siteName = settings.identity.siteName || "Indian Context";

  return {
    title: "About",
    description: `Learn more about ${siteName} — our mission, our team, and our story.`,
    alternates: { canonical: "/about" },
    openGraph: {
      type: "website",
      title: `About | ${siteName}`,
      description: `Learn more about ${siteName} — our mission, our team, and our story.`,
      url: "/about",
    },
  };
}

export default async function AboutPage() {
  const settings = await getPublicSiteSettings();
  const siteName = settings.identity.siteName || "Indian Context";

  return (
    <PageShell className="py-12">
      <CTAManager slot="about-top" className="mb-6" />
      <div className="mx-auto max-w-2xl space-y-4 text-center">
        <h1 className="text-4xl font-bold tracking-tight">About {siteName}</h1>
        <p className="text-muted-foreground text-lg">
          A modern content platform delivering insightful stories, analysis, and curated collections.
        </p>
        <div className="rounded-xl border bg-card p-6 text-card-foreground shadow">
          <p>
            {siteName} is built for readers who value depth, context, and clarity.
            We bring together quality content, expert perspectives, and a seamless
            reading experience — all in one place.
          </p>
        </div>
      </div>
      <CTAManager slot="about-bottom" className="mt-6" />
    </PageShell>
  );
}
