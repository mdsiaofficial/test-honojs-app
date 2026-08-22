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

