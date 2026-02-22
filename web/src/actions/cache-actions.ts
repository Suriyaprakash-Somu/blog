"use server";

import { revalidateTag, revalidatePath } from "next/cache";

/**
 * Server Action: Revalidates Next.js cache tags and/or paths.
 * Use this to trigger server-side cache invalidation after mutations.
 * 
 * @param params.tags - Array of cache tags to revalidate (for tagged fetch requests)
 * @param params.paths - Array of paths to revalidate (for page routes)
 * 
 * @example
 * // Revalidate a tag (used in fetch with { next: { tags: ['tenants'] } })
 * await revalidateCache({ tags: ['tenants'] });
 * 
 * @example  
 * // Revalidate a page path
 * await revalidateCache({ paths: ['/platform/tenants'] });
 */
export async function revalidateCache({ 
  tags = [], 
  paths = [] 
}: { 
  tags?: string[]; 
  paths?: string[]; 
}): Promise<void> {
  // Revalidate tags (for tagged fetch requests)
  if (tags.length > 0) {
    for (const tag of tags) {
      revalidateTag(tag, "max");
    }
  }

  // Revalidate paths (for page routes)
  if (paths.length > 0) {
    for (const path of paths) {
      revalidatePath(path, "page");
    }
  }
}
