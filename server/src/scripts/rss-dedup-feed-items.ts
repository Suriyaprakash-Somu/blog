import "dotenv/config";

import { db, closeDatabase } from "../db/index.js";
import { sql } from "drizzle-orm";

async function main() {
  // 1) Show duplicates
  const dupes = await db.execute(sql`
    select source_id, guid, count(*)::int as count
    from feed_items
    group by source_id, guid
    having count(*) > 1
    order by count(*) desc
    limit 50
  `);

  const dupeCount = dupes.rows.length;
  console.log(`[rss-dedup] Found ${dupeCount} duplicate (source_id,guid) groups (showing up to 50).`);
  if (dupeCount > 0) {
    console.log(dupes.rows);
  }

  // 2) Delete duplicates, keeping the most recent row per (source_id,guid)
  const deleted = await db.execute(sql`
    with ranked as (
      select
        id,
        row_number() over (partition by source_id, guid order by created_at desc, id desc) as rn
      from feed_items
    )
    delete from feed_items
    where id in (select id from ranked where rn > 1)
    returning id
  `);

  console.log(`[rss-dedup] Deleted ${deleted.rows.length} duplicate rows.`);

  // 3) Create lookup index and unique index (now that duplicates are removed)
  await db.execute(sql`
    create index if not exists feed_items_source_guid_idx on feed_items (source_id, guid)
  `);

  await db.execute(sql`
    create unique index if not exists feed_items_source_guid_unique_idx on feed_items (source_id, guid)
  `);

  console.log("[rss-dedup] Indexes ensured.");
}

main()
  .then(() => {
    closeDatabase();
  })
  .catch((err) => {
    console.error("[rss-dedup] Failed:", err);
    closeDatabase();
    process.exitCode = 1;
  });
