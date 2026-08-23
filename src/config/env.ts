import { z, flattenError } from "zod";


const env_schema = z.object({
  PORT: z.coerce.number().default(5000),
  NODE_ENV: z.enum([
    "development",
    "test",
    "production",
  ]),
  DATABASE_URL: z
    .string()
    .default("postgres://postgres:postgres@localhost:5432/test_hono_db"),
  JWT_SECRET: z
    .string()
    .min(8)
    .default("default-development-jwt-secret-key-123456789"),
  JWT_EXPIRES_IN: z
    .string()
    .default("7d"),
})

export type TEnv = z.infer<typeof env_schema>;

const parsed_env = env_schema.safeParse(process.env);

if (!parsed_env.success) {
  console.error("[env error] Invalid environment variable", flattenError(parsed_env.error).fieldErrors);
  if (process.env.NODE_ENV === "production") {
    throw new Error("Invalid environment config");
  }
}

export const env: TEnv = parsed_env.success ?
  parsed_env.data : env_schema.parse({
    PORT: process.env.PORT,
    NODE_ENV: process.env.NODE_ENV,
    DATABASE_URL: process.env.DATABASE_URL,
    JWT_SECRET: process.env.JWT_SECRET,
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN,
  })


