import type { Metadata } from "next";
import { getPublicSiteSettings } from "@/lib/api/public-settings";
import AboutContent from "./AboutContent";
import { JsonLd } from "@/components/seo/JsonLd";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getPublicSiteSettings();
  const siteName = settings.identity.siteName || "Indian Context";

  return {
    title: "About",
    description: `Learn more about ${siteName} — our mission to decode India's multidimensional identity.`,
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
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://indiancontext.com";

  const aboutSchema = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    "name": `About ${siteName}`,
    "description": `Learn about the mission and vision of ${siteName}.`,
    "publisher": {
      "@type": "Organization",
      "name": siteName,
      "url": siteUrl,
      "logo": settings.logos.lightLogoUrl || undefined
    },
    "mainEntity": {
      "@type": "Organization",
      "name": siteName,
      "description": "A premier knowledge hub decoding the complex dimensions of India.",
      "knowsAbout": ["Indian History", "Indian Culture", "Indian Sociology", "Indian Economy"]
    }
  };

  return (
    <>
      <JsonLd data={aboutSchema} />
      <AboutContent siteName={siteName} />
    </>
  );
}
