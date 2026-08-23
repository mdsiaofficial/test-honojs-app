# Complete Step-by-Step Guide: Building a Modern Bun + Hono + Drizzle ORM + PostgreSQL Backend

This guide contains everything you need to build this entire production-ready TypeScript backend from scratch on your own.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Prerequisites](#2-prerequisites)
3. [Step 1: Project Initialization & Directory Setup](#step-1-project-initialization--directory-setup)
4. [Step 2: Configuration Files](#step-2-configuration-files)
   - [package.json](#packagejson)
   - [tsconfig.json](#tsconfigjson)
   - [.env.example & .env](#envexample--env)
   - [drizzle.config.ts](#drizzleconfigts)
   - [.dockerignore & Dockerfile](#dockerignore--dockerfile)
5. [Step 3: Types Layer](#step-3-types-layer)
   - [src/types/index.ts](#srctypesindexts)
6. [Step 4: Environment Config Parser](#step-4-environment-config-parser)
   - [src/config/env.ts](#srcconfigenvts)
7. [Step 5: Database Connection & Drizzle Schemas](#step-5-database-connection--drizzle-schemas)
   - [src/db/schema/users.ts](#srcdbschemausersts)
   - [src/db/schema/posts.ts](#srcdbschemapoststs)
   - [src/db/schema/index.ts](#srcdbschemaindexts)
   - [src/db/index.ts](#srcdbindexts)
8. [Step 6: Repositories Layer (Data Access)](#step-6-repositories-layer-data-access)
   - [src/repositories/user.repository.ts](#srcrepositoriesuserrepositoryts)
   - [src/repositories/post.repository.ts](#srcrepositoriespostrepositoryts)
9. [Step 7: Validation Layer (Zod)](#step-7-validation-layer-zod)
   - [src/validators/auth.validator.ts](#srcvalidatorsauthvalidatorts)
   - [src/validators/user.validator.ts](#srcvalidatorsuservalidatorts)
   - [src/validators/post.validator.ts](#srcvalidatorspostvalidatorts)
   - [src/validators/index.ts](#srcvalidatorsindexts)
10. [Step 8: Middlewares & Error Handling](#step-8-middlewares--error-handling)
    - [src/middlewares/error.middleware.ts](#srcmiddlewareserrormiddlewarets)
    - [src/middlewares/auth.middleware.ts](#srcmiddlewaresauthmiddlewarets)
11. [Step 9: Services Layer (Business Logic)](#step-9-services-layer-business-logic)
    - [src/services/auth.service.ts](#srcservicesauthservicets)
    - [src/services/user.service.ts](#srcservicesuserservicets)
    - [src/services/post.service.ts](#srcservicespostservicets)
12. [Step 10: Routes Layer (Controllers / HTTP)](#step-10-routes-layer-controllers--http)
    - [src/routes/health.routes.ts](#srcrouteshealthroutests)
    - [src/routes/auth.routes.ts](#srcroutesauthroutests)
    - [src/routes/user.routes.ts](#srcroutesuserroutests)
    - [src/routes/post.routes.ts](#srcroutespostroutests)
    - [src/routes/index.ts](#srcroutesindexts)
13. [Step 11: App Factory & Server Bootstrap](#step-11-app-factory--server-bootstrap)
    - [src/app.ts](#srcappts)
    - [src/server.ts](#srcserverts)
14. [Step 12: Automated Testing Suite](#step-12-automated-testing-suite)
    - [tests/health.test.ts](#testshealthtestts)
    - [tests/validators.test.ts](#testsvalidatorstestts)
    - [tests/services.test.ts](#testsservicestestts)
    - [tests/auth.test.ts](#testsauthtestts)
15. [Step 13: Migrations, Running & Testing](#step-13-migrations-running--testing)
16. [Step 14: API Reference & Testing with curl](#step-14-api-reference--testing-with-curl)

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

## 2. Prerequisites

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

# Database Configuration (PostgreSQL on local machine)
# When running locally with Bun:
DATABASE_URL=postgres://postgres:postgres@localhost:5432/test_hono_db
# When running in Docker connecting to host machine PostgreSQL:
# DATABASE_URL=postgres://postgres:postgres@host.docker.internal:5432/test_hono_db

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
    url: process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5432/test_hono_db",
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
export type UserRole = "user" | "admin";

export interface AuthUser {
  id: number;
  email: string;
  role: UserRole;
}

export interface JWTPayload {
  [key: string]: unknown;
  id: number;
  email: string;
  role: UserRole;
  exp?: number;
  iat?: number;
}

export interface ApiResponse<T = unknown> {
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

export type HonoEnv = {
  Variables: {
    user: AuthUser;
  };
};
```

---

## Step 4: Environment Config Parser

### `src/config/env.ts`

```typescript
import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  DATABASE_URL: z
    .string()
    .default("postgres://postgres:postgres@localhost:5432/test_hono_db"),
  JWT_SECRET: z.string().min(8).default("default-development-jwt-secret-key-123456789"),
  JWT_EXPIRES_IN: z.string().default("7d"),
});

export type Env = z.infer<typeof envSchema>;

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error("❌ Invalid environment variables:", parsedEnv.error.flatten().fieldErrors);
  if (process.env.NODE_ENV === "production") {
    throw new Error("Invalid environment configuration");
  }
}

export const env: Env = parsedEnv.success
  ? parsedEnv.data
  : envSchema.parse({
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
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  role: varchar("role", { length: 20 }).default("user").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  posts: many(posts),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
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
  authorId: integer("author_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const postsRelations = relations(posts, ({ one }) => ({
  author: one(users, {
    fields: [posts.authorId],
    references: [users.id],
  }),
}));

export type Post = typeof posts.$inferSelect;
export type NewPost = typeof posts.$inferInsert;
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

export const queryClient = postgres(env.DATABASE_URL, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
});

export const db = drizzle(queryClient, { schema });
export type Database = typeof db;
export { schema };
```

---

## Step 6: Repositories Layer (Data Access)

### `src/repositories/user.repository.ts`

```typescript
import { eq, desc, count } from "drizzle-orm";
import { db, type Database } from "../db";
import { users, type User, type NewUser } from "../db/schema/users";

export class UserRepository {
  constructor(private readonly database: Database = db) {}

  async findById(id: number): Promise<User | undefined> {
    const result = await this.database
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    return result[0];
  }

  async findByEmail(email: string): Promise<User | undefined> {
    const result = await this.database
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);
    return result[0];
  }

  async findAll(limit: number = 10, offset: number = 0): Promise<User[]> {
    return this.database
      .select()
      .from(users)
      .limit(limit)
      .offset(offset)
      .orderBy(desc(users.createdAt));
  }

  async count(): Promise<number> {
    const result = await this.database.select({ total: count() }).from(users);
    return Number(result[0]?.total ?? 0);
  }

  async create(userData: NewUser): Promise<User> {
    const result = await this.database
      .insert(users)
      .values({
        ...userData,
        email: userData.email.toLowerCase(),
      })
      .returning();
    const user = result[0];
    if (!user) {
      throw new Error("Failed to create user");
    }
    return user;
  }

  async update(id: number, userData: Partial<NewUser>): Promise<User | undefined> {
    const valuesToUpdate: Partial<NewUser> & { updatedAt: Date } = {
      ...userData,
      updatedAt: new Date(),
    };
    if (userData.email) {
      valuesToUpdate.email = userData.email.toLowerCase();
    }

    const result = await this.database
      .update(users)
      .set(valuesToUpdate)
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

export const userRepository = new UserRepository();
```

### `src/repositories/post.repository.ts`

```typescript
import { eq, and, desc, count } from "drizzle-orm";
import { db, type Database } from "../db";
import { posts, type Post, type NewPost } from "../db/schema/posts";
import { users } from "../db/schema/users";

export interface PostFindOptions {
  publishedOnly?: boolean;
  authorId?: number;
  limit?: number;
  offset?: number;
}

export interface PostWithAuthor extends Post {
  author?: {
    id: number;
    name: string;
    email: string;
  };
}

export class PostRepository {
  constructor(private readonly database: Database = db) {}

  async findById(id: number): Promise<PostWithAuthor | undefined> {
    const result = await this.database
      .select({
        id: posts.id,
        title: posts.title,
        content: posts.content,
        published: posts.published,
        authorId: posts.authorId,
        createdAt: posts.createdAt,
        updatedAt: posts.updatedAt,
        author: {
          id: users.id,
          name: users.name,
          email: users.email,
        },
      })
      .from(posts)
      .leftJoin(users, eq(posts.authorId, users.id))
      .where(eq(posts.id, id))
      .limit(1);

    const row = result[0];
    if (!row) return undefined;

    return {
      id: row.id,
      title: row.title,
      content: row.content,
      published: row.published,
      authorId: row.authorId,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      author: row.author?.id ? row.author : undefined,
    };
  }

  async findAll(options: PostFindOptions = {}): Promise<PostWithAuthor[]> {
    const { publishedOnly = false, authorId, limit = 10, offset = 0 } = options;

    const conditions = [];
    if (publishedOnly) {
      conditions.push(eq(posts.published, true));
    }
    if (authorId !== undefined) {
      conditions.push(eq(posts.authorId, authorId));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const query = this.database
      .select({
        id: posts.id,
        title: posts.title,
        content: posts.content,
        published: posts.published,
        authorId: posts.authorId,
        createdAt: posts.createdAt,
        updatedAt: posts.updatedAt,
        author: {
          id: users.id,
          name: users.name,
          email: users.email,
        },
      })
      .from(posts)
      .leftJoin(users, eq(posts.authorId, users.id))
      .where(whereClause)
      .limit(limit)
      .offset(offset)
      .orderBy(desc(posts.createdAt));

    const rows = await query;
    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      content: row.content,
      published: row.published,
      authorId: row.authorId,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      author: row.author?.id ? row.author : undefined,
    }));
  }

  async count(options: Omit<PostFindOptions, "limit" | "offset"> = {}): Promise<number> {
    const { publishedOnly = false, authorId } = options;

    const conditions = [];
    if (publishedOnly) {
      conditions.push(eq(posts.published, true));
    }
    if (authorId !== undefined) {
      conditions.push(eq(posts.authorId, authorId));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const result = await this.database
      .select({ total: count() })
      .from(posts)
      .where(whereClause);

    return Number(result[0]?.total ?? 0);
  }

  async create(postData: NewPost): Promise<Post> {
    const result = await this.database.insert(posts).values(postData).returning();
    const post = result[0];
    if (!post) {
      throw new Error("Failed to create post");
    }
    return post;
  }

  async update(id: number, postData: Partial<NewPost>): Promise<Post | undefined> {
    const result = await this.database
      .update(posts)
      .set({
        ...postData,
        updatedAt: new Date(),
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

export const postRepository = new PostRepository();
```

---

## Step 7: Validation Layer (Zod)

### `src/validators/auth.validator.ts`

```typescript
import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().trim().toLowerCase().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters").max(100),
  role: z.enum(["user", "admin"]).default("user").optional(),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
```

### `src/validators/user.validator.ts`

```typescript
import { z } from "zod";

export const userParamSchema = z.object({
  id: z.coerce.number().int().positive("User ID must be a positive integer"),
});

export const updateUserSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  email: z.string().trim().toLowerCase().email().optional(),
  password: z.string().min(6).max(100).optional(),
  role: z.enum(["user", "admin"]).optional(),
});

export const userQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type UserParamInput = z.infer<typeof userParamSchema>;
export type UserQueryInput = z.infer<typeof userQuerySchema>;
```

### `src/validators/post.validator.ts`

```typescript
import { z } from "zod";

export const postParamSchema = z.object({
  id: z.coerce.number().int().positive("Post ID must be a positive integer"),
});

export const createPostSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(255),
  content: z.string().trim().min(1, "Content is required"),
  published: z.boolean().default(false).optional(),
});

export const updatePostSchema = z.object({
  title: z.string().trim().min(1).max(255).optional(),
  content: z.string().trim().min(1).optional(),
  published: z.boolean().optional(),
});

export const postQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  published: z
    .enum(["true", "false"])
    .transform((val) => val === "true")
    .optional(),
  authorId: z.coerce.number().int().positive().optional(),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;
export type UpdatePostInput = z.infer<typeof updatePostSchema>;
export type PostParamInput = z.infer<typeof postParamSchema>;
export type PostQueryInput = z.infer<typeof postQuerySchema>;
```

### `src/validators/index.ts`

```typescript
export * from "./auth.validator";
export * from "./user.validator";
export * from "./post.validator";

export interface ValidationIssue {
  path?: (string | number)[];
  message?: string;
}

export interface ValidationErrorLike {
  issues?: ValidationIssue[];
  message?: string;
}

export function formatZodError(error: unknown): Record<string, string[]> | string {
  if (!error || typeof error !== "object") {
    return "Invalid input";
  }

  const err = error as ValidationErrorLike;
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
import { formatZodError } from "../validators";

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

export const errorHandler: ErrorHandler = (err: Error, c: Context) => {
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
        errors: formatZodError(err),
      },
      400
    );
  }

  // Handle postgres database unique constraint error code
  if (typeof err === "object" && err !== null && "code" in err) {
    const pgError = err as { code: string; detail?: string };
    if (pgError.code === "23505") {
      return c.json(
        {
          success: false,
          message: "A resource with this identifier or unique field already exists",
          detail: pgError.detail,
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

export const notFoundHandler: NotFoundHandler = (c: Context) => {
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
import { authService } from "../services/auth.service";
import { AppError } from "./error.middleware";
import type { HonoEnv, UserRole } from "../types";

export const authMiddleware: MiddlewareHandler<HonoEnv> = async (c, next) => {
  const authHeader = c.req.header("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new AppError("Authorization header missing or invalid format (Bearer required)", 401);
  }

  const token = authHeader.substring(7).trim();
  if (!token) {
    throw new AppError("Authentication token is required", 401);
  }

  const payload = await authService.verifyToken(token);
  c.set("user", {
    id: payload.id,
    email: payload.email,
    role: payload.role,
  });

  await next();
};

export const requireRole = (...roles: UserRole[]): MiddlewareHandler<HonoEnv> => {
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
import { userRepository, UserRepository } from "../repositories/user.repository";
import { AppError } from "../middlewares/error.middleware";
import { env } from "../config/env";
import type { RegisterInput, LoginInput } from "../validators/auth.validator";
import type { AuthUser, JWTPayload } from "../types";
import type { User } from "../db/schema/users";

export class AuthService {
  constructor(private readonly userRepo: UserRepository = userRepository) {}

  async register(input: RegisterInput): Promise<{ user: Omit<User, "passwordHash">; token: string }> {
    const existing = await this.userRepo.findByEmail(input.email);
    if (existing) {
      throw new AppError("A user with this email already exists", 409);
    }

    // Native Bun password hashing (Bcrypt)
    const passwordHash = await Bun.password.hash(input.password, {
      algorithm: "bcrypt",
      cost: 10,
    });

    const user = await this.userRepo.create({
      name: input.name,
      email: input.email,
      passwordHash,
      role: input.role || "user",
    });

    const authUser: AuthUser = {
      id: user.id,
      email: user.email,
      role: user.role as AuthUser["role"],
    };

    const token = await this.generateToken(authUser);

    const { passwordHash: _, ...sanitizedUser } = user;
    return {
      user: sanitizedUser,
      token,
    };
  }

  async login(input: LoginInput): Promise<{ user: Omit<User, "passwordHash">; token: string }> {
    const user = await this.userRepo.findByEmail(input.email);
    if (!user) {
      throw new AppError("Invalid email or password", 401);
    }

    const isValidPassword = await Bun.password.verify(input.password, user.passwordHash);
    if (!isValidPassword) {
      throw new AppError("Invalid email or password", 401);
    }

    const authUser: AuthUser = {
      id: user.id,
      email: user.email,
      role: user.role as AuthUser["role"],
    };

    const token = await this.generateToken(authUser);

    const { passwordHash: _, ...sanitizedUser } = user;
    return {
      user: sanitizedUser,
      token,
    };
  }

  async generateToken(user: AuthUser): Promise<string> {
    const payload: JWTPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7, // 7 days
      iat: Math.floor(Date.now() / 1000),
    };

    return await sign(payload, env.JWT_SECRET, "HS256");
  }

  async verifyToken(token: string): Promise<JWTPayload> {
    try {
      const decoded = await verify(token, env.JWT_SECRET, "HS256");
      return decoded as unknown as JWTPayload;
    } catch {
      throw new AppError("Invalid or expired authentication token", 401);
    }
  }

  async getMe(userId: number): Promise<Omit<User, "passwordHash">> {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new AppError("User not found", 404);
    }
    const { passwordHash: _, ...sanitizedUser } = user;
    return sanitizedUser;
  }
}

export const authService = new AuthService();
```

### `src/services/user.service.ts`

```typescript
import { userRepository, UserRepository } from "../repositories/user.repository";
import { AppError } from "../middlewares/error.middleware";
import type { UpdateUserInput } from "../validators/user.validator";
import type { AuthUser } from "../types";
import type { User, NewUser } from "../db/schema/users";

export class UserService {
  constructor(private readonly userRepo: UserRepository = userRepository) {}

  private sanitizeUser(user: User): Omit<User, "passwordHash"> {
    const { passwordHash: _, ...sanitized } = user;
    return sanitized;
  }

  async getUserById(id: number): Promise<Omit<User, "passwordHash">> {
    const user = await this.userRepo.findById(id);
    if (!user) {
      throw new AppError("User not found", 404);
    }
    return this.sanitizeUser(user);
  }

  async getAllUsers(page: number = 1, limit: number = 10): Promise<{
    users: Omit<User, "passwordHash">[];
    meta: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const offset = (page - 1) * limit;
    const [userList, total] = await Promise.all([
      this.userRepo.findAll(limit, offset),
      this.userRepo.count(),
    ]);

    return {
      users: userList.map((u) => this.sanitizeUser(u)),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async updateUser(
    id: number,
    input: UpdateUserInput,
    requestingUser: AuthUser
  ): Promise<Omit<User, "passwordHash">> {
    // Only allow updating own profile unless admin
    if (requestingUser.id !== id && requestingUser.role !== "admin") {
      throw new AppError("You do not have permission to update this user", 403);
    }

    const existing = await this.userRepo.findById(id);
    if (!existing) {
      throw new AppError("User not found", 404);
    }

    if (input.email && input.email !== existing.email) {
      const emailInUse = await this.userRepo.findByEmail(input.email);
      if (emailInUse) {
        throw new AppError("Email is already taken", 409);
      }
    }

    const updateData: Partial<NewUser> = {};
    if (input.name) updateData.name = input.name;
    if (input.email) updateData.email = input.email;
    if (input.role && requestingUser.role === "admin") updateData.role = input.role;

    if (input.password) {
      updateData.passwordHash = await Bun.password.hash(input.password, {
        algorithm: "bcrypt",
        cost: 10,
      });
    }

    const updated = await this.userRepo.update(id, updateData);
    if (!updated) {
      throw new AppError("Failed to update user", 500);
    }

    return this.sanitizeUser(updated);
  }

  async deleteUser(id: number, requestingUser: AuthUser): Promise<void> {
    // Only allow self deletion or admin deletion
    if (requestingUser.id !== id && requestingUser.role !== "admin") {
      throw new AppError("You do not have permission to delete this user", 403);
    }

    const existing = await this.userRepo.findById(id);
    if (!existing) {
      throw new AppError("User not found", 404);
    }

    const deleted = await this.userRepo.delete(id);
    if (!deleted) {
      throw new AppError("Failed to delete user", 500);
    }
  }
}

export const userService = new UserService();
```

### `src/services/post.service.ts`

```typescript
import { postRepository, PostRepository, type PostWithAuthor } from "../repositories/post.repository";
import { AppError } from "../middlewares/error.middleware";
import type { CreatePostInput, UpdatePostInput, PostQueryInput } from "../validators/post.validator";
import type { AuthUser } from "../types";
import type { Post } from "../db/schema/posts";

export class PostService {
  constructor(private readonly postRepo: PostRepository = postRepository) {}

  async getPostById(id: number): Promise<PostWithAuthor> {
    const post = await this.postRepo.findById(id);
    if (!post) {
      throw new AppError("Post not found", 404);
    }
    return post;
  }

  async getAllPosts(query: PostQueryInput): Promise<{
    posts: PostWithAuthor[];
    meta: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const { page = 1, limit = 10, published, authorId } = query;
    const offset = (page - 1) * limit;

    const [postList, total] = await Promise.all([
      this.postRepo.findAll({
        publishedOnly: published,
        authorId,
        limit,
        offset,
      }),
      this.postRepo.count({
        publishedOnly: published,
        authorId,
      }),
    ]);

    return {
      posts: postList,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async createPost(authorId: number, input: CreatePostInput): Promise<Post> {
    return await this.postRepo.create({
      title: input.title,
      content: input.content,
      published: input.published ?? false,
      authorId,
    });
  }

  async updatePost(
    id: number,
    requestingUser: AuthUser,
    input: UpdatePostInput
  ): Promise<Post> {
    const existing = await this.postRepo.findById(id);
    if (!existing) {
      throw new AppError("Post not found", 404);
    }

    // Only the author or an admin can update the post
    if (existing.authorId !== requestingUser.id && requestingUser.role !== "admin") {
      throw new AppError("You do not have permission to modify this post", 403);
    }

    const updated = await this.postRepo.update(id, input);
    if (!updated) {
      throw new AppError("Failed to update post", 500);
    }

    return updated;
  }

  async deletePost(id: number, requestingUser: AuthUser): Promise<void> {
    const existing = await this.postRepo.findById(id);
    if (!existing) {
      throw new AppError("Post not found", 404);
    }

    // Only the author or an admin can delete the post
    if (existing.authorId !== requestingUser.id && requestingUser.role !== "admin") {
      throw new AppError("You do not have permission to delete this post", 403);
    }

    const deleted = await this.postRepo.delete(id);
    if (!deleted) {
      throw new AppError("Failed to delete post", 500);
    }
  }
}

export const postService = new PostService();
```

---

## Step 10: Routes Layer (Controllers / HTTP)

### `src/routes/health.routes.ts`

```typescript
import { Hono } from "hono";

export const healthRoutes = new Hono();

const startTime = Date.now();

healthRoutes.get("/", (c) => {
  return c.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: `${Math.floor((Date.now() - startTime) / 1000)}s`,
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
import { registerSchema, loginSchema, formatZodError } from "../validators";
import { authService } from "../services/auth.service";
import { authMiddleware } from "../middlewares/auth.middleware";
import type { HonoEnv } from "../types";

export const authRoutes = new Hono<HonoEnv>();

authRoutes.post(
  "/register",
  zValidator("json", registerSchema, (result, c) => {
    if (!result.success) {
      return c.json(
        {
          success: false,
          message: "Validation failed",
          errors: formatZodError(result.error),
        },
        400
      );
    }
  }),
  async (c) => {
    const body = c.req.valid("json");
    const result = await authService.register(body);

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

authRoutes.post(
  "/login",
  zValidator("json", loginSchema, (result, c) => {
    if (!result.success) {
      return c.json(
        {
          success: false,
          message: "Validation failed",
          errors: formatZodError(result.error),
        },
        400
      );
    }
  }),
  async (c) => {
    const body = c.req.valid("json");
    const result = await authService.login(body);

    return c.json({
      success: true,
      message: "Login successful",
      data: result,
    });
  }
);

authRoutes.get("/me", authMiddleware, async (c) => {
  const user = c.get("user");
  const profile = await authService.getMe(user.id);

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
  userParamSchema,
  updateUserSchema,
  userQuerySchema,
  formatZodError,
} from "../validators";
import { userService } from "../services/user.service";
import { authMiddleware } from "../middlewares/auth.middleware";
import type { HonoEnv } from "../types";

export const userRoutes = new Hono<HonoEnv>();

userRoutes.get(
  "/",
  zValidator("query", userQuerySchema, (result, c) => {
    if (!result.success) {
      return c.json(
        {
          success: false,
          message: "Validation failed",
          errors: formatZodError(result.error),
        },
        400
      );
    }
  }),
  async (c) => {
    const { page, limit } = c.req.valid("query");
    const result = await userService.getAllUsers(page, limit);

    return c.json({
      success: true,
      data: result.users,
      meta: result.meta,
    });
  }
);

userRoutes.get(
  "/:id",
  zValidator("param", userParamSchema, (result, c) => {
    if (!result.success) {
      return c.json(
        {
          success: false,
          message: "Invalid ID parameter",
          errors: formatZodError(result.error),
        },
        400
      );
    }
  }),
  async (c) => {
    const { id } = c.req.valid("param");
    const user = await userService.getUserById(id);

    return c.json({
      success: true,
      data: user,
    });
  }
);

userRoutes.put(
  "/:id",
  authMiddleware,
  zValidator("param", userParamSchema, (result, c) => {
    if (!result.success) {
      return c.json(
        {
          success: false,
          message: "Invalid ID parameter",
          errors: formatZodError(result.error),
        },
        400
      );
    }
  }),
  zValidator("json", updateUserSchema, (result, c) => {
    if (!result.success) {
      return c.json(
        {
          success: false,
          message: "Validation failed",
          errors: formatZodError(result.error),
        },
        400
      );
    }
  }),
  async (c) => {
    const { id } = c.req.valid("param");
    const body = c.req.valid("json");
    const requestingUser = c.get("user");

    const updatedUser = await userService.updateUser(id, body, requestingUser);

    return c.json({
      success: true,
      message: "User updated successfully",
      data: updatedUser,
    });
  }
);

userRoutes.delete(
  "/:id",
  authMiddleware,
  zValidator("param", userParamSchema, (result, c) => {
    if (!result.success) {
      return c.json(
        {
          success: false,
          message: "Invalid ID parameter",
          errors: formatZodError(result.error),
        },
        400
      );
    }
  }),
  async (c) => {
    const { id } = c.req.valid("param");
    const requestingUser = c.get("user");

    await userService.deleteUser(id, requestingUser);

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
  postParamSchema,
  createPostSchema,
  updatePostSchema,
  postQuerySchema,
  formatZodError,
} from "../validators";
import { postService } from "../services/post.service";
import { authMiddleware } from "../middlewares/auth.middleware";
import type { HonoEnv } from "../types";

export const postRoutes = new Hono<HonoEnv>();

postRoutes.get(
  "/",
  zValidator("query", postQuerySchema, (result, c) => {
    if (!result.success) {
      return c.json(
        {
          success: false,
          message: "Validation failed",
          errors: formatZodError(result.error),
        },
        400
      );
    }
  }),
  async (c) => {
    const query = c.req.valid("query");
    const result = await postService.getAllPosts(query);

    return c.json({
      success: true,
      data: result.posts,
      meta: result.meta,
    });
  }
);

postRoutes.get(
  "/:id",
  zValidator("param", postParamSchema, (result, c) => {
    if (!result.success) {
      return c.json(
        {
          success: false,
          message: "Invalid ID parameter",
          errors: formatZodError(result.error),
        },
        400
      );
    }
  }),
  async (c) => {
    const { id } = c.req.valid("param");
    const post = await postService.getPostById(id);

    return c.json({
      success: true,
      data: post,
    });
  }
);

postRoutes.post(
  "/",
  authMiddleware,
  zValidator("json", createPostSchema, (result, c) => {
    if (!result.success) {
      return c.json(
        {
          success: false,
          message: "Validation failed",
          errors: formatZodError(result.error),
        },
        400
      );
    }
  }),
  async (c) => {
    const body = c.req.valid("json");
    const user = c.get("user");

    const newPost = await postService.createPost(user.id, body);

    return c.json(
      {
        success: true,
        message: "Post created successfully",
        data: newPost,
      },
      201
    );
  }
);

postRoutes.put(
  "/:id",
  authMiddleware,
  zValidator("param", postParamSchema, (result, c) => {
    if (!result.success) {
      return c.json(
        {
          success: false,
          message: "Invalid ID parameter",
          errors: formatZodError(result.error),
        },
        400
      );
    }
  }),
  zValidator("json", updatePostSchema, (result, c) => {
    if (!result.success) {
      return c.json(
        {
          success: false,
          message: "Validation failed",
          errors: formatZodError(result.error),
        },
        400
      );
    }
  }),
  async (c) => {
    const { id } = c.req.valid("param");
    const body = c.req.valid("json");
    const user = c.get("user");

    const updatedPost = await postService.updatePost(id, user, body);

    return c.json({
      success: true,
      message: "Post updated successfully",
      data: updatedPost,
    });
  }
);

postRoutes.delete(
  "/:id",
  authMiddleware,
  zValidator("param", postParamSchema, (result, c) => {
    if (!result.success) {
      return c.json(
        {
          success: false,
          message: "Invalid ID parameter",
          errors: formatZodError(result.error),
        },
        400
      );
    }
  }),
  async (c) => {
    const { id } = c.req.valid("param");
    const user = c.get("user");

    await postService.deletePost(id, user);

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
import { authRoutes } from "./auth.routes";
import { userRoutes } from "./user.routes";
import { postRoutes } from "./post.routes";
import { healthRoutes } from "./health.routes";
import type { HonoEnv } from "../types";

export const routes = new Hono<HonoEnv>();

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

routes.route("/health", healthRoutes);
routes.route("/api/auth", authRoutes);
routes.route("/api/users", userRoutes);
routes.route("/api/posts", postRoutes);
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
import { errorHandler, notFoundHandler } from "./middlewares/error.middleware";
import type { HonoEnv } from "./types";

export function createApp(): Hono<HonoEnv> {
  const app = new Hono<HonoEnv>();

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
  app.notFound(notFoundHandler);

  // Global Error Handler
  app.onError(errorHandler);

  return app;
}

export const app = createApp();
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

const handleShutdown = () => {
  console.log("\nGracefully shutting down server...");
  server.stop();
  process.exit(0);
};

process.on("SIGINT", handleShutdown);
process.on("SIGTERM", handleShutdown);

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
  registerSchema,
  loginSchema,
  createPostSchema,
  updatePostSchema,
  updateUserSchema,
  userParamSchema,
  postQuerySchema,
  formatZodError,
} from "../src/validators";

describe("Zod Validators", () => {
  describe("registerSchema", () => {
    it("should accept valid register input", () => {
      const valid = {
        name: "Alice Johnson",
        email: "alice@example.com",
        password: "securepassword123",
      };
      const result = registerSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("should reject invalid email and short password", () => {
      const invalid = {
        name: "A",
        email: "not-an-email",
        password: "123",
      };
      const result = registerSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      if (!result.success) {
        const formatted = formatZodError(result.error);
        expect(typeof formatted).toBe("object");
      }
    });
  });

  describe("loginSchema", () => {
    it("should accept valid login input", () => {
      const valid = {
        email: "alice@example.com",
        password: "securepassword123",
      };
      const result = loginSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("should reject empty password", () => {
      const invalid = {
        email: "alice@example.com",
        password: "",
      };
      const result = loginSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe("createPostSchema", () => {
    it("should validate valid post creation payload", () => {
      const valid = {
        title: "Getting Started with Bun and Hono",
        content: "Hono is extremely fast and modular.",
        published: true,
      };
      const result = createPostSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("should reject empty title", () => {
      const invalid = {
        title: "   ",
        content: "Some content",
      };
      const result = createPostSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe("postQuerySchema", () => {
    it("should parse boolean string for published query param", () => {
      const parsed = postQuerySchema.parse({ published: "true", page: "2", limit: "20" });
      expect(parsed.published).toBe(true);
      expect(parsed.page).toBe(2);
      expect(parsed.limit).toBe(20);
    });
  });

  describe("userParamSchema", () => {
    it("should coerce string numbers into integer IDs", () => {
      const parsed = userParamSchema.parse({ id: "42" });
      expect(parsed.id).toBe(42);
    });

    it("should reject non-numeric IDs", () => {
      const result = userParamSchema.safeParse({ id: "abc" });
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
import type { User } from "../src/db/schema/users";
import type { Post } from "../src/db/schema/posts";

describe("Service Layer Unit Tests", () => {
  describe("AuthService", () => {
    it("should hash passwords and generate JWT tokens on register", async () => {
      const mockUsers: User[] = [];
      const mockUserRepo = {
        findByEmail: async (email: string) => mockUsers.find((u) => u.email === email),
        findById: async (id: number) => mockUsers.find((u) => u.id === id),
        create: async (data: any) => {
          const user: User = {
            id: mockUsers.length + 1,
            name: data.name,
            email: data.email,
            passwordHash: data.passwordHash,
            role: data.role || "user",
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          mockUsers.push(user);
          return user;
        },
      } as unknown as UserRepository;

      const authService = new AuthService(mockUserRepo);

      const result = await authService.register({
        name: "Test User",
        email: "test@example.com",
        password: "secretpassword",
      });

      expect(result.user.id).toBe(1);
      expect(result.user.email).toBe("test@example.com");
      expect((result.user as any).passwordHash).toBeUndefined();
      expect(typeof result.token).toBe("string");

      const payload = await authService.verifyToken(result.token);
      expect(payload.id).toBe(1);
      expect(payload.email).toBe("test@example.com");
      expect(payload.role).toBe("user");
    });

    it("should authenticate valid credentials on login", async () => {
      const passwordHash = await Bun.password.hash("correct-password", {
        algorithm: "bcrypt",
      });

      const mockUsers: User[] = [
        {
          id: 10,
          name: "Existing User",
          email: "existing@example.com",
          passwordHash,
          role: "user",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const mockUserRepo = {
        findByEmail: async (email: string) => mockUsers.find((u) => u.email === email),
        findById: async (id: number) => mockUsers.find((u) => u.id === id),
      } as unknown as UserRepository;

      const authService = new AuthService(mockUserRepo);

      const loginResult = await authService.login({
        email: "existing@example.com",
        password: "correct-password",
      });

      expect(loginResult.user.id).toBe(10);
      expect(loginResult.token).toBeDefined();

      expect(
        authService.login({
          email: "existing@example.com",
          password: "wrong-password",
        })
      ).rejects.toThrow("Invalid email or password");
    });
  });

  describe("UserService", () => {
    it("should prevent non-admin users from modifying other user accounts", async () => {
      const mockUserRepo = {
        findById: async (id: number) => ({
          id,
          name: "Other User",
          email: "other@example.com",
          passwordHash: "hash",
          role: "user",
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      } as unknown as UserRepository;

      const userService = new UserService(mockUserRepo);

      expect(
        userService.updateUser(
          2,
          { name: "Hacked" },
          { id: 1, email: "me@example.com", role: "user" }
        )
      ).rejects.toThrow("You do not have permission to update this user");
    });
  });

  describe("PostService", () => {
    it("should allow author or admin to update their post and block unauthorized users", async () => {
      const mockPost: Post = {
        id: 100,
        title: "Original Title",
        content: "Original Content",
        published: false,
        authorId: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockPostRepo = {
        findById: async (id: number) => (id === 100 ? mockPost : undefined),
        update: async (id: number, data: any) => ({ ...mockPost, ...data }),
      } as unknown as PostRepository;

      const postService = new PostService(mockPostRepo);

      expect(
        postService.updatePost(
          100,
          { id: 6, email: "other@example.com", role: "user" },
          { title: "Unauthorized Edit" }
        )
      ).rejects.toThrow("You do not have permission to modify this post");

      const updated = await postService.updatePost(
        100,
        { id: 5, email: "author@example.com", role: "user" },
        { title: "Author Edit" }
      );
      expect(updated.title).toBe("Author Edit");

      const adminUpdated = await postService.updatePost(
        100,
        { id: 999, email: "admin@example.com", role: "admin" },
        { title: "Admin Edit" }
      );
      expect(adminUpdated.title).toBe("Admin Edit");
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

