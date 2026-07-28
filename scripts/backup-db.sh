#!/bin/sh
# Backup the survey_siswa Postgres database running in the `db` docker-compose service.
# Usage: ./scripts/backup-db.sh [output-directory]
set -e

OUT_DIR="${1:-./backups}"
POSTGRES_USER="${POSTGRES_USER:-survey_user}"
POSTGRES_DB="${POSTGRES_DB:-survey_siswa}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
FILE="$OUT_DIR/survey_siswa_$TIMESTAMP.sql.gz"

mkdir -p "$OUT_DIR"

echo "Backing up database '$POSTGRES_DB' to $FILE ..."
docker compose exec -T db pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" | gzip > "$FILE"

echo "Done: $FILE ($(du -h "$FILE" | cut -f1))"
