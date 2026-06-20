#!/bin/bash
# AgencyOS V2 — Database Backup Strategy
# This script performs a backup of the PostgreSQL database and stores it.

set -e

BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DB_CONTAINER="agencyos_postgres"
DB_USER="agencyos"
DB_NAME="agencyos"
BACKUP_FILE="${BACKUP_DIR}/agencyos_backup_${TIMESTAMP}.sql.gz"

echo "=== AgencyOS Backup ==="
echo "Starting backup process..."

mkdir -p "${BACKUP_DIR}"

echo "Dumping database ${DB_NAME} from container ${DB_CONTAINER}..."
docker exec ${DB_CONTAINER} pg_dump -U ${DB_USER} ${DB_NAME} | gzip > "${BACKUP_FILE}"

echo "Backup created successfully at ${BACKUP_FILE}"
echo "To restore, run: gunzip -c ${BACKUP_FILE} | docker exec -i ${DB_CONTAINER} psql -U ${DB_USER} ${DB_NAME}"
