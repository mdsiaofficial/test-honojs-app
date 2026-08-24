import { defineConfig } from "drizzle-kit";


export default defineConfig({
  dialect: "postgresql",
  schema: "./src/schema/index.ts",
  out: "./src/drizzle",
  dbCredentials: {
    url: process.env.DATABASE_URL || "postgres://test_honojs_db:test_honojs_db@localhost:5432/test_honojs_db",
  },
  strict: true,
  verbose: true,
})