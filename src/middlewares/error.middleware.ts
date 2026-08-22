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

  // Check if error looks like a ZodError (has issues)
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

  // Handle postgres / database constraint violations
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

