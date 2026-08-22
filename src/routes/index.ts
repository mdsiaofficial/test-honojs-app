import { Hono } from "hono";
import { authRoutes } from "./auth.routes";
import { userRoutes } from "./user.routes";
import { postRoutes } from "./post.routes";
import { healthRoutes } from "./health.routes";
import type { HonoEnv } from "../types";

export const routes = new Hono<HonoEnv>();

// Root API information endpoint
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

