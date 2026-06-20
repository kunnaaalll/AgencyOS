#!/bin/bash
# ============================================================
# AgencyOS V2.1 — Production Deploy Script (Oracle Cloud)
# Usage: ./scripts/deploy.sh
# ============================================================

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() { echo -e "${GREEN}[DEPLOY]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; }

# ── Pre-flight Checks ───────────────────────────────────────
log "Running pre-flight checks..."

if ! command -v docker &> /dev/null; then
    error "Docker is not installed"
    exit 1
fi

if ! command -v docker compose &> /dev/null && ! command -v docker-compose &> /dev/null; then
    error "Docker Compose is not installed"
    exit 1
fi

if [[ ! -f ".env.production" ]]; then
    error ".env.production not found. Copy from .env.production.example and fill in values."
    exit 1
fi

# Check for CHANGE_ME values
if grep -q "CHANGE_ME" .env.production; then
    error "Found CHANGE_ME placeholder values in .env.production. Please set all values before deploying."
    grep "CHANGE_ME" .env.production
    exit 1
fi

log "Pre-flight checks passed ✅"

# ── Source Environment ───────────────────────────────────────
set -a
source .env.production
set +a

# ── Make Scripts Executable ──────────────────────────────────
chmod +x scripts/*.sh

# ── Build Images ─────────────────────────────────────────────
log "Building production images..."
docker compose -f docker-compose.prod.yml build

# ── Deploy ───────────────────────────────────────────────────
log "Deploying services..."
docker compose -f docker-compose.prod.yml up -d

# ── Wait for Health ──────────────────────────────────────────
log "Waiting for services to become healthy..."
sleep 20

SERVICES=("agencyos_postgres" "agencyos_redis" "agencyos_backend" "agencyos_frontend")
ALL_HEALTHY=true

for service in "${SERVICES[@]}"; do
    STATUS=$(docker inspect --format='{{.State.Health.Status}}' "${service}" 2>/dev/null || echo "unknown")
    if [[ "${STATUS}" == "healthy" ]]; then
        log "  ✅ ${service}: ${STATUS}"
    else
        warn "  ⚠️  ${service}: ${STATUS}"
        ALL_HEALTHY=false
    fi
done

if [[ "${ALL_HEALTHY}" == "false" ]]; then
    warn "Some services are not yet healthy. Waiting 30 more seconds..."
    sleep 30

    for service in "${SERVICES[@]}"; do
        STATUS=$(docker inspect --format='{{.State.Health.Status}}' "${service}" 2>/dev/null || echo "unknown")
        log "  ${service}: ${STATUS}"
    done
fi

# ── Run Migrations ───────────────────────────────────────────
log "Running database migrations..."
docker compose -f docker-compose.prod.yml exec -T backend alembic upgrade head

# ── Verify ───────────────────────────────────────────────────
log "Verifying deployment..."
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/api/health)
if [[ "${HTTP_STATUS}" -eq 200 ]]; then
    log "🎉 Deployment successful! API is healthy."
else
    error "API health check failed with status ${HTTP_STATUS}"
    docker compose -f docker-compose.prod.yml logs --tail=30 backend
    exit 1
fi

# ── Summary ──────────────────────────────────────────────────
echo ""
log "═══════════════════════════════════════════════"
log "  AgencyOS V2.1 — Deployment Complete"
log "═══════════════════════════════════════════════"
log "  API:      https://api.${DOMAIN:-yourdomain.com}"
log "  App:      https://app.${DOMAIN:-yourdomain.com}"
log "  Grafana:  https://grafana.${DOMAIN:-yourdomain.com}"
log "═══════════════════════════════════════════════"
echo ""
log "Next steps:"
log "  1. Set up backup cron: crontab -e → 0 2 * * * cd $(pwd) && ./scripts/backup-cron.sh"
log "  2. Configure Telegram alerts in .env.production"
log "  3. Verify SSL certs: curl -I https://api.${DOMAIN:-yourdomain.com}"
