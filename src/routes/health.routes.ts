import { Hono } from "hono";
import { env } from "../config/env";

export const health_routes = new Hono();

const startTime = Date.now();

health_routes.get("/", (c) => {
  return c.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: `${Math.floor((Date.now() - startTime) / 1000)}s`,
    runtime: {
      name: "Bun",
      version: Bun.version,
    },
    environment: env.NODE_ENV || "development",
  });
});