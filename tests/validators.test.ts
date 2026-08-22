import { describe, expect, it } from "bun:test";
import {
  registerSchema,
  loginSchema,
  createPostSchema,
  updatePostSchema,
  updateUserSchema,
  userParamSchema,
  postQuerySchema,
  formatZodError,
} from "../src/validators";

describe("Zod Validators", () => {
  describe("registerSchema", () => {
    it("should accept valid register input", () => {
      const valid = {
        name: "Alice Johnson",
        email: "alice@example.com",
        password: "securepassword123",
      };
      const result = registerSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("should reject invalid email and short password", () => {
      const invalid = {
        name: "A",
        email: "not-an-email",
        password: "123",
      };
      const result = registerSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      if (!result.success) {
        const formatted = formatZodError(result.error);
        expect(typeof formatted).toBe("object");
      }
    });
  });

  describe("loginSchema", () => {
    it("should accept valid login input", () => {
      const valid = {
        email: "alice@example.com",
        password: "securepassword123",
      };
      const result = loginSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("should reject empty password", () => {
      const invalid = {
        email: "alice@example.com",
        password: "",
      };
      const result = loginSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe("createPostSchema", () => {
    it("should validate valid post creation payload", () => {
      const valid = {
        title: "Getting Started with Bun and Hono",
        content: "Hono is extremely fast and modular.",
        published: true,
      };
      const result = createPostSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("should reject empty title", () => {
      const invalid = {
        title: "   ",
        content: "Some content",
      };
      const result = createPostSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe("postQuerySchema", () => {
    it("should parse boolean string for published query param", () => {
      const parsed = postQuerySchema.parse({ published: "true", page: "2", limit: "20" });
      expect(parsed.published).toBe(true);
      expect(parsed.page).toBe(2);
      expect(parsed.limit).toBe(20);
    });
  });

  describe("userParamSchema", () => {
    it("should coerce string numbers into integer IDs", () => {
      const parsed = userParamSchema.parse({ id: "42" });
      expect(parsed.id).toBe(42);
    });

    it("should reject non-numeric IDs", () => {
      const result = userParamSchema.safeParse({ id: "abc" });
      expect(result.success).toBe(false);
    });
  });
});

