import { eq, and, desc, count } from "drizzle-orm";
import { db, type Database } from "../db";
import { posts, type Post, type NewPost } from "../db/schema/posts";
import { users } from "../db/schema/users";

export interface PostFindOptions {
  publishedOnly?: boolean;
  authorId?: number;
  limit?: number;
  offset?: number;
}

export interface PostWithAuthor extends Post {
  author?: {
    id: number;
    name: string;
    email: string;
  };
}

export class PostRepository {
  constructor(private readonly database: Database = db) {}

  async findById(id: number): Promise<PostWithAuthor | undefined> {
    const result = await this.database
      .select({
        id: posts.id,
        title: posts.title,
        content: posts.content,
        published: posts.published,
        authorId: posts.authorId,
        createdAt: posts.createdAt,
        updatedAt: posts.updatedAt,
        author: {
          id: users.id,
          name: users.name,
          email: users.email,
        },
      })
      .from(posts)
      .leftJoin(users, eq(posts.authorId, users.id))
      .where(eq(posts.id, id))
      .limit(1);

    const row = result[0];
    if (!row) return undefined;

    return {
      id: row.id,
      title: row.title,
      content: row.content,
      published: row.published,
      authorId: row.authorId,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      author: row.author?.id ? row.author : undefined,
    };
  }

  async findAll(options: PostFindOptions = {}): Promise<PostWithAuthor[]> {
    const { publishedOnly = false, authorId, limit = 10, offset = 0 } = options;

    const conditions = [];
    if (publishedOnly) {
      conditions.push(eq(posts.published, true));
    }
    if (authorId !== undefined) {
      conditions.push(eq(posts.authorId, authorId));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const query = this.database
      .select({
        id: posts.id,
        title: posts.title,
        content: posts.content,
        published: posts.published,
        authorId: posts.authorId,
        createdAt: posts.createdAt,
        updatedAt: posts.updatedAt,
        author: {
          id: users.id,
          name: users.name,
          email: users.email,
        },
      })
      .from(posts)
      .leftJoin(users, eq(posts.authorId, users.id))
      .where(whereClause)
      .limit(limit)
      .offset(offset)
      .orderBy(desc(posts.createdAt));

    const rows = await query;
    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      content: row.content,
      published: row.published,
      authorId: row.authorId,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      author: row.author?.id ? row.author : undefined,
    }));
  }

  async count(options: Omit<PostFindOptions, "limit" | "offset"> = {}): Promise<number> {
    const { publishedOnly = false, authorId } = options;

    const conditions = [];
    if (publishedOnly) {
      conditions.push(eq(posts.published, true));
    }
    if (authorId !== undefined) {
      conditions.push(eq(posts.authorId, authorId));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const result = await this.database
      .select({ total: count() })
      .from(posts)
      .where(whereClause);

    return Number(result[0]?.total ?? 0);
  }

  async create(postData: NewPost): Promise<Post> {
    const result = await this.database.insert(posts).values(postData).returning();
    const post = result[0];
    if (!post) {
      throw new Error("Failed to create post");
    }
    return post;
  }

  async update(id: number, postData: Partial<NewPost>): Promise<Post | undefined> {
    const result = await this.database
      .update(posts)
      .set({
        ...postData,
        updatedAt: new Date(),
      })
      .where(eq(posts.id, id))
      .returning();
    return result[0];
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.database
      .delete(posts)
      .where(eq(posts.id, id))
      .returning();
    return result.length > 0;
  }
}

export const postRepository = new PostRepository();

