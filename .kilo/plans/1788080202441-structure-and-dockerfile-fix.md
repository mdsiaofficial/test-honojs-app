# Implementation Plan: Project Structure & Dockerfile Fix

## Context

User preferences:
- Routes in `src/routes/`
- Controllers in `src/controllers/` (NEW - delegate from routes)
- Services in `src/services/` (delegate from controllers)
- Drizzle folder at `src/drizzle/` (already configured in `drizzle.config.ts`)
- config already correctly in `src/config/`
- Keep package.json as-is
- Fix Dockerfile issues
- Keep existing partial implementations

**Note**: `drizzle.config.ts` already exists at root with `out: "./src/drizzle"` - this matches the desired structure.

---

## Task 1: Fix Dockerfile

### Issues Identified:
1. **`USER bun` fails** - `oven/bun:1.4.0-alpine` doesn't create a `bun` user by default
2. **Healthcheck uses `wget`** - Not available in Alpine by default
3. **Missing `.env.example`** - Should be copied to `.env` for defaults

### Fix Applied:
```dockerfile
FROM oven/bun:1.4.0-alpine AS base
WORKDIR /app

FROM base AS deps
WORKDIR /app
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile --production

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

# Install wget for healthcheck, then drop privileges
RUN apk add --no-cache wget && addgroup -S appgroup && adduser -S appuser -G appgroup

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/health || exit 1

USER appuser
CMD ["bun", "run", "src/server.ts"]
```

---

## Task 2: Create Missing Files (per create.md)

### Existing Files (KEEP):
- `src/types/types.ts` → rename to `src/types/index.ts`
- `src/config/env.ts` ✓
- `src/config/db.ts` ✓
- `src/schema/users.ts` ✓
- `src/schema/posts.ts` ✓
- `src/schema/index.ts` ✓
- `src/routes/index.ts` ✓
- `src/routes/health.routes.ts` ✓
- `src/app.ts` ✓
- `src/server.ts` ✓
- `src/middlewares/error.middleware.ts` ✓
- `src/validators/index.ts` ✓

### Missing Files to CREATE:

**Types:**
- `src/types/index.ts` (rename from `types.ts`)

**Middlewares:**
- `src/middlewares/auth.middleware.ts`

**Validators:**
- `src/validators/auth.validator.ts`
- `src/validators/user.validator.ts`
- `src/validators/post.validator.ts`

**Repositories:**
- `src/repositories/user.repository.ts`
- `src/repositories/post.repository.ts`

**Services:**
- `src/services/auth.service.ts`
- `src/services/user.service.ts`
- `src/services/post.service.ts`

**Controllers:**
- `src/controllers/auth.controller.ts`
- `src/controllers/user.controller.ts`
- `src/controllers/post.controller.ts`

**Routes (update to use controllers):**
- `src/routes/auth.routes.ts`
- `src/routes/user.routes.ts`
- `src/routes/post.routes.ts`

**Tests:**
- `tests/health.test.ts`
- `tests/validators.test.ts`
- `tests/services.test.ts`
- `tests/auth.test.ts`

**Config Files:**
- `.env.example`
- `.dockerignore`

### Directory Structure After:
```
src/
├── types/index.ts
├── config/env.ts, db.ts
├── schema/users.ts, posts.ts, index.ts
├── repositories/user.repository.ts, post.repository.ts
├── services/auth.service.ts, user.service.ts, post.service.ts
├── controllers/auth.controller.ts, user.controller.ts, post.controller.ts
├── routes/index.ts, health.routes.ts, auth.routes.ts, user.routes.ts, post.routes.ts
├── middlewares/error.middleware.ts, auth.middleware.ts
├── validators/index.ts, auth.validator.ts, user.validator.ts, post.validator.ts
├── drizzle/
├── app.ts
└── server.ts
tests/
├── health.test.ts
├── validators.test.ts
├── services.test.ts
└── auth.test.ts
drizzle.config.ts (at root - already exists)
```

---

## Task 3: Data Flow Architecture

```
Routes → Controllers → Services → Repositories → Database
```

- **Routes**: Hono route definitions, Zod validation, delegate to controllers
- **Controllers**: Request extraction, response formatting, call services
- **Services**: Business logic, authorization checks
- **Repositories**: Drizzle ORM queries, data access

---

## Validation Steps

1. Run `bun run dev` - verify app starts without errors
2. Run `bun test` - verify tests pass
3. Run `docker:build` - verify Docker image builds
4. Run `docker:run` - verify container starts and healthcheck passes

---

## Risks & Notes

1. **Package.json issue** (not fixing per user request): `@types/bun` and `drizzle-kit` in `dependencies` instead of `devDependencies` adds ~30-50MB to production image
2. **Database URL mismatch**: `drizzle.config.ts` uses `postgres://test_honojs_db:test_honojs_db@...` while `create.md` shows `postgres://postgres:postgres@...` - existing implementation uses the former
