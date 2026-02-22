import { env } from "../common/env.js";
import { db } from "../db/index.js";
import { purgeExpiredUploadOrphans } from "../modules/uploads/orphanCleanup.js";

async function main() {
  const limit = env.UPLOAD_ORPHAN_CLEANUP_BATCH_SIZE;
  const res = await purgeExpiredUploadOrphans({ db, limit });
  console.log(`[uploads-cleanup] purged=${res.purged}`);
}

main().catch((err) => {
  console.error("[uploads-cleanup] FAILED", err);
  process.exit(1);
});
