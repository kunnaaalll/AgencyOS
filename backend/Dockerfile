FROM python:3.12-slim AS base

# ── System dependencies ───────────────────────────────────────
RUN apt-get update && apt-get install -y \
    curl \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# ── Install uv for fast package management ───────────────────
RUN pip install --no-cache-dir uv

# ────────────────────────────────────────────────────────────
FROM base AS development

# Install all dependencies including dev
COPY pyproject.toml .
RUN uv pip install --system -e ".[dev]"
RUN playwright install --with-deps chromium

# Copy source
COPY . .

# Expose port
EXPOSE 8000

# Default command — hot reload in development
CMD ["uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload", "--log-level", "info"]

# ────────────────────────────────────────────────────────────
FROM base AS production

# Install production dependencies only
COPY pyproject.toml .
RUN uv pip install --system .
RUN playwright install --with-deps chromium

# Copy source
COPY . .

# Create non-root user
RUN groupadd -r agencyos && useradd -r -g agencyos agencyos
RUN chown -R agencyos:agencyos /app
USER agencyos

EXPOSE 8000

CMD ["uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4", "--log-level", "info"]
