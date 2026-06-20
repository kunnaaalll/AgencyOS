# AgencyOS V2

> **Phase 1 — Core Platform Foundation**

A production-grade agency operations platform built on a clean, extensible monorepo architecture.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | FastAPI · Python 3.12 · SQLAlchemy 2.0 · Alembic |
| Database | PostgreSQL 16 |
| Cache / Queue | Redis 7 · ARQ |
| Object Storage | MinIO |
| Search | Meilisearch |
| Frontend | React 18 · TypeScript · Vite · TailwindCSS · Shadcn UI |
| State | TanStack Query · TanStack Store · TanStack Router |
| Proxy | Traefik |

---

## Quick Start

### Prerequisites
- Docker + Docker Compose v2
- Node.js 20+ (for local frontend development)
- Python 3.12+ (for local backend development)

### 1. Clone & Configure

```bash
git clone <repo-url> agencyos-v2
cd agencyos-v2
cp .env.example .env
# Edit .env with your credentials
```

### 2. Start Services

```bash
make up-build
```

### 3. Run Migrations

```bash
make migrate
```

### 4. Seed Database

```bash
make seed
```

### 5. Access Services

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:8000 |
| Swagger UI | http://localhost:8000/docs |
| Traefik Dashboard | http://localhost:8080 |
| MinIO Console | http://localhost:9001 |
| Meilisearch | http://localhost:7700 |

---

## Repository Structure

```
agencyos-v2/
├── backend/          # FastAPI backend service
│   ├── api/          # FastAPI app, routers, deps
│   ├── core/         # Config, DB, security, integrations
│   ├── domain/       # Business domain modules
│   ├── repositories/ # Data access layer
│   ├── services/     # Service layer
│   ├── events/       # Event system (future)
│   ├── workers/      # ARQ background workers
│   ├── utils/        # Shared utilities
│   └── scripts/      # Management scripts
├── frontend/         # React + Vite frontend
├── workers/          # Standalone ARQ worker service
├── infra/            # Infrastructure configuration
│   ├── traefik/
│   ├── prometheus/
│   ├── grafana/
│   └── loki/
├── docs/             # Documentation
├── docker-compose.yml
├── .env.example
└── Makefile
```

---

## Development Commands

```bash
make help          # Show all commands
make up            # Start services
make down          # Stop services
make logs          # Follow all logs
make migrate       # Run DB migrations
make seed          # Seed initial data
make test          # Run backend tests
make lint          # Run linters
make format        # Auto-format code
```

---

## Architecture Decisions

See [`docs/architecture.md`](docs/architecture.md) for detailed architecture documentation.

---

## Phase Roadmap

- [x] **Phase 1** — Core Platform Foundation *(current)*
- [ ] Phase 2 — CRM & Pipeline
- [ ] Phase 3 — Lead Intelligence Engine
- [ ] Phase 4 — Outreach Engine
- [ ] Phase 5 — Proposal Engine
- [ ] Phase 6 — Client OS
- [ ] Phase 7 — Finance OS
- [ ] Phase 8 — Analytics OS
- [ ] Phase 9 — AI Features
