import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import {
  userParamSchema,
  updateUserSchema,
  userQuerySchema,
  formatZodError,
} from "../validators";
import { userService } from "../services/user.service";
import { authMiddleware } from "../middlewares/auth.middleware";
import type { HonoEnv } from "../types";

export const userRoutes = new Hono<HonoEnv>();

// GET /api/users - List users with pagination
userRoutes.get(
  "/",
  zValidator("query", userQuerySchema, (result, c) => {
    if (!result.success) {
      return c.json(
        {
          success: false,
          message: "Validation failed",
          errors: formatZodError(result.error),
        },
        400
      );
    }
  }),
  async (c) => {
    const { page, limit } = c.req.valid("query");
    const result = await userService.getAllUsers(page, limit);

    return c.json({
      success: true,
      data: result.users,
      meta: result.meta,
    });
  }
);

// GET /api/users/:id - Get user by ID
userRoutes.get(
  "/:id",
  zValidator("param", userParamSchema, (result, c) => {
    if (!result.success) {
      return c.json(
        {
          success: false,
          message: "Invalid ID parameter",
          errors: formatZodError(result.error),
        },
        400
      );
    }
  }),
  async (c) => {
    const { id } = c.req.valid("param");
    const user = await userService.getUserById(id);

    return c.json({
      success: true,
      data: user,
    });
  }
);

// PUT /api/users/:id - Update user (requires auth)
userRoutes.put(
  "/:id",
  authMiddleware,
  zValidator("param", userParamSchema, (result, c) => {
    if (!result.success) {
      return c.json(
        {
          success: false,
          message: "Invalid ID parameter",
          errors: formatZodError(result.error),
        },
        400
      );
    }
  }),
  zValidator("json", updateUserSchema, (result, c) => {
    if (!result.success) {
      return c.json(
        {
          success: false,
          message: "Validation failed",
          errors: formatZodError(result.error),
        },
        400
      );
    }
  }),
  async (c) => {
    const { id } = c.req.valid("param");
    const body = c.req.valid("json");
    const requestingUser = c.get("user");

    const updatedUser = await userService.updateUser(id, body, requestingUser);

    return c.json({
      success: true,
      message: "User updated successfully",
      data: updatedUser,
    });
  }
);

// DELETE /api/users/:id - Delete user (requires auth)
userRoutes.delete(
  "/:id",
  authMiddleware,
  zValidator("param", userParamSchema, (result, c) => {
    if (!result.success) {
      return c.json(
        {
          success: false,
          message: "Invalid ID parameter",
          errors: formatZodError(result.error),
        },
        400
      );
    }
  }),
  async (c) => {
    const { id } = c.req.valid("param");
    const requestingUser = c.get("user");

    await userService.deleteUser(id, requestingUser);

    return c.json({
      success: true,
      message: "User deleted successfully",
    });
  }
);

