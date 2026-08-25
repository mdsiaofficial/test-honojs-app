# Complete Step-by-Step Guide: Building a Modern Bun + Hono + Drizzle ORM + PostgreSQL Backend

This guide contains everything you need to build this entire production-ready TypeScript backend from scratch on your own.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Naming Conventions Rule](#2-naming-conventions-rule)
3. [Prerequisites](#3-prerequisites)
4. [Step 1: Project Initialization & Directory Setup](#step-1-project-initialization--directory-setup)
5. [Step 2: Configuration Files](#step-2-configuration-files)
   - [package.json](#packagejson)
   - [tsconfig.json](#tsconfigjson)
   - [.env.example & .env](#envexample--env)
   - [drizzle.config.ts](#drizzleconfigts)
   - [.dockerignore & Dockerfile](#dockerignore--dockerfile)
6. [Step 3: Types Layer](#step-3-types-layer)
   - [src/types/index.ts](#srctypesindexts)
7. [Step 4: Environment Config Parser](#step-4-environment-config-parser)
   - [src/config/env.ts](#srcconfigenvts)
8. [Step 5: Database Connection & Drizzle Schemas](#step-5-database-connection--drizzle-schemas)
   - [src/db/schema/users.ts](#srcdbschemausersts)
   - [src/db/schema/posts.ts](#srcdbschemapoststs)
   - [src/db/schema/index.ts](#srcdbschemaindexts)
   - [src/db/index.ts](#srcdbindexts)
9. [Step 6: Repositories Layer (Data Access)](#step-6-repositories-layer-data-access)
   - [src/repositories/user.repository.ts](#srcrepositoriesuserrepositoryts)
   - [src/repositories/post.repository.ts](#srcrepositoriespostrepositoryts)
10. [Step 7: Validation Layer (Zod)](#step-7-validation-layer-zod)
    - [src/validators/auth.validator.ts](#srcvalidatorsauthvalidatorts)
    - [src/validators/user.validator.ts](#srcvalidatorsuservalidatorts)
    - [src/validators/post.validator.ts](#srcvalidatorspostvalidatorts)
    - [src/validators/index.ts](#srcvalidatorsindexts)
11. [Step 8: Middlewares & Error Handling](#step-8-middlewares--error-handling)
    - [src/middlewares/error.middleware.ts](#srcmiddlewareserrormiddlewarets)
    - [src/middlewares/auth.middleware.ts](#srcmiddlewaresauthmiddlewarets)
12. [Step 9: Services Layer (Business Logic)](#step-9-services-layer-business-logic)
    - [src/services/auth.service.ts](#srcservicesauthservicets)
    - [src/services/user.service.ts](#srcservicesuserservicets)
    - [src/services/post.service.ts](#srcservicespostservicets)
13. [Step 10: Routes Layer (Controllers / HTTP)](#step-10-routes-layer-controllers--http)
    - [src/routes/health.routes.ts](#srcrouteshealthroutests)
    - [src/routes/auth.routes.ts](#srcroutesauthroutests)
    - [src/routes/user.routes.ts](#srcroutesuserroutests)
    - [src/routes/post.routes.ts](#srcroutespostroutests)
    - [src/routes/index.ts](#srcroutesindexts)
14. [Step 11: App Factory & Server Bootstrap](#step-11-app-factory--server-bootstrap)
    - [src/app.ts](#srcappts)
    - [src/server.ts](#srcserverts)
15. [Step 12: Automated Testing Suite](#step-12-automated-testing-suite)
    - [tests/health.test.ts](#testshealthtestts)
    - [tests/validators.test.ts](#testsvalidatorstestts)
    - [tests/services.test.ts](#testsservicestestts)
    - [tests/auth.test.ts](#testsauthtestts)
16. [Step 13: Migrations, Running & Testing](#step-13-migrations-running--testing)
17. [Step 14: API Reference & Testing with curl](#step-14-api-reference--testing-with-curl)

---

## 1. Architecture Overview

The application follows a clean layered architecture with unidirectional flow:

```text
HTTP Request
     │
     ▼
[ Middlewares ] ──────── (CORS, Logger, Secure Headers, JWT Authentication)
     │
     ▼
[ Routes / Controllers ] ─ (Hono route definitions, Zod validation with @hono/zod-validator)
     │
     ▼
[ Services ] ─────────── (Business logic, password hashing via Bun.password, authorization)
     │
     ▼
[ Repositories ] ─────── (Drizzle ORM query layer, data access abstraction)
     │
     ▼
[ PostgreSQL Database ] ── (postgres.js connection pool)
```

---

## 2. Naming Conventions Rule

Throughout this codebase:

- **Database name, table names & column names**: `snake_case` (e.g. database: `test_honojs_db`, tables: `users`, `posts`, columns: `id`, `name`, `email`, `password_hash`, `author_id`, `created_at`, `updated_at`, etc.)
- **Custom variables & functions**: `snake_case` (e.g. `create_app`, `handle_shutdown`, `format_zod_error`, `auth_middleware`, `find_by_id`, `get_user_by_id`, `register_schema`, etc.)
- **Custom types**: `TPascalCase` prefixed with `T` (e.g. `TUserRole`, `THonoEnv`, `TEnv`, `TUser`, `TNewUser`, `TPost`, `TNewPost`, `TRegisterInput`, `TDatabase`, etc.)
- **Custom interfaces**: `IPascalCase` prefixed with `I` (e.g. `IAuthUser`, `IJWTPayload`, `IApiResponse`, `IPostFindOptions`, `IPostWithAuthor`, `IValidationIssue`, `IValidationErrorLike`)
- **Custom enums**: `EPascalCase` prefixed with `E`
- **External libraries / imported symbols**: Default naming case from third-party libraries (e.g. `Hono`, `drizzle`, `pgTable`, `zValidator`, `logger`, `Bun.password.hash`, etc.)

---

## 3. Prerequisites

Ensure you have installed:

- **Bun**: v1.0+ (`curl -fsSL https://bun.sh/install | bash`)
- **PostgreSQL**: v14+ running locally on port 5432
- **Docker**: (Optional) for containerized deployment

---

## Step 1: Project Initialization & Directory Setup

Open your terminal and create a new project directory:

```bash
mkdir test-honojs-app
cd test-honojs-app
```

Initialize a Bun project and install the dependencies:

```bash
# Production dependencies
bun add hono drizzle-orm postgres zod @hono/zod-validator

# Development dependencies
bun add -d drizzle-kit @types/bun
```

Create the directory structure:

```bash
mkdir -p src/config src/db/schema src/repositories src/services src/routes src/middlewares src/validators src/types tests drizzle
```

---

## Step 2: Configuration Files

### `package.json`

Create or replace `package.json`:

```json
{
  "name": "test-honojs-app",
  "module": "src/server.ts",
  "type": "module",
  "scripts": {
    "dev": "bun run --hot src/server.ts",
    "start": "bun run src/server.ts",
    "build": "bun build --compile src/server.ts --outfile server",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:push": "drizzle-kit push",
    "db:studio": "drizzle-kit studio",
    "test": "bun test",
    "docker:build": "docker build -t test-honojs-app .",
    "docker:run": "docker run -p 3000:3000 --env-file .env --add-host=host.docker.internal:host-gateway test-honojs-app"
  },
  "devDependencies": {
    "@types/bun": "^1.4.0",
    "drizzle-kit": "^0.31.10"
  },
  "peerDependencies": {
    "typescript": "^7"
  },
  "dependencies": {
    "@hono/zod-validator": "^0.9.0",
    "drizzle-orm": "^0.45.2",
    "hono": "^4.13.3",
    "postgres": "^3.4.9",
    "zod": "^4.4.3"
  }
}
```

### `tsconfig.json`

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "lib": ["ESNext"],
    "target": "ESNext",
    "module": "Preserve",
    "moduleDetection": "force",
    "jsx": "react-jsx",
    "allowJs": true,
    "types": ["bun"],
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax": true,
    "noEmit": true,
    "strict": true,
    "skipLibCheck": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noPropertyAccessFromIndexSignature": false
  }
}
```

### `.env.example` & `.env`

Create `.env.example`:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration (PostgreSQL database: test_honojs_db)
# When running locally with Bun:
DATABASE_URL=postgres://postgres:postgres@localhost:5432/test_honojs_db
# When running in Docker connecting to host machine PostgreSQL:
# DATABASE_URL=postgres://postgres:postgres@host.docker.internal:5432/test_honojs_db

# Authentication
JWT_SECRET=super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d
```

Copy it to `.env`:

```bash
cp .env.example .env
```

### `drizzle.config.ts`

Create `drizzle.config.ts`:

```typescript
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema/index.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5432/test_honojs_db",
  },
  verbose: true,
  strict: true,
});
```

### `.dockerignore` & `Dockerfile`

Create `.dockerignore`:

```dockerignore
node_modules/
.git/
.gitignore
.env
.env.*
!.env.example
out/
dist/
coverage/
server
tests/
*.log
logs/
.DS_Store
.idea/
.vscode/
README.md
create.md
```

Create `Dockerfile`:

```dockerfile
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
ENV PORT=3000

COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY src ./src
COPY drizzle ./drizzle
COPY drizzle.config.ts ./
COPY tsconfig.json ./

USER bun
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

CMD ["bun", "run", "src/server.ts"]
```

---

## Step 3: Types Layer

### `src/types/index.ts`

```typescript
export type TUserRole = "user" | "admin";

export interface IAuthUser {
  id: number;
  email: string;
  role: TUserRole;
}

export interface IJWTPayload {
  [key: string]: unknown;
  id: number;
  email: string;
  role: TUserRole;
  exp?: number;
  iat?: number;
}

export interface IApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
  errors?: unknown;
}

export type THonoEnv = {
  Variables: {
    user: IAuthUser;
  };
};
```

---

## Step 4: Environment Config Parser

### `src/config/env.ts`

```typescript
import { z } from "zod";

const env_schema = z.object({
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  DATABASE_URL: z
    .string()
    .default("postgres://postgres:postgres@localhost:5432/test_honojs_db"),
  JWT_SECRET: z.string().min(8).default("default-development-jwt-secret-key-123456789"),
  JWT_EXPIRES_IN: z.string().default("7d"),
});

export type TEnv = z.infer<typeof env_schema>;

const parsed_env = env_schema.safeParse(process.env);

if (!parsed_env.success) {
  console.error("❌ Invalid environment variables:", parsed_env.error.flatten().fieldErrors);
  if (process.env.NODE_ENV === "production") {
    throw new Error("Invalid environment configuration");
  }
}

export const env: TEnv = parsed_env.success
  ? parsed_env.data
  : env_schema.parse({
      PORT: process.env.PORT,
      NODE_ENV: process.env.NODE_ENV,
      DATABASE_URL: process.env.DATABASE_URL,
      JWT_SECRET: process.env.JWT_SECRET,
      JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN,
    });
```

---

## Step 5: Database Connection & Drizzle Schemas

### `src/db/schema/users.ts`

```typescript
import { pgTable, serial, varchar, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { posts } from "./posts";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password_hash: varchar("password_hash", { length: 255 }).notNull(),
  role: varchar("role", { length: 20 }).default("user").notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export const users_relations = relations(users, ({ many }) => ({
  posts: many(posts),
}));

export type TUser = typeof users.$inferSelect;
export type TNewUser = typeof users.$inferInsert;
```

### `src/db/schema/posts.ts`

```typescript
import { pgTable, serial, varchar, text, boolean, integer, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./users";

export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  published: boolean("published").default(false).notNull(),
  author_id: integer("author_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export const posts_relations = relations(posts, ({ one }) => ({
  author: one(users, {
    fields: [posts.author_id],
    references: [users.id],
  }),
}));

export type TPost = typeof posts.$inferSelect;
export type TNewPost = typeof posts.$inferInsert;
```

### `src/db/schema/index.ts`

```typescript
export * from "./users";
export * from "./posts";
```

### `src/db/index.ts`

```typescript
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import { env } from "../config/env";

export const query_client = postgres(env.DATABASE_URL, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
});

export const db = drizzle(query_client, { schema });
export type TDatabase = typeof db;
export { schema };
```

---

## Step 6: Repositories Layer (Data Access)

### `src/repositories/user.repository.ts`

```typescript
import { eq, desc, count } from "drizzle-orm";
import { db, type TDatabase } from "../db";
import { users, type TUser, type TNewUser } from "../db/schema/users";

export class UserRepository {
  constructor(private readonly database: TDatabase = db) {}

  async find_by_id(id: number): Promise<TUser | undefined> {
    const result = await this.database
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    return result[0];
  }

  async find_by_email(email: string): Promise<TUser | undefined> {
    const result = await this.database
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);
    return result[0];
  }

  async find_all(limit: number = 10, offset: number = 0): Promise<TUser[]> {
    return this.database
      .select()
      .from(users)
      .limit(limit)
      .offset(offset)
      .orderBy(desc(users.created_at));
  }

  async count(): Promise<number> {
    const result = await this.database.select({ total: count() }).from(users);
    return Number(result[0]?.total ?? 0);
  }

  async create(user_data: TNewUser): Promise<TUser> {
    const result = await this.database
      .insert(users)
      .values({
        ...user_data,
        email: user_data.email.toLowerCase(),
      })
      .returning();
    const user = result[0];
    if (!user) {
      throw new Error("Failed to create user");
    }
    return user;
  }

  async update(id: number, user_data: Partial<TNewUser>): Promise<TUser | undefined> {
    const values_to_update: Partial<TNewUser> & { updated_at: Date } = {
      ...user_data,
      updated_at: new Date(),
    };
    if (user_data.email) {
      values_to_update.email = user_data.email.toLowerCase();
    }

    const result = await this.database
      .update(users)
      .set(values_to_update)
      .where(eq(users.id, id))
      .returning();
    return result[0];
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.database
      .delete(users)
      .where(eq(users.id, id))
      .returning();
    return result.length > 0;
  }
}

export const user_repository = new UserRepository();
```

### `src/repositories/post.repository.ts`

```typescript
import { eq, and, desc, count } from "drizzle-orm";
import { db, type TDatabase } from "../db";
import { posts, type TPost, type TNewPost } from "../db/schema/posts";
import { users } from "../db/schema/users";

export interface IPostFindOptions {
  published_only?: boolean;
  author_id?: number;
  limit?: number;
  offset?: number;
}

export interface IPostWithAuthor extends TPost {
  author?: {
    id: number;
    name: string;
    email: string;
  };
}

export class PostRepository {
  constructor(private readonly database: TDatabase = db) {}

  async find_by_id(id: number): Promise<IPostWithAuthor | undefined> {
    const result = await this.database
      .select({
        id: posts.id,
        title: posts.title,
        content: posts.content,
        published: posts.published,
        author_id: posts.author_id,
        created_at: posts.created_at,
        updated_at: posts.updated_at,
        author: {
          id: users.id,
          name: users.name,
          email: users.email,
        },
      })
      .from(posts)
      .leftJoin(users, eq(posts.author_id, users.id))
      .where(eq(posts.id, id))
      .limit(1);

    const row = result[0];
    if (!row) return undefined;

    return {
      id: row.id,
      title: row.title,
      content: row.content,
      published: row.published,
      author_id: row.author_id,
      created_at: row.created_at,
      updated_at: row.updated_at,
      author: row.author?.id ? row.author : undefined,
    };
  }

  async find_all(options: IPostFindOptions = {}): Promise<IPostWithAuthor[]> {
    const { published_only = false, author_id, limit = 10, offset = 0 } = options;

    const conditions = [];
    if (published_only) {
      conditions.push(eq(posts.published, true));
    }
    if (author_id !== undefined) {
      conditions.push(eq(posts.author_id, author_id));
    }

    const where_clause = conditions.length > 0 ? and(...conditions) : undefined;

    const query = this.database
      .select({
        id: posts.id,
        title: posts.title,
        content: posts.content,
        published: posts.published,
        author_id: posts.author_id,
        created_at: posts.created_at,
        updated_at: posts.updated_at,
        author: {
          id: users.id,
          name: users.name,
          email: users.email,
        },
      })
      .from(posts)
      .leftJoin(users, eq(posts.author_id, users.id))
      .where(where_clause)
      .limit(limit)
      .offset(offset)
      .orderBy(desc(posts.created_at));

    const rows = await query;
    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      content: row.content,
      published: row.published,
      author_id: row.author_id,
      created_at: row.created_at,
      updated_at: row.updated_at,
      author: row.author?.id ? row.author : undefined,
    }));
  }

  async count(options: Omit<IPostFindOptions, "limit" | "offset"> = {}): Promise<number> {
    const { published_only = false, author_id } = options;

    const conditions = [];
    if (published_only) {
      conditions.push(eq(posts.published, true));
    }
    if (author_id !== undefined) {
      conditions.push(eq(posts.author_id, author_id));
    }

    const where_clause = conditions.length > 0 ? and(...conditions) : undefined;

    const result = await this.database
      .select({ total: count() })
      .from(posts)
      .where(where_clause);

    return Number(result[0]?.total ?? 0);
  }

  async create(post_data: TNewPost): Promise<TPost> {
    const result = await this.database.insert(posts).values(post_data).returning();
    const post = result[0];
    if (!post) {
      throw new Error("Failed to create post");
    }
    return post;
  }

  async update(id: number, post_data: Partial<TNewPost>): Promise<TPost | undefined> {
    const result = await this.database
      .update(posts)
      .set({
        ...post_data,
        updated_at: new Date(),
      })
      .where(eq(posts.id, id))
      .returning();
    return result[0];
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.database
      .delete(posts)
      .where(eq(posts.id, id))
      .returning();
    return result.length > 0;
  }
}

export const post_repository = new PostRepository();
```

---

## Step 7: Validation Layer (Zod)

### `src/validators/auth.validator.ts`

```typescript
import { z } from "zod";

export const register_schema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().trim().toLowerCase().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters").max(100),
  role: z.enum(["user", "admin"]).default("user").optional(),
});

export const login_schema = z.object({
  email: z.string().trim().toLowerCase().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export type TRegisterInput = z.infer<typeof register_schema>;
export type TLoginInput = z.infer<typeof login_schema>;
```

### `src/validators/user.validator.ts`

```typescript
import { z } from "zod";

export const user_param_schema = z.object({
  id: z.coerce.number().int().positive("User ID must be a positive integer"),
});

export const update_user_schema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  email: z.string().trim().toLowerCase().email().optional(),
  password: z.string().min(6).max(100).optional(),
  role: z.enum(["user", "admin"]).optional(),
});

export const user_query_schema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
});

export type TUpdateUserInput = z.infer<typeof update_user_schema>;
export type TUserParamInput = z.infer<typeof user_param_schema>;
export type TUserQueryInput = z.infer<typeof user_query_schema>;
```

### `src/validators/post.validator.ts`

```typescript
import { z } from "zod";

export const post_param_schema = z.object({
  id: z.coerce.number().int().positive("Post ID must be a positive integer"),
});

export const create_post_schema = z.object({
  title: z.string().trim().min(1, "Title is required").max(255),
  content: z.string().trim().min(1, "Content is required"),
  published: z.boolean().default(false).optional(),
});

export const update_post_schema = z.object({
  title: z.string().trim().min(1).max(255).optional(),
  content: z.string().trim().min(1).optional(),
  published: z.boolean().optional(),
});

export const post_query_schema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  published: z
    .enum(["true", "false"])
    .transform((val) => val === "true")
    .optional(),
  author_id: z.coerce.number().int().positive().optional(),
});

export type TCreatePostInput = z.infer<typeof create_post_schema>;
export type TUpdatePostInput = z.infer<typeof update_post_schema>;
export type TPostParamInput = z.infer<typeof post_param_schema>;
export type TPostQueryInput = z.infer<typeof post_query_schema>;
```

### `src/validators/index.ts`

```typescript
export * from "./auth.validator";
export * from "./user.validator";
export * from "./post.validator";

export interface IValidationIssue {
  path?: (string | number)[];
  message?: string;
}

export interface IValidationErrorLike {
  issues?: IValidationIssue[];
  message?: string;
}

export function format_zod_error(error: unknown): Record<string, string[]> | string {
  if (!error || typeof error !== "object") {
    return "Invalid input";
  }

  const err = error as IValidationErrorLike;
  if (Array.isArray(err.issues) && err.issues.length > 0) {
    const formatted: Record<string, string[]> = {};
    for (const issue of err.issues) {
      const key = issue.path?.join(".") || "root";
      if (!formatted[key]) {
        formatted[key] = [];
      }
      if (issue.message) {
        formatted[key].push(issue.message);
      }
    }
    return formatted;
  }

  return err.message || "Validation failed";
}
```

---

## Step 8: Middlewares & Error Handling

### `src/middlewares/error.middleware.ts`

```typescript
import type { Context, ErrorHandler, NotFoundHandler } from "hono";
import { HTTPException } from "hono/http-exception";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import { format_zod_error } from "../validators";

export class AppError extends Error {
  public readonly statusCode: ContentfulStatusCode;
  public readonly errors?: unknown;

  constructor(message: string, statusCode: ContentfulStatusCode = 400, errors?: unknown) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.errors = errors;
  }
}

export const error_handler: ErrorHandler = (err: Error, c: Context) => {
  console.error(`[Error] ${err.name}: ${err.message}`, err.stack);

  if (err instanceof AppError) {
    return c.json(
      {
        success: false,
        message: err.message,
        ...(err.errors ? { errors: err.errors } : {}),
      },
      err.statusCode
    );
  }

  if (err instanceof HTTPException) {
    return c.json(
      {
        success: false,
        message: err.message || "HTTP Error",
      },
      err.status as ContentfulStatusCode
    );
  }

  // Check if error is a Zod validation error
  if (typeof err === "object" && err !== null && "issues" in err) {
    return c.json(
      {
        success: false,
        message: "Validation Error",
        errors: format_zod_error(err),
      },
      400
    );
  }

  // Handle postgres database unique constraint error code
  if (typeof err === "object" && err !== null && "code" in err) {
    const pg_error = err as { code: string; detail?: string };
    if (pg_error.code === "23505") {
      return c.json(
        {
          success: false,
          message: "A resource with this identifier or unique field already exists",
          detail: pg_error.detail,
        },
        409
      );
    }
  }

  return c.json(
    {
      success: false,
      message: process.env.NODE_ENV === "production" ? "Internal server error" : err.message,
    },
    500
  );
};

export const not_found_handler: NotFoundHandler = (c: Context) => {
  return c.json(
    {
      success: false,
      message: `Cannot ${c.req.method} ${c.req.path}`,
    },
    404
  );
};
```

### `src/middlewares/auth.middleware.ts`

```typescript
import type { MiddlewareHandler } from "hono";
import { auth_service } from "../services/auth.service";
import { AppError } from "./error.middleware";
import type { THonoEnv, TUserRole } from "../types";

export const auth_middleware: MiddlewareHandler<THonoEnv> = async (c, next) => {
  const auth_header = c.req.header("Authorization");

  if (!auth_header || !auth_header.startsWith("Bearer ")) {
    throw new AppError("Authorization header missing or invalid format (Bearer required)", 401);
  }

  const token = auth_header.substring(7).trim();
  if (!token) {
    throw new AppError("Authentication token is required", 401);
  }

  const payload = await auth_service.verify_token(token);
  c.set("user", {
    id: payload.id,
    email: payload.email,
    role: payload.role,
  });

  await next();
};

export const require_role = (...roles: TUserRole[]): MiddlewareHandler<THonoEnv> => {
  return async (c, next) => {
    const user = c.get("user");
    if (!user) {
      throw new AppError("Authentication required", 401);
    }

    if (!roles.includes(user.role)) {
      throw new AppError("Forbidden: Insufficient permissions for this resource", 403);
    }

    await next();
  };
};
```

---

## Step 9: Services Layer (Business Logic)

### `src/services/auth.service.ts`

```typescript
import { sign, verify } from "hono/jwt";
import { user_repository, UserRepository } from "../repositories/user.repository";
import { AppError } from "../middlewares/error.middleware";
import { env } from "../config/env";
import type { TRegisterInput, TLoginInput } from "../validators/auth.validator";
import type { IAuthUser, IJWTPayload } from "../types";
import type { TUser } from "../db/schema/users";

export class AuthService {
  constructor(private readonly user_repo: UserRepository = user_repository) {}

  async register(input: TRegisterInput): Promise<{ user: Omit<TUser, "password_hash">; token: string }> {
    const existing_user = await this.user_repo.find_by_email(input.email);
    if (existing_user) {
      throw new AppError("A user with this email already exists", 409);
    }

    // Native Bun password hashing (Bcrypt)
    const password_hash = await Bun.password.hash(input.password, {
      algorithm: "bcrypt",
      cost: 10,
    });

    const user = await this.user_repo.create({
      name: input.name,
      email: input.email,
      password_hash: password_hash,
      role: input.role || "user",
    });

    const auth_user: IAuthUser = {
      id: user.id,
      email: user.email,
      role: user.role as IAuthUser["role"],
    };

    const token = await this.generate_token(auth_user);

    const { password_hash: _, ...sanitized_user } = user;
    return {
      user: sanitized_user,
      token,
    };
  }

  async login(input: TLoginInput): Promise<{ user: Omit<TUser, "password_hash">; token: string }> {
    const user = await this.user_repo.find_by_email(input.email);
    if (!user) {
      throw new AppError("Invalid email or password", 401);
    }

    const is_valid_password = await Bun.password.verify(input.password, user.password_hash);
    if (!is_valid_password) {
      throw new AppError("Invalid email or password", 401);
    }

    const auth_user: IAuthUser = {
      id: user.id,
      email: user.email,
      role: user.role as IAuthUser["role"],
    };

    const token = await this.generate_token(auth_user);

    const { password_hash: _, ...sanitized_user } = user;
    return {
      user: sanitized_user,
      token,
    };
  }

  async generate_token(user: IAuthUser): Promise<string> {
    const payload: IJWTPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7, // 7 days
      iat: Math.floor(Date.now() / 1000),
    };

    return await sign(payload, env.JWT_SECRET, "HS256");
  }

  async verify_token(token: string): Promise<IJWTPayload> {
    try {
      const decoded = await verify(token, env.JWT_SECRET, "HS256");
      return decoded as unknown as IJWTPayload;
    } catch {
      throw new AppError("Invalid or expired authentication token", 401);
    }
  }

  async get_me(user_id: number): Promise<Omit<TUser, "password_hash">> {
    const user = await this.user_repo.find_by_id(user_id);
    if (!user) {
      throw new AppError("User not found", 404);
    }
    const { password_hash: _, ...sanitized_user } = user;
    return sanitized_user;
  }
}

export const auth_service = new AuthService();
```

### `src/services/user.service.ts`

```typescript
import { user_repository, UserRepository } from "../repositories/user.repository";
import { AppError } from "../middlewares/error.middleware";
import type { TUpdateUserInput } from "../validators/user.validator";
import type { IAuthUser } from "../types";
import type { TUser, TNewUser } from "../db/schema/users";

export class UserService {
  constructor(private readonly user_repo: UserRepository = user_repository) {}

  private sanitize_user(user: TUser): Omit<TUser, "password_hash"> {
    const { password_hash: _, ...sanitized } = user;
    return sanitized;
  }

  async get_user_by_id(id: number): Promise<Omit<TUser, "password_hash">> {
    const user = await this.user_repo.find_by_id(id);
    if (!user) {
      throw new AppError("User not found", 404);
    }
    return this.sanitize_user(user);
  }

  async get_all_users(page: number = 1, limit: number = 10): Promise<{
    users: Omit<TUser, "password_hash">[];
    meta: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const offset = (page - 1) * limit;
    const [user_list, total] = await Promise.all([
      this.user_repo.find_all(limit, offset),
      this.user_repo.count(),
    ]);

    return {
      users: user_list.map((u) => this.sanitize_user(u)),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async update_user(
    id: number,
    input: TUpdateUserInput,
    requesting_user: IAuthUser
  ): Promise<Omit<TUser, "password_hash">> {
    // Only allow updating own profile unless admin
    if (requesting_user.id !== id && requesting_user.role !== "admin") {
      throw new AppError("You do not have permission to update this user", 403);
    }

    const existing_user = await this.user_repo.find_by_id(id);
    if (!existing_user) {
      throw new AppError("User not found", 404);
    }

    if (input.email && input.email !== existing_user.email) {
      const email_in_use = await this.user_repo.find_by_email(input.email);
      if (email_in_use) {
        throw new AppError("Email is already taken", 409);
      }
    }

    const update_data: Partial<TNewUser> = {};
    if (input.name) update_data.name = input.name;
    if (input.email) update_data.email = input.email;
    if (input.role && requesting_user.role === "admin") update_data.role = input.role;

    if (input.password) {
      update_data.password_hash = await Bun.password.hash(input.password, {
        algorithm: "bcrypt",
        cost: 10,
      });
    }

    const updated = await this.user_repo.update(id, update_data);
    if (!updated) {
      throw new AppError("Failed to update user", 500);
    }

    return this.sanitize_user(updated);
  }

  async delete_user(id: number, requesting_user: IAuthUser): Promise<void> {
    // Only allow self deletion or admin deletion
    if (requesting_user.id !== id && requesting_user.role !== "admin") {
      throw new AppError("You do not have permission to delete this user", 403);
    }

    const existing_user = await this.user_repo.find_by_id(id);
    if (!existing_user) {
      throw new AppError("User not found", 404);
    }

    const deleted = await this.user_repo.delete(id);
    if (!deleted) {
      throw new AppError("Failed to delete user", 500);
    }
  }
}

export const user_service = new UserService();
```

### `src/services/post.service.ts`

```typescript
import { post_repository, PostRepository, type IPostWithAuthor } from "../repositories/post.repository";
import { AppError } from "../middlewares/error.middleware";
import type { TCreatePostInput, TUpdatePostInput, TPostQueryInput } from "../validators/post.validator";
import type { IAuthUser } from "../types";
import type { TPost } from "../db/schema/posts";

export class PostService {
  constructor(private readonly post_repo: PostRepository = post_repository) {}

  async get_post_by_id(id: number): Promise<IPostWithAuthor> {
    const post = await this.post_repo.find_by_id(id);
    if (!post) {
      throw new AppError("Post not found", 404);
    }
    return post;
  }

  async get_all_posts(query: TPostQueryInput): Promise<{
    posts: IPostWithAuthor[];
    meta: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const { page = 1, limit = 10, published, author_id } = query;
    const offset = (page - 1) * limit;

    const [post_list, total] = await Promise.all([
      this.post_repo.find_all({
        published_only: published,
        author_id: author_id,
        limit,
        offset,
      }),
      this.post_repo.count({
        published_only: published,
        author_id: author_id,
      }),
    ]);

    return {
      posts: post_list,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async create_post(author_id: number, input: TCreatePostInput): Promise<TPost> {
    return await this.post_repo.create({
      title: input.title,
      content: input.content,
      published: input.published ?? false,
      author_id: author_id,
    });
  }

  async update_post(
    id: number,
    requesting_user: IAuthUser,
    input: TUpdatePostInput
  ): Promise<TPost> {
    const existing = await this.post_repo.find_by_id(id);
    if (!existing) {
      throw new AppError("Post not found", 404);
    }

    // Only the author or an admin can update the post
    if (existing.author_id !== requesting_user.id && requesting_user.role !== "admin") {
      throw new AppError("You do not have permission to modify this post", 403);
    }

    const updated = await this.post_repo.update(id, input);
    if (!updated) {
      throw new AppError("Failed to update post", 500);
    }

    return updated;
  }

  async delete_post(id: number, requesting_user: IAuthUser): Promise<void> {
    const existing = await this.post_repo.find_by_id(id);
    if (!existing) {
      throw new AppError("Post not found", 404);
    }

    // Only the author or an admin can delete the post
    if (existing.author_id !== requesting_user.id && requesting_user.role !== "admin") {
      throw new AppError("You do not have permission to delete this post", 403);
    }

    const deleted = await this.post_repo.delete(id);
    if (!deleted) {
      throw new AppError("Failed to delete post", 500);
    }
  }
}

export const post_service = new PostService();
```

---

## Step 10: Routes Layer (Controllers / HTTP)

### `src/routes/health.routes.ts`

```typescript
import { Hono } from "hono";

export const health_routes = new Hono();

const start_time = Date.now();

health_routes.get("/", (c) => {
  return c.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: `${Math.floor((Date.now() - start_time) / 1000)}s`,
    runtime: {
      name: "Bun",
      version: Bun.version,
    },
    environment: process.env.NODE_ENV || "development",
  });
});
```

### `src/routes/auth.routes.ts`

```typescript
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { register_schema, login_schema, format_zod_error } from "../validators";
import { auth_service } from "../services/auth.service";
import { auth_middleware } from "../middlewares/auth.middleware";
import type { THonoEnv } from "../types";

export const auth_routes = new Hono<THonoEnv>();

auth_routes.post(
  "/register",
  zValidator("json", register_schema, (result, c) => {
    if (!result.success) {
      return c.json(
        {
          success: false,
          message: "Validation failed",
          errors: format_zod_error(result.error),
        },
        400
      );
    }
  }),
  async (c) => {
    const body = c.req.valid("json");
    const result = await auth_service.register(body);

    return c.json(
      {
        success: true,
        message: "User registered successfully",
        data: result,
      },
      201
    );
  }
);

auth_routes.post(
  "/login",
  zValidator("json", login_schema, (result, c) => {
    if (!result.success) {
      return c.json(
        {
          success: false,
          message: "Validation failed",
          errors: format_zod_error(result.error),
        },
        400
      );
    }
  }),
  async (c) => {
    const body = c.req.valid("json");
    const result = await auth_service.login(body);

    return c.json({
      success: true,
      message: "Login successful",
      data: result,
    });
  }
);

auth_routes.get("/me", auth_middleware, async (c) => {
  const user = c.get("user");
  const profile = await auth_service.get_me(user.id);

  return c.json({
    success: true,
    data: profile,
  });
});
```

### `src/routes/user.routes.ts`

```typescript
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import {
  user_param_schema,
  update_user_schema,
  user_query_schema,
  format_zod_error,
} from "../validators";
import { user_service } from "../services/user.service";
import { auth_middleware } from "../middlewares/auth.middleware";
import type { THonoEnv } from "../types";

export const user_routes = new Hono<THonoEnv>();

user_routes.get(
  "/",
  zValidator("query", user_query_schema, (result, c) => {
    if (!result.success) {
      return c.json(
        {
          success: false,
          message: "Validation failed",
          errors: format_zod_error(result.error),
        },
        400
      );
    }
  }),
  async (c) => {
    const { page, limit } = c.req.valid("query");
    const result = await user_service.get_all_users(page, limit);

    return c.json({
      success: true,
      data: result.users,
      meta: result.meta,
    });
  }
);

user_routes.get(
  "/:id",
  zValidator("param", user_param_schema, (result, c) => {
    if (!result.success) {
      return c.json(
        {
          success: false,
          message: "Invalid ID parameter",
          errors: format_zod_error(result.error),
        },
        400
      );
    }
  }),
  async (c) => {
    const { id } = c.req.valid("param");
    const user = await user_service.get_user_by_id(id);

    return c.json({
      success: true,
      data: user,
    });
  }
);

user_routes.put(
  "/:id",
  auth_middleware,
  zValidator("param", user_param_schema, (result, c) => {
    if (!result.success) {
      return c.json(
        {
          success: false,
          message: "Invalid ID parameter",
          errors: format_zod_error(result.error),
        },
        400
      );
    }
  }),
  zValidator("json", update_user_schema, (result, c) => {
    if (!result.success) {
      return c.json(
        {
          success: false,
          message: "Validation failed",
          errors: format_zod_error(result.error),
        },
        400
      );
    }
  }),
  async (c) => {
    const { id } = c.req.valid("param");
    const body = c.req.valid("json");
    const requesting_user = c.get("user");

    const updated_user = await user_service.update_user(id, body, requesting_user);

    return c.json({
      success: true,
      message: "User updated successfully",
      data: updated_user,
    });
  }
);

user_routes.delete(
  "/:id",
  auth_middleware,
  zValidator("param", user_param_schema, (result, c) => {
    if (!result.success) {
      return c.json(
        {
          success: false,
          message: "Invalid ID parameter",
          errors: format_zod_error(result.error),
        },
        400
      );
    }
  }),
  async (c) => {
    const { id } = c.req.valid("param");
    const requesting_user = c.get("user");

    await user_service.delete_user(id, requesting_user);

    return c.json({
      success: true,
      message: "User deleted successfully",
    });
  }
);
```

### `src/routes/post.routes.ts`

```typescript
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import {
  post_param_schema,
  create_post_schema,
  update_post_schema,
  post_query_schema,
  format_zod_error,
} from "../validators";
import { post_service } from "../services/post.service";
import { auth_middleware } from "../middlewares/auth.middleware";
import type { THonoEnv } from "../types";

export const post_routes = new Hono<THonoEnv>();

post_routes.get(
  "/",
  zValidator("query", post_query_schema, (result, c) => {
    if (!result.success) {
      return c.json(
        {
          success: false,
          message: "Validation failed",
          errors: format_zod_error(result.error),
        },
        400
      );
    }
  }),
  async (c) => {
    const query = c.req.valid("query");
    const result = await post_service.get_all_posts(query);

    return c.json({
      success: true,
      data: result.posts,
      meta: result.meta,
    });
  }
);

post_routes.get(
  "/:id",
  zValidator("param", post_param_schema, (result, c) => {
    if (!result.success) {
      return c.json(
        {
          success: false,
          message: "Invalid ID parameter",
          errors: format_zod_error(result.error),
        },
        400
      );
    }
  }),
  async (c) => {
    const { id } = c.req.valid("param");
    const post = await post_service.get_post_by_id(id);

    return c.json({
      success: true,
      data: post,
    });
  }
);

post_routes.post(
  "/",
  auth_middleware,
  zValidator("json", create_post_schema, (result, c) => {
    if (!result.success) {
      return c.json(
        {
          success: false,
          message: "Validation failed",
          errors: format_zod_error(result.error),
        },
        400
      );
    }
  }),
  async (c) => {
    const body = c.req.valid("json");
    const user = c.get("user");

    const new_post = await post_service.create_post(user.id, body);

    return c.json(
      {
        success: true,
        message: "Post created successfully",
        data: new_post,
      },
      201
    );
  }
);

post_routes.put(
  "/:id",
  auth_middleware,
  zValidator("param", post_param_schema, (result, c) => {
    if (!result.success) {
      return c.json(
        {
          success: false,
          message: "Invalid ID parameter",
          errors: format_zod_error(result.error),
        },
        400
      );
    }
  }),
  zValidator("json", update_post_schema, (result, c) => {
    if (!result.success) {
      return c.json(
        {
          success: false,
          message: "Validation failed",
          errors: format_zod_error(result.error),
        },
        400
      );
    }
  }),
  async (c) => {
    const { id } = c.req.valid("param");
    const body = c.req.valid("json");
    const user = c.get("user");

    const updated_post = await post_service.update_post(id, user, body);

    return c.json({
      success: true,
      message: "Post updated successfully",
      data: updated_post,
    });
  }
);

post_routes.delete(
  "/:id",
  auth_middleware,
  zValidator("param", post_param_schema, (result, c) => {
    if (!result.success) {
      return c.json(
        {
          success: false,
          message: "Invalid ID parameter",
          errors: format_zod_error(result.error),
        },
        400
      );
    }
  }),
  async (c) => {
    const { id } = c.req.valid("param");
    const user = c.get("user");

    await post_service.delete_post(id, user);

    return c.json({
      success: true,
      message: "Post deleted successfully",
    });
  }
);
```

### `src/routes/index.ts`

```typescript
import { Hono } from "hono";
import { auth_routes } from "./auth.routes";
import { user_routes } from "./user.routes";
import { post_routes } from "./post.routes";
import { health_routes } from "./health.routes";
import type { THonoEnv } from "../types";

export const routes = new Hono<THonoEnv>();

routes.get("/", (c) => {
  return c.json({
    name: "Bun + Hono + Drizzle API",
    version: "1.0.0",
    runtime: `Bun ${Bun.version}`,
    endpoints: {
      health: "/health",
      auth: {
        register: "POST /api/auth/register",
        login: "POST /api/auth/login",
        me: "GET /api/auth/me",
      },
      users: {
        list: "GET /api/users",
        get: "GET /api/users/:id",
        update: "PUT /api/users/:id",
        delete: "DELETE /api/users/:id",
      },
      posts: {
        list: "GET /api/posts",
        get: "GET /api/posts/:id",
        create: "POST /api/posts",
        update: "PUT /api/posts/:id",
        delete: "DELETE /api/posts/:id",
      },
    },
  });
});

routes.route("/health", health_routes);
routes.route("/api/auth", auth_routes);
routes.route("/api/users", user_routes);
routes.route("/api/posts", post_routes);
```

---

## Step 11: App Factory & Server Bootstrap

### `src/app.ts`

```typescript
import { Hono } from "hono";
import { logger } from "hono/logger";
import { cors } from "hono/cors";
import { secureHeaders } from "hono/secure-headers";
import { trimTrailingSlash } from "hono/trailing-slash";
import { routes } from "./routes";
import { error_handler, not_found_handler } from "./middlewares/error.middleware";
import type { THonoEnv } from "./types";

export function create_app(): Hono<THonoEnv> {
  const app = new Hono<THonoEnv>();

  // Global Middlewares
  app.use("*", logger());
  app.use("*", secureHeaders());
  app.use(
    "*",
    cors({
      origin: "*",
      allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
      allowHeaders: ["Content-Type", "Authorization"],
      exposeHeaders: ["Content-Length"],
      maxAge: 600,
    })
  );
  app.use("*", trimTrailingSlash());

  // Mount API routes
  app.route("/", routes);

  // 404 Not Found Handler
  app.notFound(not_found_handler);

  // Global Error Handler
  app.onError(error_handler);

  return app;
}

export const app = create_app();
```

### `src/server.ts`

```typescript
import { app } from "./app";
import { env } from "./config/env";

const server = Bun.serve({
  port: env.PORT,
  fetch: app.fetch,
});

console.log(`
🚀 Server is running!
---------------------------------------------
📡 Listening on:      http://localhost:${server.port}
🩺 Health Check:      http://localhost:${server.port}/health
✨ Runtime:           Bun ${Bun.version}
🌍 Environment:       ${env.NODE_ENV}
---------------------------------------------
`);

const handle_shutdown = () => {
  console.log("\nGracefully shutting down server...");
  server.stop();
  process.exit(0);
};

process.on("SIGINT", handle_shutdown);
process.on("SIGTERM", handle_shutdown);

export default server;
```

---

## Step 12: Automated Testing Suite

### `tests/health.test.ts`

```typescript
import { describe, expect, it } from "bun:test";
import { app } from "../src/app";

describe("Health Check API", () => {
  it("GET /health should return 200 with runtime info", async () => {
    const res = await app.request("/health");
    expect(res.status).toBe(200);

    const json = (await res.json()) as {
      status: string;
      runtime: { name: string; version: string };
      timestamp: string;
    };
    expect(json.status).toBe("ok");
    expect(json.runtime.name).toBe("Bun");
    expect(json.runtime.version).toBeDefined();
    expect(json.timestamp).toBeDefined();
  });

  it("GET / should return root API metadata and endpoint map", async () => {
    const res = await app.request("/");
    expect(res.status).toBe(200);

    const json = (await res.json()) as {
      name: string;
      endpoints: { health: string; [key: string]: unknown };
    };
    expect(json.name).toBe("Bun + Hono + Drizzle API");
    expect(json.endpoints).toBeDefined();
    expect(json.endpoints.health).toBe("/health");
  });

  it("GET /non-existent-route should return 404 not found format", async () => {
    const res = await app.request("/non-existent-route");
    expect(res.status).toBe(404);

    const json = (await res.json()) as {
      success: boolean;
      message: string;
    };
    expect(json.success).toBe(false);
    expect(json.message).toContain("Cannot GET /non-existent-route");
  });
});
```

### `tests/validators.test.ts`

```typescript
import { describe, expect, it } from "bun:test";
import {
  register_schema,
  login_schema,
  create_post_schema,
  update_post_schema,
  update_user_schema,
  user_param_schema,
  post_query_schema,
  format_zod_error,
} from "../src/validators";

describe("Zod Validators", () => {
  describe("register_schema", () => {
    it("should accept valid register input", () => {
      const valid = {
        name: "Alice Johnson",
        email: "alice@example.com",
        password: "securepassword123",
      };
      const result = register_schema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("should reject invalid email and short password", () => {
      const invalid = {
        name: "A",
        email: "not-an-email",
        password: "123",
      };
      const result = register_schema.safeParse(invalid);
      expect(result.success).toBe(false);
      if (!result.success) {
        const formatted = format_zod_error(result.error);
        expect(typeof formatted).toBe("object");
      }
    });
  });

  describe("login_schema", () => {
    it("should accept valid login input", () => {
      const valid = {
        email: "alice@example.com",
        password: "securepassword123",
      };
      const result = login_schema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("should reject empty password", () => {
      const invalid = {
        email: "alice@example.com",
        password: "",
      };
      const result = login_schema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe("create_post_schema", () => {
    it("should validate valid post creation payload", () => {
      const valid = {
        title: "Getting Started with Bun and Hono",
        content: "Hono is extremely fast and modular.",
        published: true,
      };
      const result = create_post_schema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("should reject empty title", () => {
      const invalid = {
        title: "   ",
        content: "Some content",
      };
      const result = create_post_schema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe("post_query_schema", () => {
    it("should parse boolean string for published query param", () => {
      const parsed = post_query_schema.parse({ published: "true", page: "2", limit: "20" });
      expect(parsed.published).toBe(true);
      expect(parsed.page).toBe(2);
      expect(parsed.limit).toBe(20);
    });
  });

  describe("user_param_schema", () => {
    it("should coerce string numbers into integer IDs", () => {
      const parsed = user_param_schema.parse({ id: "42" });
      expect(parsed.id).toBe(42);
    });

    it("should reject non-numeric IDs", () => {
      const result = user_param_schema.safeParse({ id: "abc" });
      expect(result.success).toBe(false);
    });
  });
});
```

### `tests/services.test.ts`

```typescript
import { describe, expect, it } from "bun:test";
import { AuthService } from "../src/services/auth.service";
import { UserService } from "../src/services/user.service";
import { PostService } from "../src/services/post.service";
import { UserRepository } from "../src/repositories/user.repository";
import { PostRepository } from "../src/repositories/post.repository";
import type { TUser } from "../src/db/schema/users";
import type { TPost } from "../src/db/schema/posts";

describe("Service Layer Unit Tests", () => {
  describe("AuthService", () => {
    it("should hash passwords and generate JWT tokens on register", async () => {
      const mock_users: TUser[] = [];
      const mock_user_repo = {
        find_by_email: async (email: string) => mock_users.find((u) => u.email === email),
        find_by_id: async (id: number) => mock_users.find((u) => u.id === id),
        create: async (data: any) => {
          const user: TUser = {
            id: mock_users.length + 1,
            name: data.name,
            email: data.email,
            password_hash: data.password_hash,
            role: data.role || "user",
            created_at: new Date(),
            updated_at: new Date(),
          };
          mock_users.push(user);
          return user;
        },
      } as unknown as UserRepository;

      const auth_service_instance = new AuthService(mock_user_repo);

      const result = await auth_service_instance.register({
        name: "Test User",
        email: "test@example.com",
        password: "secretpassword",
      });

      expect(result.user.id).toBe(1);
      expect(result.user.email).toBe("test@example.com");
      expect((result.user as any).password_hash).toBeUndefined();
      expect(typeof result.token).toBe("string");

      const payload = await auth_service_instance.verify_token(result.token);
      expect(payload.id).toBe(1);
      expect(payload.email).toBe("test@example.com");
      expect(payload.role).toBe("user");
    });

    it("should authenticate valid credentials on login", async () => {
      const password_hash = await Bun.password.hash("correct-password", {
        algorithm: "bcrypt",
      });

      const mock_users: TUser[] = [
        {
          id: 10,
          name: "Existing User",
          email: "existing@example.com",
          password_hash: password_hash,
          role: "user",
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      const mock_user_repo = {
        find_by_email: async (email: string) => mock_users.find((u) => u.email === email),
        find_by_id: async (id: number) => mock_users.find((u) => u.id === id),
      } as unknown as UserRepository;

      const auth_service_instance = new AuthService(mock_user_repo);

      const login_result = await auth_service_instance.login({
        email: "existing@example.com",
        password: "correct-password",
      });

      expect(login_result.user.id).toBe(10);
      expect(login_result.token).toBeDefined();

      expect(
        auth_service_instance.login({
          email: "existing@example.com",
          password: "wrong-password",
        })
      ).rejects.toThrow("Invalid email or password");
    });
  });

  describe("UserService", () => {
    it("should prevent non-admin users from modifying other user accounts", async () => {
      const mock_user_repo = {
        find_by_id: async (id: number) => ({
          id,
          name: "Other User",
          email: "other@example.com",
          password_hash: "hash",
          role: "user",
          created_at: new Date(),
          updated_at: new Date(),
        }),
      } as unknown as UserRepository;

      const user_service_instance = new UserService(mock_user_repo);

      expect(
        user_service_instance.update_user(
          2,
          { name: "Hacked" },
          { id: 1, email: "me@example.com", role: "user" }
        )
      ).rejects.toThrow("You do not have permission to update this user");
    });
  });

  describe("PostService", () => {
    it("should allow author or admin to update their post and block unauthorized users", async () => {
      const mock_post: TPost = {
        id: 100,
        title: "Original Title",
        content: "Original Content",
        published: false,
        author_id: 5,
        created_at: new Date(),
        updated_at: new Date(),
      };

      const mock_post_repo = {
        find_by_id: async (id: number) => (id === 100 ? mock_post : undefined),
        update: async (id: number, data: any) => ({ ...mock_post, ...data }),
      } as unknown as PostRepository;

      const post_service_instance = new PostService(mock_post_repo);

      expect(
        post_service_instance.update_post(
          100,
          { id: 6, email: "other@example.com", role: "user" },
          { title: "Unauthorized Edit" }
        )
      ).rejects.toThrow("You do not have permission to modify this post");

      const updated = await post_service_instance.update_post(
        100,
        { id: 5, email: "author@example.com", role: "user" },
        { title: "Author Edit" }
      );
      expect(updated.title).toBe("Author Edit");

      const admin_updated = await post_service_instance.update_post(
        100,
        { id: 999, email: "admin@example.com", role: "admin" },
        { title: "Admin Edit" }
      );
      expect(admin_updated.title).toBe("Admin Edit");
    });
  });
});
```

### `tests/auth.test.ts`

```typescript
import { describe, expect, it } from "bun:test";
import { app } from "../src/app";

describe("Auth Routes HTTP Validation", () => {
  it("POST /api/auth/register should fail with 400 when missing fields", async () => {
    const res = await app.request("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "A" }),
    });

    expect(res.status).toBe(400);
    const json = (await res.json()) as {
      success: boolean;
      message: string;
      errors: Record<string, unknown>;
    };
    expect(json.success).toBe(false);
    expect(json.message).toBe("Validation failed");
    expect(json.errors).toBeDefined();
  });

  it("POST /api/auth/login should fail with 400 on invalid email", async () => {
    const res = await app.request("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "invalid-email", password: "" }),
    });

    expect(res.status).toBe(400);
    const json = (await res.json()) as {
      success: boolean;
      errors: { email?: unknown };
    };
    expect(json.success).toBe(false);
    expect(json.errors.email).toBeDefined();
  });

  it("GET /api/auth/me should return 401 when unauthenticated", async () => {
    const res = await app.request("/api/auth/me");
    expect(res.status).toBe(401);
    const json = (await res.json()) as {
      success: boolean;
    };
    expect(json.success).toBe(false);
  });
});
```

---

## Step 13: Migrations, Running & Testing

### 1. Generate & Apply Migrations

```bash
# Generate SQL migration file into ./drizzle
bun run db:generate

# Push schema directly to database (useful for rapid local dev)
bun run db:push

# Or apply migrations
bun run db:migrate
```

### 2. Run Tests

```bash
bun test
```

### 3. Run Typecheck

```bash
bun x tsc --noEmit
```

### 4. Start Development Server

```bash
bun run dev
```

### 5. Build & Run with Docker

```bash
# Build Docker image
bun run docker:build

# Run container (connecting to PostgreSQL on your host machine)
bun run docker:run
```

---

## Step 14: API Reference & Testing with curl

### 1. Health Check

```bash
curl http://localhost:3000/health
```

### 2. Register a New User

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Doe",
    "email": "jane@example.com",
    "password": "password123"
  }'
```

### 3. Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "jane@example.com",
    "password": "password123"
  }'
```

*Save the returned `token` string.*

### 4. Get Current Profile

```bash
curl http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer <YOUR_TOKEN>"
```

### 5. Create a Post

```bash
curl -X POST http://localhost:3000/api/posts \
  -H "Authorization: Bearer <YOUR_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "My First Post with Hono & Drizzle",
    "content": "Building blazing fast APIs with Bun is awesome!",
    "published": true
  }'
```

### 6. List Posts

```bash
curl "http://localhost:3000/api/posts?page=1&limit=10&published=true"
```
