# Next.js standalone + Prisma — imagen mínima para Coolify
# Build pack: Dockerfile (no Nixpacks)

ARG NODE_VERSION=22-bookworm-slim

# ---------- deps ----------
FROM node:${NODE_VERSION} AS deps
WORKDIR /app

RUN apt-get update -y \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
COPY prisma ./prisma/

RUN npm ci --no-audit --no-fund

# ---------- build ----------
FROM node:${NODE_VERSION} AS builder
WORKDIR /app

RUN apt-get update -y \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
# URL dummy solo para generate; la real llega en runtime vía Coolify
ARG DATABASE_URL="postgresql://user:pass@localhost:5432/build"
ENV DATABASE_URL=$DATABASE_URL

RUN npx prisma generate && npm run build

# ---------- runner ----------
FROM node:${NODE_VERSION} AS runner
WORKDIR /app

ARG PRISMA_VERSION=6.19.3

RUN apt-get update -y \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/* \
  && groupadd --system --gid 1001 nodejs \
  && useradd --system --uid 1001 --gid nodejs nextjs

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

# Evita que el CLI cargue prisma.config.ts (dotenv / TS) en runtime
RUN rm -f /app/prisma.config.ts

# CLI de Prisma en directorio aparte (con deps: effect, etc.) — no rompe standalone
RUN mkdir -p /opt/prisma \
  && cd /opt/prisma \
  && npm init -y >/dev/null \
  && npm install "prisma@${PRISMA_VERSION}" --omit=dev --no-audit --no-fund \
  && chown -R nextjs:nodejs /opt/prisma

COPY --chown=nextjs:nodejs docker-entrypoint.sh ./
RUN sed -i 's/\r$//' docker-entrypoint.sh && chmod +x docker-entrypoint.sh

USER nextjs
EXPOSE 3000

ENTRYPOINT ["/bin/sh", "/app/docker-entrypoint.sh"]
CMD ["node", "server.js"]
