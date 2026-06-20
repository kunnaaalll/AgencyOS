#!/bin/bash
# ============================================================
# AgencyOS V2.1 — Restore Script
# Restores from a backup archive created by backup.sh
# ============================================================

set -euo pipefail

# ── Configuration ────────────────────────────────────────────
DB_CONTAINER="${DB_CONTAINER:-agencyos_postgres}"
DB_USER="${POSTGRES_USER:-agencyos}"
DB_NAME="${POSTGRES_DB:-agencyos}"

BACKUP_FILE="${1:-}"

# ── Validation ───────────────────────────────────────────────
if [[ -z "${BACKUP_FILE}" ]]; then
    echo "Usage: $0 <backup_archive.tar.gz>"
    echo ""
    echo "Available backups:"
    echo "  Daily:"
    ls -lh ./backups/daily/agencyos_backup_*.tar.gz 2>/dev/null || echo "    (none)"
    echo "  Weekly:"
    ls -lh ./backups/weekly/agencyos_backup_*.tar.gz 2>/dev/null || echo "    (none)"
    exit 1
fi

if [[ ! -f "${BACKUP_FILE}" ]]; then
    echo "ERROR: Backup file not found: ${BACKUP_FILE}"
    exit 1
fi

# ── Functions ────────────────────────────────────────────────
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

confirm() {
    local prompt="$1"
    read -rp "${prompt} [y/N]: " response
    [[ "${response}" =~ ^[Yy]$ ]]
}

# ── Extract Backup ───────────────────────────────────────────
RESTORE_DIR=$(mktemp -d)
trap "rm -rf ${RESTORE_DIR}" EXIT

log "Extracting backup archive..."
tar xzf "${BACKUP_FILE}" -C "${RESTORE_DIR}"
log "Archive extracted to ${RESTORE_DIR}"

# List contents
echo ""
echo "Backup contents:"
ls -lh "${RESTORE_DIR}/"
echo ""

# ── Step 1: Restore PostgreSQL ───────────────────────────────
if [[ -f "${RESTORE_DIR}/database.sql.gz" ]]; then
    log "Found database backup"

    if ! confirm "⚠️  This will REPLACE the current database. Continue?"; then
        log "Database restore cancelled by user"
    else
        log "Restoring PostgreSQL database..."

        # Drop and recreate database
        docker exec "${DB_CONTAINER}" psql -U "${DB_USER}" -d postgres -c "
            SELECT pg_terminate_backend(pid)
            FROM pg_stat_activity
            WHERE datname = '${DB_NAME}' AND pid <> pg_backend_pid();
        " 2>/dev/null || true

        docker exec "${DB_CONTAINER}" psql -U "${DB_USER}" -d postgres -c "DROP DATABASE IF EXISTS ${DB_NAME};"
        docker exec "${DB_CONTAINER}" psql -U "${DB_USER}" -d postgres -c "CREATE DATABASE ${DB_NAME} OWNER ${DB_USER};"

        # Restore from dump
        gunzip -c "${RESTORE_DIR}/database.sql.gz" | docker exec -i "${DB_CONTAINER}" pg_restore -U "${DB_USER}" -d "${DB_NAME}" --no-owner --no-privileges 2>/dev/null || {
            # pg_restore returns non-zero for warnings too, so try psql as fallback
            gunzip -c "${RESTORE_DIR}/database.sql.gz" | docker exec -i "${DB_CONTAINER}" psql -U "${DB_USER}" "${DB_NAME}" 2>/dev/null || true
        }

        log "Database restore complete"
    fi
else
    log "No database backup found in archive"
fi

# ── Step 2: Verify Data Integrity ────────────────────────────
if confirm "Run data integrity verification?"; then
    log "Verifying data integrity..."

    # Check table counts
    echo ""
    echo "Table row counts:"
    docker exec "${DB_CONTAINER}" psql -U "${DB_USER}" -d "${DB_NAME}" -c "
        SELECT schemaname, relname, n_live_tup
        FROM pg_stat_user_tables
        ORDER BY n_live_tup DESC
        LIMIT 20;
    "

    # Check migrations
    echo ""
    echo "Alembic migration version:"
    docker exec "${DB_CONTAINER}" psql -U "${DB_USER}" -d "${DB_NAME}" -c "
        SELECT version_num FROM alembic_version;
    " 2>/dev/null || echo "  (no alembic_version table found)"

    log "Integrity verification complete"
fi

# ── Summary ──────────────────────────────────────────────────
echo ""
log "=== Restore Complete ==="
echo ""
echo "Next steps:"
echo "  1. Restart the backend: docker compose restart backend worker"
echo "  2. Run migrations: docker compose exec backend alembic upgrade head"
echo "  3. Verify the application at your domain"
echo "  4. Check logs: docker compose logs -f backend"
