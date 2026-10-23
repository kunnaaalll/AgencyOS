# AgencyOS V2.1 Production Deployment Plan (Safe Coexistence Mode)

> **For Agent / Pair-Programming:** Follow this step-by-step checklist to deploy AgencyOS V2.1 to the live production server (`147.224.203.127`) without disrupting existing web applications, databases, or processes.

**Goal:** Deploy AgencyOS V2.1 to production on Oracle Cloud Ampere A1, coexisting safely alongside existing services with zero port collisions and zero downtime to active sites.

**Architecture:** AgencyOS runs isolated microservices in a dedicated Docker bridge network with Traefik disabled (`replicas: 0`). The Frontend and Backend bind exclusively to local loopback ports (`127.0.0.1:8088` and `127.0.0.1:8000`), which are reverse-proxied and SSL-terminated by the host's existing Nginx server.

**Tech Stack:** Docker Compose v2, FastAPI (Python 3.12), React 18 / Vite 8, PostgreSQL 16, Redis 7, ARQ Worker + Playwright, MinIO, Meilisearch, OpenRouter AI, Host Nginx + Certbot.

---

## Pre-Flight Safety Guarantees

| Concern | Protection Mechanism | Verification |
| :--- | :--- | :--- |
| **Port 80 / 443 collision** | Standalone Traefik disabled; Nginx on host retains sole ownership of 80/443. | `docker-compose.coexist.yml` sets `traefik.deploy.replicas: 0` |
| **Database/Redis clash** | AgencyOS Postgres and Redis have NO host port mappings. | Communicates over private `agencyos_network` only |
| **Server RAM / OOM safety** | Hard memory caps set per container (~1.8 GB RAM total for core stack). | `deploy.resources.limits.memory` configured on every container |
| **Zero downtime for existing sites** | Host Nginx configuration is added as an isolated virtual host and reloaded gracefully. | `sudo nginx -t && sudo systemctl reload nginx` |

---

## Phase 1: Local Pre-Deployment Verification

### Task 1.1: Verify Frontend Production Build
- **Target:** `frontend/`
- **Command:** `cd frontend && npm run build`
- **Expected Result:** `✓ built in ~400ms`, `dist/index.html` and `dist/assets` generated with 0 errors.

### Task 1.2: Stage and Commit Workspace Changes
- **Target:** Workspace root
- **Command:**
  ```bash
  git add .
  git commit -m "feat(deploy): configure zero-disturbance coexistence mode and production assets"
  git push origin main
  ```
- **Expected Result:** Clean git working tree; all changes pushed to remote branch.

---

## Phase 2: Remote Server Inspection & Directory Setup

### Task 2.1: Connect to Remote Server via SSH
- **Command:**
  ```bash
  ssh -i "/Applications/My Mac/Setup/A1-SERVER/ampere_ssh_key" ubuntu@147.224.203.127
  ```
- **Expected Result:** Successful shell prompt on `ubuntu@ampere-server`.

### Task 2.2: Verify Port Availability on Localhost
- **Command:**
  ```bash
  ss -tulpn | grep -E ':8088|:8000'
  ```
- **Expected Result:** Clean output (neither `8088` nor `8000` is currently in use).

### Task 2.3: Prepare Deployment Directory
- **Command:**
  ```bash
  sudo mkdir -p /opt/agencyos
  sudo chown -R ubuntu:ubuntu /opt/agencyos
  cd /opt/agencyos
  ```
- **Expected Result:** `/opt/agencyos` created and writeable by `ubuntu`.

---

## Phase 3: Code Sync & Configuration Verification

### Task 3.1: Pull or Clone Repository
- **Command:**
  ```bash
  if [ -d "/opt/agencyos/.git" ]; then
    git pull origin main
  else
    git clone <your-repo-url> /opt/agencyos
  fi
  cd /opt/agencyos
  ```
- **Expected Result:** Complete code repository placed in `/opt/agencyos`.

### Task 3.2: Verify Production Environment File
- **Command:**
  ```bash
  grep -E 'DEPLOY_MODE|FRONTEND_BIND|BACKEND_BIND|OPENROUTER_API_KEY' .env.production
  ```
- **Expected Output:**
  ```text
  DEPLOY_MODE=coexist
  FRONTEND_BIND=127.0.0.1:8088:80
  BACKEND_BIND=127.0.0.1:8000:8000
  OPENROUTER_API_KEY=sk-or-v1-92e26...
  ```

---

## Phase 4: Build, Launch & Database Initialization

### Task 4.1: Run Safe Automated Deployment Script
- **Command:**
  ```bash
  chmod +x scripts/*.sh
  ./scripts/deploy.sh --coexist
  ```
- **What happens automatically:**
  1. Docker builds multi-stage production images for backend, worker, and frontend.
  2. Services boot in background (`postgres`, `redis`, `minio`, `meilisearch`, `litellm`, `backend`, `worker`, `frontend`).
  3. Traefik is scaled to 0 (skipped).
  4. Waits 20s for healthchecks to pass.
  5. Runs `alembic upgrade head` to apply database migrations.
  6. Runs `python -m scripts.seed` to create superadmin user and default organization.
  7. Validates local HTTP health check (`200 OK`).

### Task 4.2: Verify Container Status
- **Command:**
  ```bash
  docker compose --env-file .env.production -f docker-compose.prod.yml -f docker-compose.coexist.yml ps
  ```
- **Expected Result:**
  - `agencyos_postgres` (Up, healthy)
  - `agencyos_redis` (Up, healthy)
  - `agencyos_minio` (Up, healthy)
  - `agencyos_meilisearch` (Up, healthy)
  - `agencyos_litellm` (Up, healthy)
  - `agencyos_backend` (Up, healthy, bound to `127.0.0.1:8000->8000/tcp`)
  - `agencyos_worker` (Up)
  - `agencyos_frontend` (Up, bound to `127.0.0.1:8088->80/tcp`)

### Task 4.3: Test Local Endpoints
- **Command:**
  ```bash
  curl -I http://127.0.0.1:8000/api/health
  curl -I http://127.0.0.1:8088/health
  ```
- **Expected Result:** Both return `HTTP/1.1 200 OK`.

---

## Phase 5: Host Reverse Proxy (Nginx) Integration (Zero Downtime)

### Task 5.1: Copy Nginx Virtual Host Config
- **Command:**
  ```bash
  sudo cp /opt/agencyos/infra/nginx/agencyos_host.conf /etc/nginx/sites-available/agencyos.conf
  sudo ln -sf /etc/nginx/sites-available/agencyos.conf /etc/nginx/sites-enabled/
  ```

### Task 5.2: Safely Test Nginx Configuration Syntax
- **Command:**
  ```bash
  sudo nginx -t
  ```
- **Expected Result:** `nginx: configuration file /etc/nginx/nginx.conf test is successful`.
- *(CRITICAL GATE: Do not proceed to reload if `nginx -t` reports any syntax errors).*

### Task 5.3: Graceful Nginx Reload
- **Command:**
  ```bash
  sudo systemctl reload nginx
  ```
- **Expected Result:** Instant graceful reload without dropping any existing connections or stopping other sites.

### Task 5.4: Apply SSL via Certbot (Optional / Recommended)
- **Command:**
  ```bash
  sudo certbot --nginx -d app.147.224.203.127.nip.io -d api.147.224.203.127.nip.io --non-interactive --agree-tos --email admin@agencyos.io
  ```
- **Expected Result:** Automatic Let's Encrypt certificates generated and added to `agencyos.conf`.

---

## Phase 6: Live Smoke Test & Verification

### Task 6.1: Verify Public Web Access
- Open browser and navigate to: `https://app.147.224.203.127.nip.io`
- Verify the login screen loads with HTTPS secure padlock.

### Task 6.2: Authenticate Super Admin Account
- **Credentials:**
  - **Email:** `admin@agencyos.io`
  - **Password:** `GK0pzBYsGk_0PLyLosscew`
- Verify successful login redirect to `/dashboard`.

### Task 6.3: UI & System Verification
- Check **Dashboard**:
  - Live 4-Layer Anti-Duplication Protocol badge displays **ACTIVE & PROTECTED**.
  - Autopilot Control Bar displays **ACTIVE 24/7**.
- Navigate across navigation tabs:
  - **Leads & Pipeline**: Verify table renders with zero crash.
  - **Outreach & Harvey AI**: Verify pitch templates and 23-signal detectors load.
  - **Finance / Commercials**: Verify ₹9,999 trial + ₹25,000/mo retainer calculator.

---

## Phase 7: Rollback / Disaster Recovery Protocol

If any unforeseen issue occurs with AgencyOS:
1. **Unlink Host Nginx:**
   ```bash
   sudo rm /etc/nginx/sites-enabled/agencyos.conf
   sudo systemctl reload nginx
   ```
   *(Existing sites remain 100% untouched and operational).*
2. **Stop AgencyOS Containers:**
   ```bash
   cd /opt/agencyos
   docker compose --env-file .env.production -f docker-compose.prod.yml -f docker-compose.coexist.yml down
   ```
   *(Frees all internal Docker resources cleanly).*
