import type { Metadata } from "next";
import { getPublicSiteSettings } from "@/lib/api/public-settings";
import CookiesContent from "./CookiesContent";
import { JsonLd } from "@/components/seo/JsonLd";

export const metadata: Metadata = {
    title: "Cookie Policy",
    description: "Insight into how we use cookies for a seamless experience. Transparency and control over your Indian Context preferences.",
    alternates: { canonical: "/cookies" },
};

export default async function CookiePolicyPage() {
    const siteSettings = await getPublicSiteSettings();
    const siteName = siteSettings.identity.siteName || "Our Platform";
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://indiancontext.com";

    const cookieSchema = {
        "@context": "https://schema.org",
        "@type": "WebPage",
        "name": "Cookie Policy",
        "description": `Transparency guidelines on cookie usage for ${siteName}.`,
        "publisher": {
            "@type": "Organization",
            "name": siteName,
            "url": siteUrl
        }
    };

    return (
        <>
            <JsonLd data={cookieSchema} />
            <CookiesContent siteName={siteName} />
        </>
    );
}
