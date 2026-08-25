import { Hono } from "hono";
import type { THonoEnv } from "./types/types";
import { logger } from "hono/logger";
import { secureHeaders } from "hono/secure-headers";
import { cors } from "hono/cors";
import { trimTrailingSlash } from "hono/trailing-slash";
import { routes } from "./routes/routes";

export function createApp(): Hono<THonoEnv> {
  const app = new Hono<THonoEnv>();

  //! Global Middlewares
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

  //! Mount API routes
  app.route("/", routes);

  //! 404 Not Found Handler
  // app.notFound(notFoundHandler);

  //! Global Error Handler
  // app.onError(errorHandler);

  return app;
}

export const app = createApp();