import { db } from "./src/db/index.js";
import { uploadedFiles } from "./src/modules/uploads/uploadedFiles.schema.js";
import { platformSettings } from "./src/db/schema/settings.js";
import { eq, inArray } from "drizzle-orm";

async function fixLogos() {
    console.log("Starting logo visibility fix...");

    try {
        const [logosSetting] = await db
            .select()
            .from(platformSettings)
            .where(eq(platformSettings.key, "logos"))
            .limit(1);

        const ids: string[] = [];
        if (logosSetting && typeof logosSetting.value === "object" && logosSetting.value !== null) {
            const v = logosSetting.value as any;
            if (v.lightLogoFileId) ids.push(v.lightLogoFileId);
            if (v.darkLogoFileId) ids.push(v.darkLogoFileId);
            if (v.faviconFileId) ids.push(v.faviconFileId);
        }

        if (ids.length > 0) {
            await db.update(uploadedFiles).set({ isPublic: true }).where(inArray(uploadedFiles.id, ids));
            console.log("Updated logos.");
        }

        await db.update(uploadedFiles).set({ isPublic: true }).where(eq(uploadedFiles.attachedToType, "platform_banner"));
        console.log("Updated banners.");
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
}

fixLogos();
