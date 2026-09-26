import { z } from "zod";

const serverEnvironmentSchema = z.object({
  APP_BASE_URL: z.url(),
  MONGODB_URI: z
    .string()
    .min(1)
    .regex(/^mongodb(?:\+srv)?:\/\//, "Must be a MongoDB connection URI"),
  MONGODB_MAX_POOL_SIZE: z.coerce.number().int().positive().max(50).default(10),
  AUTH_BCRYPT_COST: z.coerce.number().int().min(10).max(15).default(12),
  AUTH_SESSION_DAYS: z.coerce.number().int().min(1).max(30).default(7),
  AUTH_RESET_MINUTES: z.coerce.number().int().min(5).max(120).default(30),
  RESEND_API_KEY: z.string().min(1).optional(),
  EMAIL_FROM: z.email().optional(),
});

export type ServerEnvironment = z.infer<typeof serverEnvironmentSchema>;

export function parseServerEnvironment(
  environment: Record<string, string | undefined>,
): ServerEnvironment {
  const result = serverEnvironmentSchema.safeParse(environment);

  if (!result.success) {
    const fields = result.error.issues
      .map((issue) => issue.path.join(".") || "environment")
      .join(", ");

    throw new Error(`Invalid server environment configuration: ${fields}`);
  }

  return result.data;
}
