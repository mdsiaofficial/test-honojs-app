# Modern TypeScript Backend with Bun + Hono + Drizzle ORM + PostgreSQL

A modular backend architecture built with **Bun**, **Hono.js**, **Drizzle ORM**, **PostgreSQL**, and **Zod**.

---

## 🏗 Architecture Overview

The codebase is organized into layered boundaries with strict separation of concerns:

```text
HTTP Request
     │
     ▼
[ Middlewares ] ──────── (Logger, CORS, Secure Headers, JWT Authentication)
     │
     ▼
[ Routes / Controllers ] ─ (Hono route definitions, Zod validation with @hono/zod-validator)
     │
     ▼
[ Services ] ─────────── (Business logic, password hashing via Bun.password, permissions)
     │
     ▼
[ Repositories ] ─────── (Drizzle ORM query layer, data access abstraction)
     │
     ▼
[ PostgreSQL Database ] ── (postgres.js connection pool)
```

---

## 📁 Project Structure

```text
.
├── drizzle/                    # Generated SQL migration files (Drizzle Kit)
├── src/
│   ├── app.ts                  # Hono application factory & middleware setup
│   ├── server.ts               # Server bootstrap & process lifecycle
│   ├── config/
│   │   └── env.ts              # Zod-validated environment configuration
│   ├── db/
│   │   ├── index.ts            # Drizzle client & PostgreSQL connection pool
│   │   └── schema/             # Drizzle tables & relation definitions
│   │       ├── index.ts        # Schema barrel export
│   │       ├── users.ts        # Users table schema & types
│   │       └── posts.ts        # Posts table schema & types
│   ├── repositories/           # Data access repository layer
│   │   ├── user.repository.ts  # User database operations
│   │   └── post.repository.ts  # Post database operations
│   ├── services/               # Core business logic layer
│   │   ├── auth.service.ts     # User registration, login, JWT issuance
│   │   ├── user.service.ts     # User management & sanitization
│   │   └── post.service.ts     # Post management & ownership enforcement
│   ├── routes/                 # API endpoint definitions
│   │   ├── index.ts            # Route aggregation & root info
│   │   ├── auth.routes.ts      # Authentication endpoints
│   │   ├── user.routes.ts      # User CRUD endpoints
│   │   ├── post.routes.ts      # Post CRUD endpoints
│   │   └── health.routes.ts    # Health check endpoint
│   ├── middlewares/            # Custom middlewares
│   │   ├── auth.middleware.ts  # JWT verification & role authorization guard
│   │   └── error.middleware.ts # Centralized error & 404 handler
│   ├── validators/             # Zod input validation schemas
│   │   ├── auth.validator.ts   # Registration & login schemas
│   │   ├── user.validator.ts   # User update & param schemas
│   │   └── post.validator.ts   # Post creation & query schemas
│   └── types/
│       └── index.ts            # TypeScript interfaces & Hono environment types
├── tests/                      # Automated test suite (Bun test)
│   ├── auth.test.ts            # Auth route HTTP tests
│   ├── health.test.ts          # Health & root route tests
│   ├── services.test.ts        # Service layer unit tests
│   └── validators.test.ts      # Zod validation tests
├── drizzle.config.ts           # Drizzle Kit CLI configuration
├── .dockerignore               # Docker ignore rules
├── Dockerfile                  # Docker build configuration (Bun Alpine)
├── .env.example                # Example environment configuration
└── package.json
```

---

## 🚀 Getting Started

### 1. Prerequisites
- [Bun](https://bun.sh) (v1.0+)
- [PostgreSQL](https://www.postgresql.org/) (v14+)

### 2. Installation
```bash
# Clone the repository and install dependencies
bun install
```

### 3. Environment Setup
Copy the example environment file:
```bash
cp .env.example .env
```

Configure your `.env` variables:
```env
PORT=3000
NODE_ENV=development
DATABASE_URL=postgres://postgres:postgres@localhost:5432/test_hono_db
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d
```

### 4. Database Migrations (Drizzle Kit)
```bash
# Generate SQL migrations from schema
bun run db:generate

# Push schema directly to database (development)
bun run db:push

# Apply migrations to database
bun run db:migrate

# Open Drizzle Studio UI to browse database
bun run db:studio
```

### 5. Running the Application
```bash
# Development mode with hot-reloading
bun run dev

# Production build & start locally
bun run start

# Or run in Docker (connected to host machine PostgreSQL)
bun run docker:build
bun run docker:run
```

### 6. Running Tests
```bash
bun test
```

---

## 📡 API Reference

### Health & Metadata
| Method | Endpoint  | Description                          | Auth Required |
| ------ | --------- | ------------------------------------ | ------------- |
| `GET`  | `/`       | Root API details & endpoint catalog  | No            |
| `GET`  | `/health` | Server uptime & Bun runtime metrics  | No            |

### Authentication
| Method | Endpoint             | Description                               | Auth Required |
| ------ | -------------------- | ----------------------------------------- | ------------- |
| `POST` | `/api/auth/register` | Register a new user (`name, email, password`) | No        |
| `POST` | `/api/auth/login`    | Login and receive Bearer JWT token        | No            |
| `GET`  | `/api/auth/me`       | Get authenticated user profile            | Bearer Token  |

### Users
| Method   | Endpoint         | Description                            | Auth Required |
| -------- | ---------------- | -------------------------------------- | ------------- |
| `GET`    | `/api/users`     | Paginated list of users (`page, limit`)| No            |
| `GET`    | `/api/users/:id` | Get user by ID                         | No            |
| `PUT`    | `/api/users/:id` | Update user profile                    | Self / Admin  |
| `DELETE` | `/api/users/:id` | Delete user account                    | Self / Admin  |

### Posts
| Method   | Endpoint         | Description                                       | Auth Required |
| -------- | ---------------- | ------------------------------------------------- | ------------- |
| `GET`    | `/api/posts`     | List posts (`page, limit, published, authorId`)   | No            |
| `GET`    | `/api/posts/:id` | Get post by ID with author details                | No            |
| `POST`   | `/api/posts`     | Create a post (`title, content, published`)       | Bearer Token  |
| `PUT`    | `/api/posts/:id` | Update post                                       | Author / Admin|
| `DELETE` | `/api/posts/:id` | Delete post                                       | Author / Admin|

---

## 🛡 Features Included

- **Native Speed**: Powered by Bun runtime and Hono framework.
- **Type-safe Database Access**: Drizzle ORM with automatic schema inference and type-checked queries.
- **Layered Architecture**: Decoupled Route ➔ Service ➔ Repository ➔ PostgreSQL pattern.
- **Zod Request Validation**: Strict runtime validation for request bodies, URL params, and query strings.
- **JWT & Password Security**: Uses native `Bun.password` (Bcrypt) and JWT token validation with role-based access guards.
- **Unified Error Handling**: Centralized error middleware supporting custom `AppError`, `HTTPException`, and DB constraints.
- **Bun Test Suite**: Unit, integration, and HTTP route tests.
