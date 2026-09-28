import { z } from "zod";

export const normalizedEmail = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email().max(254));
export const password = z
  .string()
  .min(12)
  .max(128)
  .refine((value) => Buffer.byteLength(value, "utf8") <= 72, {
    message: "Password must be at most 72 UTF-8 bytes",
  });

export const signupSchema = z.strictObject({
  name: z.string().trim().min(1).max(120),
  email: normalizedEmail,
  password,
});
export const loginSchema = z.strictObject({
  email: normalizedEmail,
  password: z.string().min(1),
});
export const forgotPasswordSchema = z.strictObject({ email: normalizedEmail });
export const resetPasswordSchema = z.strictObject({
  token: z.string().regex(/^[A-Za-z0-9_-]{43}$/),
  newPassword: password,
});
