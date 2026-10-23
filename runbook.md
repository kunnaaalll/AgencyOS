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

## 2. Server Specifications & Production Endpoints

*   **Host Server:** Oracle Cloud Infrastructure (`VM.Standard.A1.Flex`, 4 OCPU ARM64, 24 GB RAM, Always Free)
*   **Public IP:** `147.224.203.127`
*   **Wildcard DNS:** `147.224.203.127.nip.io` (Auto-resolves to server IP with Let's Encrypt TLS)

| Service | Production URL | Description |
| :--- | :--- | :--- |
| **Frontend Web App** | `https://app.147.224.203.127.nip.io` | Main AgencyOS Dashboard & Workspaces |
| **Backend API** | `https://api.147.224.203.127.nip.io` | FastAPI Core Endpoints |
| **Swagger UI** | `https://api.147.224.203.127.nip.io/docs` | Interactive OpenAPI documentation |
| **Grafana** | `https://grafana.147.224.203.127.nip.io` | Observability & metrics dashboards |
| **MinIO Console** | `https://minio.147.224.203.127.nip.io` | S3-compatible object storage console |
| **LiteLLM Proxy** | `https://llm.147.224.203.127.nip.io` | AI model routing & proxy |

## 3. Deployment

### Firewall & OCI Security List Prerequisites

Ensure the following ports are open in the OCI Security List (`ampere-vcn`) and local `iptables`/`ufw`:
*   `80/tcp` (HTTP -> Traefik HTTP-01 Let's Encrypt challenge & redirect)
*   `443/tcp` (HTTPS -> Traefik secure entrypoint)

```bash
# On the server (if ufw/iptables is active):
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT
sudo netfilter-persistent save
```

### Initial Setup & Launch (Zero-Disturbance Coexistence Mode)

When deploying to a server with existing active websites/proxies (Nginx, Caddy, Apache):
1.  Connect to the server:
    ```bash
    ssh -i "/Applications/My Mac/Setup/A1-SERVER/ampere_ssh_key" ubuntu@147.224.203.127
    ```
2.  Clone or sync the repository to `/opt/agencyos`:
    ```bash
    sudo mkdir -p /opt/agencyos && sudo chown -R ubuntu:ubuntu /opt/agencyos
    cd /opt/agencyos
    git clone <repo-url> .
    ```
3.  Deploy in Coexistence Mode (Default):
    ```bash
    ./scripts/deploy.sh
    # or explicitly: ./scripts/deploy.sh --coexist
    ```
    *This runs all AgencyOS microservices in an isolated Docker network, disables Traefik so ports 80/443 are never touched, and binds Frontend to loopback `127.0.0.1:8088` and Backend to `127.0.0.1:8000`.*

4.  Link host Nginx (takes 10 seconds, zero downtime for existing sites):
    ```bash
    sudo cp infra/nginx/agencyos_host.conf /etc/nginx/sites-available/agencyos.conf
    sudo ln -s /etc/nginx/sites-available/agencyos.conf /etc/nginx/sites-enabled/
    sudo nginx -t && sudo systemctl reload nginx
    ```
5.  Generate SSL via Certbot (optional):
    ```bash
    sudo certbot --nginx -d app.147.224.203.127.nip.io -d api.147.224.203.127.nip.io
    ```

### Normal Updates

Deployments are handled automatically via GitHub Actions upon push to `main`, or by running `./scripts/deploy.sh` directly on the server.
The script performs pre-flight checks, image builds, automated migrations, database seeding, and health checks before marking the deployment successful.

## 4. Operations & Maintenance

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
