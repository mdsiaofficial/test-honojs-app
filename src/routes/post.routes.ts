import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import {
  postParamSchema,
  createPostSchema,
  updatePostSchema,
  postQuerySchema,
  formatZodError,
} from "../validators";
import { postService } from "../services/post.service";
import { authMiddleware } from "../middlewares/auth.middleware";
import type { HonoEnv } from "../types";

export const postRoutes = new Hono<HonoEnv>();

// GET /api/posts - List posts with query filtering & pagination
postRoutes.get(
  "/",
  zValidator("query", postQuerySchema, (result, c) => {
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
    const query = c.req.valid("query");
    const result = await postService.getAllPosts(query);

    return c.json({
      success: true,
      data: result.posts,
      meta: result.meta,
    });
  }
);

// GET /api/posts/:id - Get post by ID
postRoutes.get(
  "/:id",
  zValidator("param", postParamSchema, (result, c) => {
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
    const post = await postService.getPostById(id);

    return c.json({
      success: true,
      data: post,
    });
  }
);

// POST /api/posts - Create new post (requires auth)
postRoutes.post(
  "/",
  authMiddleware,
  zValidator("json", createPostSchema, (result, c) => {
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
    const user = c.get("user");

    const newPost = await postService.createPost(user.id, body);

    return c.json(
      {
        success: true,
        message: "Post created successfully",
        data: newPost,
      },
      201
    );
  }
);

// PUT /api/posts/:id - Update post (requires auth)
postRoutes.put(
  "/:id",
  authMiddleware,
  zValidator("param", postParamSchema, (result, c) => {
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
  zValidator("json", updatePostSchema, (result, c) => {
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
    const user = c.get("user");

    const updatedPost = await postService.updatePost(id, user, body);

    return c.json({
      success: true,
      message: "Post updated successfully",
      data: updatedPost,
    });
  }
);

// DELETE /api/posts/:id - Delete post (requires auth)
postRoutes.delete(
  "/:id",
  authMiddleware,
  zValidator("param", postParamSchema, (result, c) => {
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
    const user = c.get("user");

    await postService.deletePost(id, user);

    return c.json({
      success: true,
      message: "Post deleted successfully",
    });
  }
);

