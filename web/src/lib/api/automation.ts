import { clientFetch } from "../client-fetch";

export interface RssSource {
    id: string;
    name: string;
    url: string;
    isActive: boolean;
    lastSyncedAt?: string;
    createdAt: string;
    updatedAt: string;
}

export async function getRssSources(): Promise<RssSource[]> {
    const result = await clientFetch<{ rows: RssSource[] }>("/api/platform/automation");
    return result.rows || [];
}

export async function createRssSource(payload: { name: string; url: string; isActive?: boolean }) {
    return await clientFetch<RssSource>("/api/platform/automation", {
        method: "POST",
        body: payload,
    });
}

export async function updateRssSource(id: string, payload: Partial<RssSource>) {
    return await clientFetch<RssSource>(`/api/platform/automation/${id}`, {
        method: "PATCH",
        body: payload,
    });
}

export async function deleteRssSource(id: string) {
    return await clientFetch(`/api/platform/automation/${id}`, {
        method: "DELETE",
        body: {},
    });
}

export async function syncRssFeeds() {
    return await clientFetch<{ success: boolean; message: string }>("/api/platform/automation/sync", {
        method: "POST",
        body: {},
    });
}

export async function generateDraftFromRss() {
    return await clientFetch<{ success: boolean; data: any; title?: string; message?: string }>(
        "/api/platform/automation/generate",
        {
            method: "POST",
            body: {},
        }
    );
}

export const platformAutomationApi = {
    getList: {
        key: "platform-automation",
        endpoint: "/api/platform/automation",
        method: "GET" as const,
    },
    getOne: {
        key: "platform-automation",
        endpoint: (data: { id: string }) => `/api/platform/automation/${data.id}`,
        method: "GET" as const,
    },
    create: {
        key: "platform-automation",
        endpoint: "/api/platform/automation",
        method: "POST" as const,
    },
    update: {
        key: "platform-automation",
        endpoint: (data: { id: string }) => `/api/platform/automation/${data.id}`,
        method: "PATCH" as const,
    },
    delete: {
        key: "platform-automation",
        endpoint: (data: { id: string }) => `/api/platform/automation/${data.id}`,
        method: "DELETE" as const,
    },
    sync: {
        key: "platform-automation-sync",
        endpoint: "/api/platform/automation/sync",
        method: "POST" as const,
    },
} as const;
