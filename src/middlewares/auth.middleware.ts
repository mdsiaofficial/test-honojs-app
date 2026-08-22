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

