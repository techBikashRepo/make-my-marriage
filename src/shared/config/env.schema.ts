import { z } from "zod";

const serverEnvironmentSchema = z.object({
  APP_BASE_URL: z.url(),
  MONGODB_URI: z
    .string()
    .min(1)
    .regex(/^mongodb(?:\+srv)?:\/\//, "Must be a MongoDB connection URI"),
  MONGODB_MAX_POOL_SIZE: z.coerce.number().int().positive().max(50).default(10),
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
