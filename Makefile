# AgencyOS V2 — Makefile
# ============================================================

.PHONY: help up down restart logs ps \
        migrate seed backend-shell \
        test lint format \
        build clean

.DEFAULT_GOAL := help

# ── Variables ────────────────────────────────────────────────
COMPOSE      = docker compose
BACKEND      = $(COMPOSE) exec backend
PYTHON       = $(BACKEND) python

# ── Help ─────────────────────────────────────────────────────
help: ## Show this help message
	@echo "AgencyOS V2 — Available Commands"
	@echo "================================="
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

# ── Docker ───────────────────────────────────────────────────
up: ## Start all services in detached mode
	$(COMPOSE) up -d

up-build: ## Build and start all services
	$(COMPOSE) up -d --build

down: ## Stop all services
	$(COMPOSE) down

restart: ## Restart all services
	$(COMPOSE) restart

logs: ## Follow logs for all services
	$(COMPOSE) logs -f

logs-backend: ## Follow backend logs
	$(COMPOSE) logs -f backend

ps: ## Show running services
	$(COMPOSE) ps

# ── Database ─────────────────────────────────────────────────
migrate: ## Run Alembic migrations
	$(BACKEND) alembic upgrade head

migrate-create: ## Create a new migration (usage: make migrate-create MSG="description")
	$(BACKEND) alembic revision --autogenerate -m "$(MSG)"

migrate-down: ## Rollback last migration
	$(BACKEND) alembic downgrade -1

migrate-history: ## Show migration history
	$(BACKEND) alembic history

seed: ## Run database seed script
	$(PYTHON) -m scripts.seed

# ── Development ───────────────────────────────────────────────
backend-shell: ## Open a shell in the backend container
	$(BACKEND) /bin/bash

frontend-shell: ## Open a shell in the frontend container
	$(COMPOSE) exec frontend /bin/sh

# ── Testing ───────────────────────────────────────────────────
test: ## Run backend tests
	$(BACKEND) pytest -v

test-cov: ## Run backend tests with coverage
	$(BACKEND) pytest --cov=. --cov-report=html -v

# ── Code Quality ──────────────────────────────────────────────
lint: ## Run linters
	$(BACKEND) ruff check .
	$(BACKEND) ruff format --check .

format: ## Auto-format code
	$(BACKEND) ruff format .
	$(BACKEND) ruff check --fix .

# ── Build ─────────────────────────────────────────────────────
build: ## Build all Docker images
	$(COMPOSE) build

clean: ## Remove containers, volumes, and images
	$(COMPOSE) down -v --rmi local
