FROM python:3.12-slim AS base

RUN apt-get update && apt-get install -y \
    curl \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

RUN pip install --no-cache-dir uv

# ── Development ───────────────────────────────────────────────
FROM base AS development

COPY pyproject.toml .
RUN uv pip install --system -e ".[dev]"

COPY . .

CMD ["arq", "workers.worker.WorkerSettings"]

# ── Production ────────────────────────────────────────────────
FROM base AS production

COPY pyproject.toml .
RUN uv pip install --system .

COPY . .

RUN groupadd -r agencyos && useradd -r -g agencyos agencyos
USER agencyos

CMD ["arq", "workers.worker.WorkerSettings"]
