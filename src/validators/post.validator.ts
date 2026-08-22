import { z } from "zod";

export const postParamSchema = z.object({
  id: z.coerce.number().int().positive("Post ID must be a positive integer"),
});

export const createPostSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(255),
  content: z.string().trim().min(1, "Content is required"),
  published: z.boolean().default(false).optional(),
});

export const updatePostSchema = z.object({
  title: z.string().trim().min(1).max(255).optional(),
  content: z.string().trim().min(1).optional(),
  published: z.boolean().optional(),
});

export const postQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  published: z
    .enum(["true", "false"])
    .transform((val) => val === "true")
    .optional(),
  authorId: z.coerce.number().int().positive().optional(),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;
export type UpdatePostInput = z.infer<typeof updatePostSchema>;
export type PostParamInput = z.infer<typeof postParamSchema>;
export type PostQueryInput = z.infer<typeof postQuerySchema>;

