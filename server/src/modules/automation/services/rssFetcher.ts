import Parser from "rss-parser";

const parser = new Parser({
    customFields: {
        item: [
            ["content:encoded", "contentEncoded"],
            ["dc:creator", "creator"],
        ],
    },
});

function stripHtml(value: string | undefined | null): string {
    if (!value) return "";
    return value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

export interface RssFetchedItem {
    guid?: string;
    title?: string;
    link?: string;
    pubDate?: string;
    isoDate?: string;
    content?: string;
    creator?: string;
    summary?: string;
}

export async function fetchRssFeed(url: string): Promise<RssFetchedItem[]> {
    try {
        const feed = await parser.parseURL(url);
        return feed.items.map((item) => ({
            guid: item.guid || item.link,
            title: item.title,
            link: item.link,
            pubDate: item.pubDate,
            isoDate: (item as any).isoDate,
            content: item.contentEncoded || item.content,
            creator: item.creator,
            summary: stripHtml(item.contentSnippet),
        }));
    } catch (error) {
        console.error(`Error fetching RSS feed from ${url}:`, error);
        throw error;
    }
}
