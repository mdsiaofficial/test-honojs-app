import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { registerSchema, loginSchema, formatZodError } from "../validators";
import { authService } from "../services/auth.service";
import { authMiddleware } from "../middlewares/auth.middleware";
import type { HonoEnv } from "../types";

export const authRoutes = new Hono<HonoEnv>();

authRoutes.post(
  "/register",
  zValidator("json", registerSchema, (result, c) => {
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
    const body = c.req.valid("json");
    const result = await authService.register(body);

    return c.json(
      {
        success: true,
        message: "User registered successfully",
        data: result,
      },
      201
    );
  }
);

authRoutes.post(
  "/login",
  zValidator("json", loginSchema, (result, c) => {
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
    const body = c.req.valid("json");
    const result = await authService.login(body);

    return c.json({
      success: true,
      message: "Login successful",
      data: result,
    });
  }
);

authRoutes.get("/me", authMiddleware, async (c) => {
  const user = c.get("user");
  const profile = await authService.getMe(user.id);

  return c.json({
    success: true,
    data: profile,
  });
});

