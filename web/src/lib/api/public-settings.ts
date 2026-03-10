import { serverFetch } from "@/lib/server-fetch";
import { getPublicImageUrl } from "@/lib/utils";

/* ── Types ─────────────────────────────────────────── */

export interface LogosValue {
    lightLogoFileId?: string | null;
    darkLogoFileId?: string | null;
    faviconFileId?: string | null;
}

export interface SocialLinks {
    twitter?: string;
    facebook?: string;
    instagram?: string;
    youtube?: string;
    linkedin?: string;
    website?: string;
}

export interface SiteIdentity {
    siteName: string;
    shortName: string;
}

export interface SiteSettings {
    logos: {
        lightLogoUrl: string | null;
        darkLogoUrl: string | null;
        faviconUrl: string | null;
    };
    socialLinks: SocialLinks;
    identity: SiteIdentity;
}

/* ── Fetcher ───────────────────────────────────────── */

interface SettingRow {
    key: string;
    value: any;
}

/**
 * Fetches public platform settings from the backend (server-side).
 * Uses Next.js revalidation for caching (revalidates every 5 min).
 */
export async function getPublicSiteSettings(): Promise<SiteSettings> {
    const defaults: SiteSettings = {
        logos: { lightLogoUrl: null, darkLogoUrl: null, faviconUrl: null },
        socialLinks: {},
        identity: {
            siteName: "Indian Context",
            shortName: "IC",
        },
    };

    try {
        const result = await serverFetch<{ rows: SettingRow[] }>(
            "/api/public/settings",
            { next: { revalidate: 300, tags: ["public_settings"] } } as any, // 5 min cache
        );

        const rows = result?.rows ?? [];
        const map = new Map(rows.map((r) => [r.key, r.value]));

        // Logos
        const logosRaw = (map.get("logos") ?? {}) as LogosValue;
        defaults.logos = {
            lightLogoUrl: getPublicImageUrl(logosRaw.lightLogoFileId ?? null),
            darkLogoUrl: getPublicImageUrl(logosRaw.darkLogoFileId ?? null),
            faviconUrl: getPublicImageUrl(logosRaw.faviconFileId ?? null),
        };

        // Social links
        defaults.socialLinks = (map.get("social_media") ?? {}) as SocialLinks;

        // Identity
        const identityRaw = map.get("site_identity") as Partial<SiteIdentity> | undefined;
        if (identityRaw) {
            if (identityRaw.siteName?.trim()) defaults.identity.siteName = identityRaw.siteName;
            if (identityRaw.shortName?.trim()) defaults.identity.shortName = identityRaw.shortName;
        }
    } catch {
        // Fail silently — return defaults
    }

    return defaults;
}
