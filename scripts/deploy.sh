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

# ── Coexistence / Standalone Mode Selection ─────────────────
MODE="${DEPLOY_MODE:-coexist}"
if [[ "${1:-}" == "--standalone" ]]; then
    MODE="standalone"
elif [[ "${1:-}" == "--coexist" ]]; then
    MODE="coexist"
fi

if [[ "${MODE}" == "coexist" ]]; then
    COMPOSE_CMD="docker compose --env-file .env.production -f docker-compose.prod.yml -f docker-compose.coexist.yml"
    log "🛡️  Running in SAFE COEXISTENCE MODE"
    log "   - Ports 80 and 443 are UNTOUCHED (Existing sites protected)"
    log "   - Frontend bound to ${FRONTEND_BIND:-127.0.0.1:8088}"
    log "   - Backend bound to ${BACKEND_BIND:-127.0.0.1:8000}"
else
    COMPOSE_CMD="docker compose --env-file .env.production -f docker-compose.prod.yml"
    log "🚀 Running in STANDALONE MODE (Traefik on ports 80 & 443)"
fi

# ── Make Scripts Executable ──────────────────────────────────
chmod +x scripts/*.sh

# ── Build Images ─────────────────────────────────────────────
log "Building production images..."
${COMPOSE_CMD} build

# ── Deploy ───────────────────────────────────────────────────
log "Deploying services..."
${COMPOSE_CMD} up -d

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
${COMPOSE_CMD} exec -T backend alembic upgrade head

# ── Seed Database (idempotent) ───────────────────────────────
log "Ensuring database seed..."
${COMPOSE_CMD} exec -T backend python -m scripts.seed

# ── Verify ───────────────────────────────────────────────────
log "Verifying deployment..."
HTTP_STATUS=$(${COMPOSE_CMD} exec -T backend curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/api/health) || HTTP_STATUS="000"
if [[ "${HTTP_STATUS}" -eq 200 ]]; then
    log "🎉 Deployment successful! API is healthy."
else
    error "API health check failed with status ${HTTP_STATUS}"
    ${COMPOSE_CMD} logs --tail=30 backend
    exit 1
fi

# ── Summary ──────────────────────────────────────────────────
echo ""
log "═══════════════════════════════════════════════"
log "  AgencyOS V2.1 — Deployment Complete"
log "═══════════════════════════════════════════════"
if [[ "${MODE}" == "coexist" ]]; then
    log "  Mode:      COEXISTENCE (Safe for shared servers)"
    log "  Frontend:  http://127.0.0.1:8088"
    log "  Backend:   http://127.0.0.1:8000"
    log "───────────────────────────────────────────────"
    log "  Host Nginx Routing Step:"
    log "  1. Copy config: sudo cp infra/nginx/agencyos_host.conf /etc/nginx/sites-available/agencyos.conf"
    log "  2. Link:        sudo ln -s /etc/nginx/sites-available/agencyos.conf /etc/nginx/sites-enabled/"
    log "  3. Reload:      sudo nginx -t && sudo systemctl reload nginx"
    log "  4. SSL Certs:   sudo certbot --nginx -d app.${DOMAIN} -d api.${DOMAIN}"
else
    log "  Mode:      STANDALONE (Traefik managed)"
    log "  API:       https://api.${DOMAIN:-yourdomain.com}"
    log "  App:       https://app.${DOMAIN:-yourdomain.com}"
    log "  Grafana:   https://grafana.${DOMAIN:-yourdomain.com}"
fi
log "═══════════════════════════════════════════════"
echo ""
log "Next steps:"
log "  1. Set up backup cron: crontab -e → 0 2 * * * cd $(pwd) && ./scripts/backup-cron.sh"
log "  2. Configure Telegram alerts in .env.production (optional)"
