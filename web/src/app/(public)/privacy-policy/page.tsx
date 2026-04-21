import type { Metadata } from "next";
import { getPublicSiteSettings } from "@/lib/api/public-settings";
import PrivacyContent from "./PrivacyContent";
import { JsonLd } from "@/components/seo/JsonLd";

export const metadata: Metadata = {
    title: "Privacy Policy",
    description: "Our steadfast commitment to protecting your privacy and personal data. Learn how we secure your Indian Context research data.",
    alternates: { canonical: "/privacy-policy" },
};

export default async function PrivacyPolicyPage() {
    const siteSettings = await getPublicSiteSettings();
    const siteName = siteSettings.identity.siteName || "Our Platform";
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://indiancontext.com";

    const privacySchema = {
        "@context": "https://schema.org",
        "@type": "WebPage",
        "name": "Privacy Policy",
        "description": `Privacy and data protection policies for ${siteName}.`,
        "publisher": {
            "@type": "Organization",
            "name": siteName,
            "url": siteUrl
        },
        "mainEntity": {
            "@type": "CreativeWork",
            "name": "Data Privacy Framework",
            "description": "The foundational principles governing user data collection and security on this platform."
        }
    };

    return (
        <>
            <JsonLd data={privacySchema} />
            <PrivacyContent siteName={siteName} />
        </>
    );
}
