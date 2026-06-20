# AgencyOS V2 — Architecture Documentation

## System Overview

AgencyOS V2 is a production-grade agency operations platform built as a clean monorepo. The Phase 1 Core Platform Foundation establishes the architecture that all future modules build upon.

---

## Architecture Principles

1. **Domain-Driven Design** — Business logic lives in domain modules
2. **Repository Pattern** — Data access is abstracted from business logic
3. **Service Layer** — Orchestrates domain operations and cross-cutting concerns
4. **RBAC** — Permission-based access control at the dependency injection level
5. **Event-Driven Ready** — Event bus architecture prepared for future async workflows

---

## Backend Architecture

```
backend/
├── api/                    # FastAPI app + routers + dependency injection
│   ├── main.py             # App factory with middleware + exception handlers
│   ├── router.py           # Root router aggregation
│   ├── deps.py             # Auth + RBAC dependency injection
│   └── health.py           # Health check endpoint
│
├── core/                   # Infrastructure / cross-cutting concerns
│   ├── config.py           # Pydantic Settings v2
│   ├── database.py         # SQLAlchemy 2.0 async engine
│   ├── security.py         # JWT + bcrypt
│   ├── redis.py            # Redis connection pool + ARQ settings
│   ├── minio.py            # MinIO client
│   ├── meilisearch.py      # Meilisearch client
│   ├── exceptions.py       # Custom exception hierarchy
│   └── logging.py          # Structured logging (structlog)
│
├── domain/                 # Business domains (vertical slices)
│   ├── auth/               # Authentication (login, refresh, logout)
│   ├── user/               # User management
│   ├── organization/       # Multi-tenant organization
│   └── role/               # RBAC roles
│
├── repositories/           # Data access layer
│   ├── base.py             # Generic async repository
│   └── domain.py           # Domain-specific repositories
│
├── services/               # Service layer (cross-domain operations)
│   └── health.py           # System health check service
│
├── events/                 # Event-driven architecture (stub, Phase 1)
│   ├── base.py             # BaseEvent + EventMetadata
│   └── bus.py              # In-process event bus
│
├── workers/                # ARQ background workers (stub, Phase 1)
│   └── worker.py           # WorkerSettings
│
├── utils/                  # Shared utilities
│   ├── slugify.py
│   └── datetime.py
│
└── scripts/
    └── seed.py             # Database seeding
```

---

## Database Schema

```
organizations
  ├── id (UUID PK)
  ├── name
  ├── slug (unique)
  ├── created_at
  └── updated_at

roles
  ├── id (UUID PK)
  ├── name (unique)
  ├── permissions (JSON array)
  ├── created_at
  └── updated_at

users
  ├── id (UUID PK)
  ├── email (unique)
  ├── hashed_password
  ├── first_name / last_name
  ├── is_active
  ├── organization_id → organizations.id
  ├── role_id → roles.id
  ├── created_at
  └── updated_at
```

---

## RBAC Model

Permissions are stored as JSON arrays on the Role model.

| Role | Permissions |
|------|-------------|
| Super Admin | `*` |
| Sales Founder | `pipeline:*`, `opportunities:*`, `contacts:read` |
| Operations Founder | `clients:*`, `projects:*`, `delivery:*` |
| Marketing Founder | `campaigns:*`, `reports:read`, `analytics:read` |
| Finance Founder | `finance:*`, `invoices:*`, `profitability:read` |

Permission checking supports:
- `*` → full access
- `resource:*` → all sub-permissions for a resource
- `resource:action` → specific action on resource

---

## Authentication Flow

```
Client                Backend
  │                      │
  ├── POST /auth/login ──►│ Verify credentials
  │◄── access_token ──────┤ JWT (30min)
  │◄── refresh_token ─────┤ JWT (7 days)
  │                      │
  ├── GET /api/... ───────►│ Bearer access_token
  │◄── 200 response ──────┤
  │                      │
  ├── (token expires)     │
  ├── POST /auth/refresh ─►│ Verify refresh_token
  │◄── new access_token ──┤
  │◄── new refresh_token ─┤
```

---

## Infrastructure

| Service | Purpose | Port |
|---------|---------|------|
| FastAPI | Backend API | 8000 |
| PostgreSQL 16 | Primary database | 5432 |
| Redis 7 | Cache + job queue | 6379 |
| MinIO | Object storage | 9000/9001 |
| Meilisearch | Full-text search | 7700 |
| Traefik | Reverse proxy | 80/443/8080 |

---

## Frontend Architecture

```
frontend/src/
├── components/         # Reusable UI components
│   ├── layout/         # Sidebar, Header, AppLayout
│   └── health/         # HealthCard
├── features/           # Feature modules (vertical slices)
│   ├── auth/           # Login + auth hooks
│   ├── dashboard/      # Health dashboard
│   └── users/          # User management
├── hooks/              # Shared React hooks
├── lib/                # API client, query client, utilities
├── store/              # TanStack Store (local state)
├── types/              # TypeScript type definitions
└── router.tsx          # TanStack Router
```

**State Management Strategy:**
- **Server state**: TanStack Query (caching, invalidation, refetch)
- **Client state**: TanStack Store (auth state, UI preferences)
- **Form state**: React Hook Form
