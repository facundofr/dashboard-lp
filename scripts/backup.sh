#!/usr/bin/env bash
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-../backups}"
DB_URL="${DATABASE_URL:-postgresql://landings:landings@localhost:5432/landings?schema=public}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
FILENAME="landings-backup-$TIMESTAMP.sql.gz"

mkdir -p "$BACKUP_DIR"

pg_dump "$DB_URL" --clean --if-exists | gzip > "$BACKUP_DIR/$FILENAME"

echo "Backup creado: $BACKUP_DIR/$FILENAME"

find "$BACKUP_DIR" -name "landings-backup-*.sql.gz" -mtime +$RETENTION_DAYS -delete
