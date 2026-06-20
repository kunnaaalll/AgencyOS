# ============================================================
# AgencyOS V2 — Frontend Dockerfile (Production Hardened)
# Multi-stage: development → builder → production (nginx)
# ============================================================

FROM node:20-alpine AS base
WORKDIR /app

# ── Development Stage ─────────────────────────────────────────
FROM base AS development

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

# ── Build Stage ───────────────────────────────────────────────
FROM base AS builder

COPY package*.json ./
RUN npm ci --no-audit --no-fund

COPY . .
RUN npm run build

# ── Production Stage ──────────────────────────────────────────
FROM nginx:1.27-alpine AS production

# Remove default config
RUN rm /etc/nginx/conf.d/default.conf

# Copy built assets
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy hardened nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Create non-root nginx user setup
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid

USER nginx

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:80/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
