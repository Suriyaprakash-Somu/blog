export const platformNewsletterApi = {
    getList: {
        endpoint: "/api/platform/newsletter",
        method: "GET" as const,
        key: "platform-newsletter",
    },
} as const;
