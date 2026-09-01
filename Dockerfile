# ==========================================
# 1. Base stage with Bun 1.4.0 on Alpine Linux
# ==========================================
FROM oven/bun:1.4.0-alpine AS base
WORKDIR /app

# ==========================================
# 2. Dependencies installation stage
# ==========================================
FROM base AS deps
WORKDIR /app

COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile --production

# ==========================================
# 3. Production runner stage
# ==========================================
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY src ./src
COPY drizzle.config.ts ./
COPY tsconfig.json ./
COPY .env.example .env

EXPOSE 5000

RUN apk add --no-cache wget && addgroup -S appgroup && adduser -S appuser -G appgroup

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/health || exit 1

USER appuser
CMD ["bun", "run", "src/server.ts"]
