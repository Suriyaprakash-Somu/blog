import type { Metadata } from "next";
import { getPublicSiteSettings } from "@/lib/api/public-settings";
import TermsContent from "./TermsContent";
import { JsonLd } from "@/components/seo/JsonLd";

export const metadata: Metadata = {
    title: "Terms of Service",
    description: "The rules, guidelines, and agreements for using our platform. Ensuring a safe and reliable environment for Indian research.",
    alternates: { canonical: "/terms-and-conditions" },
};

export default async function TermsOfServicePage() {
    const siteSettings = await getPublicSiteSettings();
    const siteName = siteSettings.identity.siteName || "Our Platform";
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://indiancontext.com";

    const termsSchema = {
        "@context": "https://schema.org",
        "@type": "WebPage",
        "name": "Terms of Service",
        "description": `Usage guidelines and legal agreements for ${siteUrl}.`,
        "publisher": {
            "@type": "Organization",
            "name": siteName,
            "url": siteUrl
        }
    };

    return (
        <>
            <JsonLd data={termsSchema} />
            <TermsContent siteName={siteName} />
        </>
    );
}
