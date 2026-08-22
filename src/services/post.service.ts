import { postRepository, PostRepository, type PostWithAuthor } from "../repositories/post.repository";
import { AppError } from "../middlewares/error.middleware";
import type { CreatePostInput, UpdatePostInput, PostQueryInput } from "../validators/post.validator";
import type { AuthUser } from "../types";
import type { Post } from "../db/schema/posts";

export class PostService {
  constructor(private readonly postRepo: PostRepository = postRepository) {}

  async getPostById(id: number): Promise<PostWithAuthor> {
    const post = await this.postRepo.findById(id);
    if (!post) {
      throw new AppError("Post not found", 404);
    }
    return post;
  }

  async getAllPosts(query: PostQueryInput): Promise<{
    posts: PostWithAuthor[];
    meta: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const { page = 1, limit = 10, published, authorId } = query;
    const offset = (page - 1) * limit;

    const [postList, total] = await Promise.all([
      this.postRepo.findAll({
        publishedOnly: published,
        authorId,
        limit,
        offset,
      }),
      this.postRepo.count({
        publishedOnly: published,
        authorId,
      }),
    ]);

    return {
      posts: postList,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async createPost(authorId: number, input: CreatePostInput): Promise<Post> {
    return await this.postRepo.create({
      title: input.title,
      content: input.content,
      published: input.published ?? false,
      authorId,
    });
  }

  async updatePost(
    id: number,
    requestingUser: AuthUser,
    input: UpdatePostInput
  ): Promise<Post> {
    const existing = await this.postRepo.findById(id);
    if (!existing) {
      throw new AppError("Post not found", 404);
    }

    // Only the author or an admin can update the post
    if (existing.authorId !== requestingUser.id && requestingUser.role !== "admin") {
      throw new AppError("You do not have permission to modify this post", 403);
    }

    const updated = await this.postRepo.update(id, input);
    if (!updated) {
      throw new AppError("Failed to update post", 500);
    }

    return updated;
  }

  async deletePost(id: number, requestingUser: AuthUser): Promise<void> {
    const existing = await this.postRepo.findById(id);
    if (!existing) {
      throw new AppError("Post not found", 404);
    }

    // Only the author or an admin can delete the post
    if (existing.authorId !== requestingUser.id && requestingUser.role !== "admin") {
      throw new AppError("You do not have permission to delete this post", 403);
    }

    const deleted = await this.postRepo.delete(id);
    if (!deleted) {
      throw new AppError("Failed to delete post", 500);
    }
  }
}

export const postService = new PostService();

