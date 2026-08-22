import { describe, expect, it } from "bun:test";
import { app } from "../src/app";

describe("Health Check API", () => {
  it("GET /health should return 200 with runtime info", async () => {
    const res = await app.request("/health");
    expect(res.status).toBe(200);

    const json = (await res.json()) as {
      status: string;
      runtime: { name: string; version: string };
      timestamp: string;
    };
    expect(json.status).toBe("ok");
    expect(json.runtime.name).toBe("Bun");
    expect(json.runtime.version).toBeDefined();
    expect(json.timestamp).toBeDefined();
  });

  it("GET / should return root API metadata and endpoint map", async () => {
    const res = await app.request("/");
    expect(res.status).toBe(200);

    const json = (await res.json()) as {
      name: string;
      endpoints: { health: string; [key: string]: unknown };
    };
    expect(json.name).toBe("Bun + Hono + Drizzle API");
    expect(json.endpoints).toBeDefined();
    expect(json.endpoints.health).toBe("/health");
  });

  it("GET /non-existent-route should return 404 not found format", async () => {
    const res = await app.request("/non-existent-route");
    expect(res.status).toBe(404);

    const json = (await res.json()) as {
      success: boolean;
      message: string;
    };
    expect(json.success).toBe(false);
    expect(json.message).toContain("Cannot GET /non-existent-route");
  });
});

