import "server-only";

import { cookies } from "next/headers";
import { z } from "zod";

import { SESSION_COOKIE } from "@/modules/auth/service";
import { ApiError } from "@/shared/errors/api-error";
import { createRequestContext } from "@/shared/http/request-context";
import { errorResponse } from "@/shared/http/response";
import { logger } from "@/shared/logging/logger";

export async function parseBody<T>(
  request: Request,
  schema: z.ZodType<T>,
): Promise<T> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    throw new ApiError({
      code: "VALIDATION_ERROR",
      message: "Request validation failed",
      status: 400,
    });
  }
  const result = schema.safeParse(body);
  if (!result.success) {
    throw new ApiError({
      code: "VALIDATION_ERROR",
      message: "Request validation failed",
      status: 400,
      details: result.error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      })),
    });
  }
  return result.data;
}

export function requireSameOrigin(request: Request): void {
  const expected = new URL(request.url).origin;
  const source =
    request.headers.get("origin") ?? request.headers.get("referer");
  let sourceOrigin: string | undefined;
  try {
    if (source) sourceOrigin = new URL(source).origin;
  } catch {
    // Invalid origin values are rejected below.
  }
  if (sourceOrigin !== expected) {
    throw new ApiError({
      code: "FORBIDDEN",
      message: "Request origin is not allowed",
      status: 403,
    });
  }
}

export async function getSessionCookie(): Promise<string | undefined> {
  return (await cookies()).get(SESSION_COOKIE)?.value;
}

export async function setSessionCookie(
  token: string,
  expiresAt: Date,
): Promise<void> {
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function clearSessionCookie(): Promise<void> {
  (await cookies()).set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(0),
  });
}

export async function authHandler(
  request: Request,
  action: string,
  run: (requestId: string) => Promise<Response>,
): Promise<Response> {
  const { requestId } = createRequestContext(
    request.headers.get("x-request-id"),
  );
  const started = Date.now();
  try {
    const response = await run(requestId);
    logger.info("Authentication request completed", {
      requestId,
      action,
      status: response.status,
      durationMs: Date.now() - started,
    });
    return response;
  } catch (error) {
    const response = errorResponse(error, requestId);
    logger.warn("Authentication request failed", {
      requestId,
      action,
      status: response.status,
      durationMs: Date.now() - started,
    });
    return response;
  }
}
