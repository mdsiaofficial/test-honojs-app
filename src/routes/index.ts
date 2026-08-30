import { Hono } from "hono";
import { health_routes } from "./health.routes";
import type { THonoEnv } from "../types/types";

export const routes = new Hono<THonoEnv>();

routes.get("/", (c) => {
  // console.log(c.req.url)
  const { origin } = new URL(c.req.url);
  // console.log(origin);
  return c.json({
    name: "Bun + Hono + Drizzle API",
    version: "1.0.0",
    runtime: `Bun ${Bun.version}`,
    endpoints: {
      health: `${origin}/health`,
      // auth: {
      //   register: "POST /api/auth/register",
      //   login: "POST /api/auth/login",
      //   me: "GET /api/auth/me",
      // },
      // users: {
      //   list: "GET /api/users",
      //   get: "GET /api/users/:id",
      //   update: "PUT /api/users/:id",
      //   delete: "DELETE /api/users/:id",
      // },
      // posts: {
      //   list: "GET /api/posts",
      //   get: "GET /api/posts/:id",
      //   create: "POST /api/posts",
      //   update: "PUT /api/posts/:id",
      //   delete: "DELETE /api/posts/:id",
      // },
    },
  });
});

routes.route("/health", health_routes);