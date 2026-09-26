import "server-only";

import { RateLimitBucket } from "@/modules/auth/models";
import { hashToken } from "@/modules/auth/tokens";
import { connectToDatabase } from "@/integrations/mongodb/connection";
import { ApiError } from "@/shared/errors/api-error";

type Action = "SIGNUP" | "LOGIN" | "FORGOT_PASSWORD" | "RESET_PASSWORD";

const limits: Record<Action, number> = {
  SIGNUP: 5,
  LOGIN: 10,
  FORGOT_PASSWORD: 5,
  RESET_PASSWORD: 10,
};

export async function enforceAuthRateLimit(
  action: Action,
  identifier: string,
): Promise<void> {
  await connectToDatabase();
  const windowMs = 15 * 60 * 1000;
  const now = Date.now();
  const windowStart = new Date(Math.floor(now / windowMs) * windowMs);
  const bucketKeyHash = hashToken(identifier);
  const filter = { bucketKeyHash, action, windowStart };
  const update = {
    $inc: { count: 1 },
    $setOnInsert: { expiresAt: new Date(windowStart.getTime() + windowMs * 2) },
  };
  let result;
  try {
    result = await RateLimitBucket.findOneAndUpdate(filter, update, {
      upsert: true,
      new: true,
      lean: true,
    });
  } catch (error) {
    // Two requests can race to create the same window. The unique index picks a winner.
    if (!(error instanceof Error && "code" in error && error.code === 11000))
      throw error;
    result = await RateLimitBucket.findOneAndUpdate(
      filter,
      { $inc: { count: 1 } },
      { new: true, lean: true },
    );
  }

  if (!result) throw new Error("Rate limit bucket was not created");
  if (result.count > limits[action]) {
    throw new ApiError({
      code: "RATE_LIMITED",
      message: "Too many requests. Try again later.",
      status: 429,
    });
  }
}

export async function enforceAuthRequestLimits(
  request: Request,
  action: Action,
  identifier: string,
): Promise<void> {
  await enforceAuthRateLimit(action, `credential:${identifier}`);
  const forwarded = request.headers
    .get("x-forwarded-for")
    ?.split(",")[0]
    ?.trim();
  const ip = forwarded || request.headers.get("x-real-ip");
  if (ip) await enforceAuthRateLimit(action, `network:${ip}`);
}
