import { describe, expect, it } from "bun:test";
import { app } from "../src/app";

describe("Auth Routes HTTP Validation", () => {
  it("POST /api/auth/register should fail with 400 when missing fields", async () => {
    const res = await app.request("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "A" }),
    });

    expect(res.status).toBe(400);
    const json = (await res.json()) as {
      success: boolean;
      message: string;
      errors: Record<string, unknown>;
    };
    expect(json.success).toBe(false);
    expect(json.message).toBe("Validation failed");
    expect(json.errors).toBeDefined();
  });

  it("POST /api/auth/login should fail with 400 on invalid email", async () => {
    const res = await app.request("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "invalid-email", password: "" }),
    });

    expect(res.status).toBe(400);
    const json = (await res.json()) as {
      success: boolean;
      errors: { email?: unknown };
    };
    expect(json.success).toBe(false);
    expect(json.errors.email).toBeDefined();
  });

  it("GET /api/auth/me should return 401 when unauthenticated", async () => {
    const res = await app.request("/api/auth/me");
    expect(res.status).toBe(401);
    const json = (await res.json()) as {
      success: boolean;
    };
    expect(json.success).toBe(false);
  });
});

