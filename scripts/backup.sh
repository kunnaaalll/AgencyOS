#!/bin/bash
# ============================================================
# AgencyOS V2.1 — Production Backup Script
# Backs up: PostgreSQL, MinIO metadata, configuration
# Retention: 7 daily, 4 weekly
# Sends Telegram notification on success/failure
# ============================================================

set -euo pipefail

# ── Configuration ────────────────────────────────────────────
BACKUP_DIR="${BACKUP_DIR:-./backups}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DAY_OF_WEEK=$(date +"%u")  # 1=Monday, 7=Sunday
DB_CONTAINER="${DB_CONTAINER:-agencyos_postgres}"
DB_USER="${POSTGRES_USER:-agencyos}"
DB_NAME="${POSTGRES_DB:-agencyos}"
MINIO_CONTAINER="${MINIO_CONTAINER:-agencyos_minio}"

# Telegram (optional)
TELEGRAM_BOT_TOKEN="${TELEGRAM_BOT_TOKEN:-}"
TELEGRAM_CHAT_ID="${TELEGRAM_CHAT_ID:-}"

# Retention
DAILY_RETAIN=7
WEEKLY_RETAIN=4

# ── Directories ──────────────────────────────────────────────
DAILY_DIR="${BACKUP_DIR}/daily"
WEEKLY_DIR="${BACKUP_DIR}/weekly"
TEMP_DIR="${BACKUP_DIR}/temp_${TIMESTAMP}"

mkdir -p "${DAILY_DIR}" "${WEEKLY_DIR}" "${TEMP_DIR}"

# ── Functions ────────────────────────────────────────────────
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

send_telegram() {
    local message="$1"
    if [[ -n "${TELEGRAM_BOT_TOKEN}" && -n "${TELEGRAM_CHAT_ID}" ]]; then
        curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
            -d "chat_id=${TELEGRAM_CHAT_ID}" \
            -d "text=${message}" \
            -d "parse_mode=HTML" > /dev/null 2>&1 || true
    fi
}

cleanup_temp() {
    rm -rf "${TEMP_DIR}"
}
trap cleanup_temp EXIT

# ── Start Backup ─────────────────────────────────────────────
log "=== AgencyOS Backup Started ==="
BACKUP_STATUS="SUCCESS"
BACKUP_DETAILS=""

# 1. PostgreSQL Database
log "Backing up PostgreSQL..."
DB_BACKUP="${TEMP_DIR}/database.sql.gz"
if docker exec "${DB_CONTAINER}" pg_dump -U "${DB_USER}" -Fc "${DB_NAME}" | gzip > "${DB_BACKUP}"; then
    DB_SIZE=$(du -sh "${DB_BACKUP}" | cut -f1)
    log "Database backup complete (${DB_SIZE})"
    BACKUP_DETAILS+="📦 Database: ${DB_SIZE}\n"
else
    log "ERROR: Database backup failed!"
    BACKUP_STATUS="FAILED"
    BACKUP_DETAILS+="❌ Database: FAILED\n"
fi

# 2. MinIO Metadata
log "Backing up MinIO metadata..."
MINIO_BACKUP="${TEMP_DIR}/minio_metadata.tar.gz"
if docker exec "${MINIO_CONTAINER}" tar czf - /data/.minio.sys 2>/dev/null | cat > "${MINIO_BACKUP}"; then
    MINIO_SIZE=$(du -sh "${MINIO_BACKUP}" | cut -f1)
    log "MinIO metadata backup complete (${MINIO_SIZE})"
    BACKUP_DETAILS+="📦 MinIO: ${MINIO_SIZE}\n"
else
    log "WARNING: MinIO metadata backup failed (non-critical)"
    BACKUP_DETAILS+="⚠️ MinIO: skipped\n"
fi

# 3. Configuration Files
log "Backing up configuration..."
CONFIG_BACKUP="${TEMP_DIR}/config.tar.gz"
tar czf "${CONFIG_BACKUP}" \
    --exclude='.env' \
    --exclude='node_modules' \
    --exclude='.venv' \
    --exclude='__pycache__' \
    --exclude='.git' \
    --exclude='backups' \
    docker-compose.yml \
    docker-compose.prod.yml \
    infra/ \
    2>/dev/null || true
CONFIG_SIZE=$(du -sh "${CONFIG_BACKUP}" | cut -f1)
log "Configuration backup complete (${CONFIG_SIZE})"
BACKUP_DETAILS+="📦 Config: ${CONFIG_SIZE}\n"

# 4. Create final archive
ARCHIVE_NAME="agencyos_backup_${TIMESTAMP}.tar.gz"
DAILY_ARCHIVE="${DAILY_DIR}/${ARCHIVE_NAME}"
tar czf "${DAILY_ARCHIVE}" -C "${TEMP_DIR}" .
TOTAL_SIZE=$(du -sh "${DAILY_ARCHIVE}" | cut -f1)
log "Daily backup archive: ${DAILY_ARCHIVE} (${TOTAL_SIZE})"

# 5. Weekly backup (on Sundays)
if [[ "${DAY_OF_WEEK}" == "7" ]]; then
    WEEKLY_ARCHIVE="${WEEKLY_DIR}/${ARCHIVE_NAME}"
    cp "${DAILY_ARCHIVE}" "${WEEKLY_ARCHIVE}"
    log "Weekly backup created: ${WEEKLY_ARCHIVE}"
    BACKUP_DETAILS+="📅 Weekly copy: created\n"
fi

# 6. Verify backup integrity
log "Verifying backup integrity..."
if tar tzf "${DAILY_ARCHIVE}" > /dev/null 2>&1; then
    log "Backup integrity check passed"
    BACKUP_DETAILS+="✅ Integrity: verified\n"
else
    log "ERROR: Backup integrity check FAILED!"
    BACKUP_STATUS="FAILED"
    BACKUP_DETAILS+="❌ Integrity: FAILED\n"
fi

# 7. Cleanup old backups
log "Cleaning up old backups..."
# Keep last N daily backups
ls -t "${DAILY_DIR}"/agencyos_backup_*.tar.gz 2>/dev/null | tail -n +$((DAILY_RETAIN + 1)) | xargs -r rm
# Keep last N weekly backups
ls -t "${WEEKLY_DIR}"/agencyos_backup_*.tar.gz 2>/dev/null | tail -n +$((WEEKLY_RETAIN + 1)) | xargs -r rm

REMAINING_DAILY=$(ls "${DAILY_DIR}"/agencyos_backup_*.tar.gz 2>/dev/null | wc -l)
REMAINING_WEEKLY=$(ls "${WEEKLY_DIR}"/agencyos_backup_*.tar.gz 2>/dev/null | wc -l)
log "Retained: ${REMAINING_DAILY} daily, ${REMAINING_WEEKLY} weekly"

# ── Report ───────────────────────────────────────────────────
log "=== Backup ${BACKUP_STATUS} ==="

TELEGRAM_MSG="<b>🗄️ AgencyOS Backup — ${BACKUP_STATUS}</b>\n"
TELEGRAM_MSG+="<b>Time:</b> $(date '+%Y-%m-%d %H:%M:%S')\n"
TELEGRAM_MSG+="<b>Total Size:</b> ${TOTAL_SIZE}\n\n"
TELEGRAM_MSG+="${BACKUP_DETAILS}\n"
TELEGRAM_MSG+="<b>Retention:</b> ${REMAINING_DAILY} daily / ${REMAINING_WEEKLY} weekly"

send_telegram "${TELEGRAM_MSG}"

if [[ "${BACKUP_STATUS}" == "FAILED" ]]; then
    exit 1
fi
