import { describe, expect, it, vi } from "vitest";

import {
  forgotPasswordSchema,
  loginSchema,
  resetPasswordSchema,
  signupSchema,
} from "@/modules/auth/schemas";
import {
  createOpaqueToken,
  hashToken,
  isOpaqueToken,
} from "@/modules/auth/tokens";

const cookieSet = vi.hoisted(() => vi.fn());

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({ cookies: async () => ({ set: cookieSet }) }));
vi.mock("@/modules/auth/service", () => ({ SESSION_COOKIE: "mmm_session" }));
vi.mock("@/shared/config/env", () => ({
  getServerEnvironment: () => ({ APP_BASE_URL: "http://localhost:3000" }),
}));

describe("authentication input boundaries", () => {
  it("normalizes signup email and rejects unexpected fields or weak passwords", () => {
    expect(
      signupSchema.parse({
        name: "  Asha  ",
        email: " ASHA@Example.COM ",
        password: "correct horse battery",
      }),
    ).toMatchObject({ name: "Asha", email: "asha@example.com" });
    expect(
      signupSchema.safeParse({
        name: "Asha",
        email: "asha@example.com",
        password: "short",
      }).success,
    ).toBe(false);
    expect(
      signupSchema.safeParse({
        name: "Asha",
        email: "asha@example.com",
        password: "correct horse battery",
        role: "ADMIN",
      }).success,
    ).toBe(false);
  });

  it("keeps login failure possible for any nonempty password", () => {
    expect(
      loginSchema.safeParse({ email: "unknown@example.com", password: "x" })
        .success,
    ).toBe(true);
    expect(
      forgotPasswordSchema.parse({ email: "  User@Example.Com " }),
    ).toEqual({ email: "user@example.com" });
  });

  it("rejects passwords bcrypt would silently truncate on signup and reset", () => {
    const exactLimit = "a".repeat(72);
    const overLimit = `${exactLimit}b`;
    const multibyteOverLimit = `${"é".repeat(36)}a`;
    expect(
      signupSchema.safeParse({
        name: "Asha",
        email: "asha@example.com",
        password: exactLimit,
      }).success,
    ).toBe(true);
    for (const value of [overLimit, multibyteOverLimit]) {
      expect(
        signupSchema.safeParse({
          name: "Asha",
          email: "asha@example.com",
          password: value,
        }).success,
      ).toBe(false);
      expect(
        resetPasswordSchema.safeParse({
          token: createOpaqueToken(),
          newPassword: value,
        }).success,
      ).toBe(false);
      // Existing accounts may have passwords created before the byte limit.
      expect(
        loginSchema.safeParse({ email: "asha@example.com", password: value })
          .success,
      ).toBe(true);
    }
  });

  it("accepts only a complete opaque reset token", () => {
    expect(
      resetPasswordSchema.safeParse({
        token: "short",
        newPassword: "correct horse battery",
      }).success,
    ).toBe(false);
    expect(
      resetPasswordSchema.safeParse({
        token: createOpaqueToken(),
        newPassword: "correct horse battery",
      }).success,
    ).toBe(true);
  });
});

describe("opaque credentials", () => {
  it("generates independent 256-bit tokens and stores a fixed hash", () => {
    const first = createOpaqueToken();
    const second = createOpaqueToken();
    expect(isOpaqueToken(first)).toBe(true);
    expect(first).not.toBe(second);
    expect(hashToken(first)).toMatch(/^[a-f0-9]{64}$/);
    expect(hashToken(first)).not.toBe(first);
    expect(isOpaqueToken("malformed-token")).toBe(false);
  });
});

describe("authentication HTTP boundary", () => {
  it("keeps session credentials inaccessible to scripts", async () => {
    const { setSessionCookie } = await import("@/modules/auth/http");
    const expiresAt = new Date("2027-01-01T00:00:00.000Z");
    await setSessionCookie("secret", expiresAt);
    expect(cookieSet).toHaveBeenCalledWith(
      "mmm_session",
      "secret",
      expect.objectContaining({
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        expires: expiresAt,
      }),
    );
  });

  it("rejects cross-origin mutations and accepts same-origin requests", async () => {
    const { requireSameOrigin } = await import("@/modules/auth/http");
    expect(() =>
      requireSameOrigin(
        new Request("http://localhost:3000/api/v1/auth/login", {
          headers: { origin: "https://evil.example" },
        }),
      ),
    ).toThrow("Request origin is not allowed");
    expect(() =>
      requireSameOrigin(
        new Request("http://localhost:3000/api/v1/auth/login", {
          headers: { origin: "http://localhost:3000" },
        }),
      ),
    ).not.toThrow();
    expect(() =>
      requireSameOrigin(
        new Request("http://localhost:3100/api/v1/auth/login", {
          headers: { origin: "http://localhost:3100" },
        }),
      ),
    ).not.toThrow();
    expect(() =>
      requireSameOrigin(
        new Request("http://localhost:3100/api/v1/auth/login", {
          headers: { referer: "http://localhost:3100/login" },
        }),
      ),
    ).not.toThrow();
    expect(() =>
      requireSameOrigin(
        new Request("http://localhost:3100/api/v1/auth/login", {
          headers: { origin: "http://localhost:3000" },
        }),
      ),
    ).toThrow("Request origin is not allowed");
    expect(() =>
      requireSameOrigin(new Request("http://localhost:3000/api/v1/auth/login")),
    ).toThrow();
  });

  it("returns validation details without accepting injected fields", async () => {
    const { parseBody } = await import("@/modules/auth/http");
    const request = new Request("http://localhost:3000/api/v1/auth/signup", {
      method: "POST",
      body: JSON.stringify({
        name: "Asha",
        email: "asha@example.com",
        password: "correct horse battery",
        admin: true,
      }),
    });
    await expect(parseBody(request, signupSchema)).rejects.toMatchObject({
      code: "VALIDATION_ERROR",
      status: 400,
    });
  });
});
