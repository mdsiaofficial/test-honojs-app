import { describe, expect, it } from "bun:test";
import { AuthService } from "../src/services/auth.service";
import { UserService } from "../src/services/user.service";
import { PostService } from "../src/services/post.service";
import { UserRepository } from "../src/repositories/user.repository";
import { PostRepository } from "../src/repositories/post.repository";
import { AppError } from "../src/middlewares/error.middleware";
import type { User } from "../src/db/schema/users";
import type { Post } from "../src/db/schema/posts";

describe("Service Layer Unit Tests", () => {
  describe("AuthService", () => {
    it("should hash passwords and generate JWT tokens on register", async () => {
      const mockUsers: User[] = [];
      const mockUserRepo = {
        findByEmail: async (email: string) => mockUsers.find((u) => u.email === email),
        findById: async (id: number) => mockUsers.find((u) => u.id === id),
        create: async (data: any) => {
          const user: User = {
            id: mockUsers.length + 1,
            name: data.name,
            email: data.email,
            passwordHash: data.passwordHash,
            role: data.role || "user",
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          mockUsers.push(user);
          return user;
        },
      } as unknown as UserRepository;

      const authService = new AuthService(mockUserRepo);

      const result = await authService.register({
        name: "Test User",
        email: "test@example.com",
        password: "secretpassword",
      });

      expect(result.user.id).toBe(1);
      expect(result.user.email).toBe("test@example.com");
      expect((result.user as any).passwordHash).toBeUndefined();
      expect(typeof result.token).toBe("string");

      // Verify token
      const payload = await authService.verifyToken(result.token);
      expect(payload.id).toBe(1);
      expect(payload.email).toBe("test@example.com");
      expect(payload.role).toBe("user");
    });

    it("should authenticate valid credentials on login", async () => {
      const passwordHash = await Bun.password.hash("correct-password", {
        algorithm: "bcrypt",
      });

      const mockUsers: User[] = [
        {
          id: 10,
          name: "Existing User",
          email: "existing@example.com",
          passwordHash,
          role: "user",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const mockUserRepo = {
        findByEmail: async (email: string) => mockUsers.find((u) => u.email === email),
        findById: async (id: number) => mockUsers.find((u) => u.id === id),
      } as unknown as UserRepository;

      const authService = new AuthService(mockUserRepo);

      const loginResult = await authService.login({
        email: "existing@example.com",
        password: "correct-password",
      });

      expect(loginResult.user.id).toBe(10);
      expect(loginResult.token).toBeDefined();

      // Incorrect password test
      expect(
        authService.login({
          email: "existing@example.com",
          password: "wrong-password",
        })
      ).rejects.toThrow("Invalid email or password");
    });
  });

  describe("UserService", () => {
    it("should prevent non-admin users from modifying other user accounts", async () => {
      const mockUserRepo = {
        findById: async (id: number) => ({
          id,
          name: "Other User",
          email: "other@example.com",
          passwordHash: "hash",
          role: "user",
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      } as unknown as UserRepository;

      const userService = new UserService(mockUserRepo);

      expect(
        userService.updateUser(
          2,
          { name: "Hacked" },
          { id: 1, email: "me@example.com", role: "user" }
        )
      ).rejects.toThrow("You do not have permission to update this user");
    });
  });

  describe("PostService", () => {
    it("should allow author or admin to update their post and block unauthorized users", async () => {
      const mockPost: Post = {
        id: 100,
        title: "Original Title",
        content: "Original Content",
        published: false,
        authorId: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockPostRepo = {
        findById: async (id: number) => (id === 100 ? mockPost : undefined),
        update: async (id: number, data: any) => ({ ...mockPost, ...data }),
      } as unknown as PostRepository;

      const postService = new PostService(mockPostRepo);

      // Blocked user (id: 6, role: user)
      expect(
        postService.updatePost(
          100,
          { id: 6, email: "other@example.com", role: "user" },
          { title: "Unauthorized Edit" }
        )
      ).rejects.toThrow("You do not have permission to modify this post");

      // Allowed author (id: 5, role: user)
      const updated = await postService.updatePost(
        100,
        { id: 5, email: "author@example.com", role: "user" },
        { title: "Author Edit" }
      );
      expect(updated.title).toBe("Author Edit");

      // Allowed admin (id: 999, role: admin)
      const adminUpdated = await postService.updatePost(
        100,
        { id: 999, email: "admin@example.com", role: "admin" },
        { title: "Admin Edit" }
      );
      expect(adminUpdated.title).toBe("Admin Edit");
    });
  });
});

