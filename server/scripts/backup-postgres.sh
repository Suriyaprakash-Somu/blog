#!/usr/bin/env bash
set -euo pipefail

# Minimal Postgres backup helper.
#
# Usage:
#   DATABASE_URL="postgres://user:pass@host:5432/db" ./scripts/backup-postgres.sh
#
# Output:
#   Writes a timestamped .dump file into ./backups

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT_DIR="$ROOT_DIR/backups"

mkdir -p "$OUT_DIR"

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL is required" >&2
  exit 1
fi

TS="$(date +"%Y%m%d_%H%M%S")"
OUT_FILE="$OUT_DIR/indiancontext_${TS}.dump"

echo "[backup] Writing $OUT_FILE"
pg_dump "$DATABASE_URL" \
  --format=custom \
  --no-owner \
  --no-privileges \
  --file "$OUT_FILE"

echo "[backup] Done"
