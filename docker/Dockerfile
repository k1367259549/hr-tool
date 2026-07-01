# ── Stage 1: base image ────────────────────────────────────────────────────────
FROM node:20-bookworm-slim AS base

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates openssl \
  && rm -rf /var/lib/apt/lists/*

# ── Stage 2: install dependencies ──────────────────────────────────────────────
FROM base AS deps

ARG NPM_REGISTRY=https://registry.npmmirror.com/

ENV NEXT_TELEMETRY_DISABLED=1
ENV NPM_CONFIG_AUDIT=false
ENV NPM_CONFIG_FUND=false
ENV NPM_CONFIG_UPDATE_NOTIFIER=false
ENV NPM_CONFIG_REGISTRY=${NPM_REGISTRY}
ENV NPM_CONFIG_FETCH_TIMEOUT=600000
ENV NPM_CONFIG_FETCH_RETRIES=5
ENV NPM_CONFIG_FETCH_RETRY_MINTIMEOUT=20000
ENV NPM_CONFIG_FETCH_RETRY_MAXTIMEOUT=120000
ENV NPM_CONFIG_MAXSOCKETS=5

COPY package.json package-lock.json .npmrc ./

# Diagnose registry connectivity before attempting install
RUN echo "==> npm registry: $(npm config get registry)" \
  && npm ping --registry="${NPM_REGISTRY}" || echo "WARNING: registry ping failed, continuing anyway" \
  && npm ci --prefer-offline=false

# ── Stage 3: build Next.js app ─────────────────────────────────────────────────
FROM base AS builder

WORKDIR /app

ARG GIT_COMMIT=unknown
ARG BUILD_TIME=unknown

ENV NEXT_TELEMETRY_DISABLED=1
ENV GIT_COMMIT=${GIT_COMMIT}
ENV BUILD_TIME=${BUILD_TIME}

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run prisma:generate
RUN npm run build

# ── Stage 4: production runner ─────────────────────────────────────────────────
FROM base AS runner

WORKDIR /app

ARG GIT_COMMIT=unknown
ARG BUILD_TIME=unknown

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
ENV NPM_CONFIG_AUDIT=false
ENV NPM_CONFIG_FUND=false
ENV NPM_CONFIG_UPDATE_NOTIFIER=false
ENV GIT_COMMIT=${GIT_COMMIT}
ENV BUILD_TIME=${BUILD_TIME}

RUN groupadd --system --gid 1001 nodejs \
  && useradd --system --uid 1001 --gid nodejs nextjs

COPY package.json package-lock.json .npmrc ./
COPY --from=deps /app/node_modules ./node_modules

RUN npm prune --omit=dev --legacy-peer-deps \
  && npm cache clean --force

COPY --from=builder --chown=nextjs:nodejs /app/prompts ./prompts
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma

USER nextjs

EXPOSE 3000

CMD ["sh", "-c", "node ./node_modules/prisma/build/index.js migrate deploy && node server.js"]
