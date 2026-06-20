# AgencyOS V2 — Development Setup Guide

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Docker | 24+ | [docker.com](https://docker.com) |
| Docker Compose | v2+ | included with Docker Desktop |
| Node.js | 20+ | [nodejs.org](https://nodejs.org) |
| Python | 3.12+ | [python.org](https://python.org) |

---

## Quick Start (Docker)

```bash
# 1. Clone the repository
git clone <repo-url> agencyos-v2
cd agencyos-v2

# 2. Copy and configure environment
cp .env.example .env
# Edit .env and change ALL passwords/secrets

# 3. Build and start all services
make up-build

# 4. Run database migrations
make migrate

# 5. Seed initial data
make seed

# 6. Access the platform
open http://localhost:5173    # Frontend
open http://localhost:8000/docs  # API Docs
```

---

## Default Credentials (after seeding)

| Field | Value |
|-------|-------|
| Email | `admin@agencyos.io` (or your `SEED_SUPERADMIN_EMAIL`) |
| Password | From your `SEED_SUPERADMIN_PASSWORD` env var |

---

## Service URLs

| Service | URL | Notes |
|---------|-----|-------|
| Frontend | http://localhost:5173 | React app |
| Backend API | http://localhost:8000 | FastAPI |
| Swagger UI | http://localhost:8000/docs | Interactive docs |
| ReDoc | http://localhost:8000/redoc | API reference |
| Health Check | http://localhost:8000/api/health | JSON status |
| Traefik | http://localhost:8080 | Proxy dashboard |
| MinIO Console | http://localhost:9001 | Object storage UI |
| Meilisearch | http://localhost:7700 | Search engine |

---

## Development Commands

```bash
make help           # Show all available commands

# Docker
make up             # Start all services (detached)
make up-build       # Build and start
make down           # Stop all services
make restart        # Restart all services
make logs           # Follow all logs
make logs-backend   # Follow backend logs

# Database
make migrate        # Run Alembic migrations
make migrate-create MSG="add_contacts" # Create new migration
make migrate-down   # Rollback last migration
make migrate-history # Show migration history
make seed           # Seed initial data

# Testing
make test           # Run backend tests
make test-cov       # Tests with coverage report
make lint           # Run ruff linter
make format         # Auto-format code

# Shells
make backend-shell  # Open shell in backend container
make frontend-shell # Open shell in frontend container
```

---

## Local Backend Development (without Docker)

```bash
cd backend

# Create virtual environment
python -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install uv
uv pip install -e ".[dev]"

# Start development server
uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload
```

> Note: You'll need PostgreSQL, Redis, MinIO, and Meilisearch running locally or via Docker.

---

## Local Frontend Development (without Docker)

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

---

## Environment Variables

All configuration is managed via `.env`. See `.env.example` for all available options.

**Required secrets to change before production:**
- `POSTGRES_PASSWORD`
- `REDIS_PASSWORD`
- `JWT_SECRET_KEY` (must be ≥32 chars)
- `MINIO_ACCESS_KEY` + `MINIO_SECRET_KEY`
- `MEILISEARCH_MASTER_KEY`
- `SEED_SUPERADMIN_PASSWORD`

---

## Running Tests

```bash
# Backend tests
make test

# With coverage
make test-cov

# Frontend tests
cd frontend && npm run test

# Frontend test UI
cd frontend && npm run test:ui
```

---

## Troubleshooting

### Backend fails to connect to PostgreSQL
Wait for PostgreSQL to be healthy: `docker compose ps`

### MinIO bucket errors on startup
The backend will auto-create the bucket on startup. Check logs: `make logs-backend`

### Frontend 401 errors
Run `make seed` to create the super admin user, then login at http://localhost:5173/login
