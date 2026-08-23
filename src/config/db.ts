import postgres from "postgres";
import { env } from "./env";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "../schema";

export const queryClient = postgres(env.DATABASE_URL, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
});

export const db = drizzle(queryClient, { schema });
export type Database = typeof db;
export { schema };