export function slugify(text: string): string {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .trim();
}

export function extractTableOfContents(markdown: string): { id: string; text: string; level: number }[] {
    const entries: { id: string; text: string; level: number }[] = [];
    const regex = /^(#{2,5})\s+(.+)$/gm;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(markdown)) !== null) {
        const level = match[1].length; // 2–5
        const text = match[2].trim();
        entries.push({
            id: slugify(text),
            text,
            level,
        });
    }

    return entries;
}

export function calculateReadTime(markdown: string): number {
    const words = markdown
        .replace(/[#*_`>\[\]()!|-]/g, " ")
        .split(/\s+/)
        .filter(Boolean).length;
    return Math.max(1, Math.round(words / 200));
}

export function extractContentImageIds(markdown: string): string[] {
    const ids: string[] = [];
    // Match ![alt](/api/uploads/{uuid}) or ![alt](/uploads/{uuid})
    const regex = /!\[.*?\]\(\/(?:api\/)?uploads\/([a-f0-9-]{36})\)/gi;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(markdown)) !== null) {
        ids.push(match[1]);
    }

    return [...new Set(ids)];
}

/**
 * Robustly parses JSON from LLM responses, handling code blocks, 
 * truncation, and stray text.
 */
export function robustJsonParse<T>(rawText: string, fallbacks?: Record<string, string>): T {
    let text = rawText.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

    // Find everything between first '{' and last '}'
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');

    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        text = text.substring(firstBrace, lastBrace + 1);
    }

    try {
        return JSON.parse(text) as T;
    } catch (e) {
        console.warn(`[ROBUST PARSE] Strict JSON parsing failed. Attempting regex fallback...`);

        const result: any = {};

        // If we have a fallback map (field names and their types/defaults), use it
        if (fallbacks) {
            for (const [field, defaultValue] of Object.entries(fallbacks)) {
                const val = extractField(text, field);
                result[field] = val || defaultValue;
            }

            // Special handle for lists like FAQ or sourceIndices if needed
            // But for now let's keep it simple.
            return result as T;
        }

        // If no fallbacks provided, return whatever we could find as a string or throw
        throw e;
    }
}

export function extractField(text: string, fieldName: string): string {
    const regex = new RegExp(`"${fieldName}"\\s*:\\s*"((?:[^"\\\\]|\\\\[\\s\\S])*)(?:"|$)`, 'i');
    const match = text.match(regex);
    if (match && match[1]) {
        return match[1]
            .replace(/\\"/g, '"')
            .replace(/\\n/g, '\n')
            .replace(/\\t/g, '\t')
            .replace(/\\\\/g, '\\');
    }

    // Fallback for non-string fields (numbers, booleans, arrays) - very basic extraction
    const simpleRegex = new RegExp(`"${fieldName}"\\s*:\\s*([^,}\\s]+)`, 'i');
    const simpleMatch = text.match(simpleRegex);
    if (simpleMatch && simpleMatch[1]) {
        let val = simpleMatch[1].trim();
        // Strip quotes if they were captured but regex above missed them
        val = val.replace(/^["']|["']$/g, '');
        return val;
    }

    return "";
}

/**
 * Specialized extractor for truncated JSON lists (e.g., FAQ)
 */
export function extractListFromTruncatedJson(text: string, listField: string): any[] {
    try {
        const regex = new RegExp(`"${listField}"\\s*:\\s*(\\[[\\s\\S]*)`, 'i');
        const match = text.match(regex);
        if (!match || !match[1]) return [];

        let listStr = match[1].trim();

        // Try to close JSON cleanly if truncated
        const openBrackets = (listStr.match(/\{/g) || []).length;
        const closeBrackets = (listStr.match(/\}/g) || []).length;

        if (openBrackets > closeBrackets) {
            listStr = listStr.substring(0, listStr.lastIndexOf('}'));
            listStr += "}]";
        }

        // Strip trailing comma before list closure if any
        listStr = listStr.replace(/,\s*\]/, ']');

        try {
            const parsed = JSON.parse(listStr);
            if (Array.isArray(parsed)) return parsed;
        } catch (e) {
            // Deep fallback: regex match individual objects in the list
            // This is very specific to { "question": "...", "answer": "..." } patterns
            const arr: any[] = [];
            const entryRegex = /\{\s*"question"\s*:\s*"((?:[^"\\\\]|\\\\[\\s\\S])*?)"\s*,\s*"answer"\s*:\s*"((?:[^"\\\\]|\\\\[\\s\\S])*?)"\s*\}/gi;
            let entryMatch;
            while ((entryMatch = entryRegex.exec(listStr)) !== null) {
                arr.push({
                    question: entryMatch[1].replace(/\\"/g, '"').replace(/\\n/g, '\n'),
                    answer: entryMatch[2].replace(/\\"/g, '"').replace(/\\n/g, '\n')
                });
            }
            return arr;
        }
    } catch (ignore) { }
    return [];
}
