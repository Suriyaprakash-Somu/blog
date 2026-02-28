import { db } from "../src/db/index.js";
import { uploadedFiles } from "../src/modules/uploads/uploadedFiles.schema.js";
import { blogPosts } from "../src/modules/blogPosts/blogPosts.schema.js";
import { inArray, eq } from "drizzle-orm";

async function run() {
    const posts = await db.select().from(blogPosts);
    const ids = posts.map(p => p.featuredImageFileId).filter(Boolean) as string[];
    console.log("Found", ids.length, "featured images attached to blog posts.");

    if (ids.length > 0) {
        const res = await db.update(uploadedFiles).set({ isPublic: true }).where(inArray(uploadedFiles.id, ids));
        console.log("Updated", res.rowCount, "files to public.");
    }

    const explicitFix = await db.update(uploadedFiles).set({ isPublic: true }).where(eq(uploadedFiles.id, "019c9a59-aad6-7966-9581-51bf63051c27"));
    console.log("Explicitly updated user's reported image (019c...):", explicitFix.rowCount);

    process.exit(0);
}

run().catch(console.error);
