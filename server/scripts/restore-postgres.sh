#!/usr/bin/env bash
set -euo pipefail

# Minimal Postgres restore helper.
#
# Usage:
#   DATABASE_URL="postgres://user:pass@host:5432/db" ./scripts/restore-postgres.sh ./backups/file.dump

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL is required" >&2
  exit 1
fi

DUMP_FILE="${1:-}"
if [[ -z "$DUMP_FILE" ]]; then
  echo "Dump file path is required" >&2
  exit 1
fi
if [[ ! -f "$DUMP_FILE" ]]; then
  echo "Dump file not found: $DUMP_FILE" >&2
  exit 1
fi

echo "[restore] Restoring from $DUMP_FILE"
pg_restore "$DUMP_FILE" \
  --dbname "$DATABASE_URL" \
  --clean \
  --if-exists \
  --no-owner \
  --no-privileges

echo "[restore] Done"
