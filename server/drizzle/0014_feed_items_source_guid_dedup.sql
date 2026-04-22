-- Migration: Improve feed item deduplication keys
--
-- 1) Add an index for lookups by (source_id, guid)
-- 2) Attempt to add a UNIQUE index on (source_id, guid) only if the table has no duplicates.
--    This avoids breaking existing installs that already contain duplicates.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public' AND indexname = 'feed_items_source_guid_idx'
  ) THEN
    CREATE INDEX feed_items_source_guid_idx ON feed_items (source_id, guid);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public' AND indexname = 'feed_items_source_guid_unique_idx'
  ) THEN
    IF NOT EXISTS (
      SELECT 1
      FROM (
        SELECT source_id, guid
        FROM feed_items
        GROUP BY source_id, guid
        HAVING COUNT(*) > 1
      ) d
    ) THEN
      CREATE UNIQUE INDEX feed_items_source_guid_unique_idx ON feed_items (source_id, guid);
    END IF;
  END IF;
END $$;
