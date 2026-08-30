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
