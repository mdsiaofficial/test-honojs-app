import { z } from "zod";

export const userParamSchema = z.object({
  id: z.coerce.number().int().positive("User ID must be a positive integer"),
});

export const updateUserSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  email: z.string().trim().toLowerCase().email().optional(),
  password: z.string().min(6).max(100).optional(),
  role: z.enum(["user", "admin"]).optional(),
});

export const userQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type UserParamInput = z.infer<typeof userParamSchema>;
export type UserQueryInput = z.infer<typeof userQuerySchema>;

