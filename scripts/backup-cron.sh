#!/bin/bash
# ============================================================
# AgencyOS V2.1 — Backup Cron Wrapper
# Runs daily at 2:00 AM server time
#
# Installation:
#   chmod +x scripts/backup-cron.sh
#   crontab -e
#   0 2 * * * cd /path/to/agencyos-v2 && ./scripts/backup-cron.sh >> /var/log/agencyos-backup.log 2>&1
# ============================================================

set -euo pipefail

# Navigate to project root
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "${SCRIPT_DIR}")"
cd "${PROJECT_DIR}"

# Source environment
if [[ -f .env.production ]]; then
    set -a
    source .env.production
    set +a
elif [[ -f .env ]]; then
    set -a
    source .env
    set +a
fi

# Run backup
exec bash scripts/backup.sh
