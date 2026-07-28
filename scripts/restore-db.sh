#!/bin/sh
# Restore the survey_siswa Postgres database from a backup made by backup-db.sh.
# WARNING: this overwrites all current data in the database.
# Usage: ./scripts/restore-db.sh <path-to-backup.sql.gz>
set -e

FILE="$1"
POSTGRES_USER="${POSTGRES_USER:-survey_user}"
POSTGRES_DB="${POSTGRES_DB:-survey_siswa}"

if [ -z "$FILE" ]; then
  echo "Usage: ./scripts/restore-db.sh <path-to-backup.sql.gz>"
  exit 1
fi

echo "This will REPLACE all data in database '$POSTGRES_DB'. Press Ctrl+C to abort, Enter to continue."
read -r _

gunzip -c "$FILE" | docker compose exec -T db psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"

echo "Restore complete."
