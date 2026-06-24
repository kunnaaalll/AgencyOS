# AgencyOS V2.1 — Production Runbook

This runbook covers the daily operations, deployment, and disaster recovery procedures for the AgencyOS V2.1 production environment hosted on Oracle Cloud Free Tier.

## 1. System Architecture

*   **Reverse Proxy / TLS Termination:** Traefik v3 (Let's Encrypt automatic certificates)
*   **Backend:** FastAPI (Python 3.12, ASGI)
*   **Frontend:** React/Vite (served via Nginx alpine)
*   **Database:** PostgreSQL 16
*   **Cache / Message Broker:** Redis 7
*   **Background Workers:** ARQ (with Playwright for discovery tasks)
*   **Object Storage:** MinIO
*   **Search Engine:** Meilisearch v1.7
*   **Monitoring Stack:** Prometheus, Grafana, Loki, Promtail, Alertmanager, Node Exporter, Postgres/Redis Exporters

## 2. Deployment

### Initial Setup

1.  Provision an Oracle Cloud VM (ARM64, 24GB RAM, 200GB Block Volume).
2.  Install Docker and Docker Compose.
3.  Clone the repository: `git clone <repo-url> /opt/agencyos && cd /opt/agencyos`
4.  Copy `.env.production.example` to `.env.production` and fill in **ALL** missing values (no `CHANGE_ME` allowed).
5.  Run the deployment script: `./scripts/deploy.sh`

### Normal Updates

Deployments are handled via GitHub Actions manually or by running `./scripts/deploy.sh` on the server.
The script performs health checks, runs database migrations, and verifies API health before considering the deployment successful.

## 3. Operations & Maintenance

### Checking Service Status

```bash
cd /opt/agencyos
docker compose --env-file .env.production -f docker-compose.prod.yml ps
```

### Viewing Logs

Live logs for the backend:
```bash
docker compose --env-file .env.production -f docker-compose.prod.yml logs -f backend
```
*Note: All logs are also shipped to Loki and available in Grafana.*

### Restarting a Service

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml restart backend worker
```

## 4. Backups and Restore

### Automated Backups

Backups are executed daily at 02:00 via a cron job that runs `scripts/backup.sh`.
The backup includes:
1. PostgreSQL dump (pg_dump)
2. MinIO metadata
3. Configuration files and compose definitions

Backups are stored in `/opt/agencyos/backups` (7 daily, 4 weekly).
Alertmanager will notify the Telegram channel upon success or failure.

### Manual Backup

```bash
cd /opt/agencyos
./scripts/backup.sh
```

### Disaster Recovery (Restore)

If the database gets corrupted or data needs to be restored:

1.  Identify the backup file you want to restore:
    ```bash
    ls -lh /opt/agencyos/backups/daily/
    ```
2.  Run the interactive restore script:
    ```bash
    cd /opt/agencyos
    ./scripts/restore.sh ./backups/daily/agencyos_backup_2026...tar.gz
    ```
3.  Follow the prompts to confirm dropping the current database and applying the restore.
4.  Restart the backend and workers:
    ```bash
    docker compose --env-file .env.production -f docker-compose.prod.yml restart backend worker
    ```

## 5. Incident Response

### High Memory Usage / Out of Memory (OOM)
*   **Symptom:** Grafana alerts trigger for memory > 90%, services restart unexpectedly.
*   **Action:** Check `docker stats`. If Redis is the culprit, check its `maxmemory-policy`. If it's a memory leak in the ARQ worker (often Playwright related), restart the worker service.

### Database Connection Pool Exhausted
*   **Symptom:** API returns 500 errors or times out; Grafana alerts for high Postgres connections.
*   **Action:**
    1. Check currently active queries:
       `docker exec agencyos_postgres psql -U agencyos -c "SELECT * FROM pg_stat_activity WHERE state = 'active';"`
    2. Restart backend to flush the pool.
    3. Ensure SQLAlchemy pool configuration (`pool_size` and `max_overflow`) matches the capacity of your DB instance.

### Rate Limiting Lockouts
*   **Symptom:** Valid users getting HTTP 429 Too Many Requests on login.
*   **Action:** Identify the user's IP. If it's a false positive, clear the lockout manually in Redis:
    ```bash
    docker exec agencyos_redis redis-cli -a <password> keys "login:lockout:*"
    docker exec agencyos_redis redis-cli -a <password> del "login:lockout:<user_email>"
    ```

## 6. Security Hardening Details

*   **Passwords:** Hashed with Argon2id. Transparent migration from legacy bcrypt is implemented on successful login.
*   **Authentication:** JWTs with 15-minute access TTL and 1-day refresh TTL. Refresh tokens are rotated upon use. Redis-backed token revocation list checks the JWT `jti` claim on every request.
*   **Brute-Force Protection:** 5 failed logins result in a 15-minute account lockout, tracked via Redis.
*   **Audit Logging:** SQLAlchemy event listeners capture `CREATE`, `UPDATE`, and `DELETE`. Critical security events (`LOGIN`, `LOGOUT`, `PASSWORD_CHANGE`) bypass listeners to explicitly capture request IP and User-Agent.
*   **Infrastructure:** No containers run as root. The production network is isolated and exposed only via Traefik. Strict security headers (CSP, HSTS, X-Frame-Options) are enforced at the proxy layer.
