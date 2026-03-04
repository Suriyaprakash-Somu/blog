import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import { serverFetch } from "@/lib/server-fetch";
import type { BannerRow } from "@/lib/banner/types";
import { getPublicSiteSettings } from "@/lib/api/public-settings";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getPublicSiteSettings();
  const siteName = settings.identity.siteName || "Indian Context";

  return {
    metadataBase: new URL(
      process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3015",
    ),
    title: {
      default: siteName,
      template: `%s | ${siteName}`,
    },
    description: `The latest stories and analysis from ${siteName}.`,
    openGraph: {
      siteName,
    },
    alternates: {
      types: {
        "application/rss+xml": "/rss.xml",
      },
    },
  };
}

export function reportWebVitals(metric: {
  id: string;
  name: string;
  label?: string;
  value: number;
}) {
  if (process.env.NODE_ENV === "development") {
    console.warn("[WebVitals]", metric);
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const initialPublicBanners = await serverFetch<{ rows: BannerRow[] }>(
    "/api/public/banners/active",
    { cache: "no-store" },
  ).catch(() => null);

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers initialPublicBanners={initialPublicBanners}>{children}</Providers>
      </body>
    </html>
  );
}
