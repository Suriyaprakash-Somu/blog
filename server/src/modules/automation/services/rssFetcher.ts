import Parser from "rss-parser";

const parser = new Parser({
    customFields: {
        item: [
            ["content:encoded", "contentEncoded"],
            ["dc:creator", "creator"],
        ],
    },
});

export interface RssFetchedItem {
    guid?: string;
    title?: string;
    link?: string;
    pubDate?: string;
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
            content: item.contentEncoded || item.content,
            creator: item.creator,
            summary: item.contentSnippet,
        }));
    } catch (error) {
        console.error(`Error fetching RSS feed from ${url}:`, error);
        throw error;
    }
}
