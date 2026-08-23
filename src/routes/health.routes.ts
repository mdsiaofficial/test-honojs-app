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