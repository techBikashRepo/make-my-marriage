import "server-only";

import { compare, hash } from "bcryptjs";
import mongoose from "mongoose";

import { sendPasswordResetEmail } from "@/integrations/email/resend";
import { connectToDatabase } from "@/integrations/mongodb/connection";
import {
  PasswordResetToken,
  Session,
  User,
  WeddingMember,
  type UserRecord,
} from "@/modules/auth/models";
import {
  createOpaqueToken,
  hashToken,
  isOpaqueToken,
} from "@/modules/auth/tokens";
import { getServerEnvironment } from "@/shared/config/env";
import { ApiError } from "@/shared/errors/api-error";
import { logger } from "@/shared/logging/logger";

export const SESSION_COOKIE = "mmm_session";
const fallbackHashes = new Map<number, Promise<string>>();

function getFallbackHash(cost: number): Promise<string> {
  let fallback = fallbackHashes.get(cost);
  if (!fallback) {
    fallback = hash("unregistered-account-fallback", cost);
    fallbackHashes.set(cost, fallback);
  }
  return fallback;
}

export type AccountSummary = Readonly<{
  user: { id: string; name: string; email: string };
  membership: {
    weddingId: string;
    memberId: string;
    role: "ADMIN" | "MANAGER";
  } | null;
}>;

function publicUser(user: UserRecord): AccountSummary["user"] {
  return { id: user._id.toString(), name: user.name, email: user.email };
}

async function createSession(
  userId: mongoose.Types.ObjectId,
): Promise<{ token: string; expiresAt: Date }> {
  const token = createOpaqueToken();
  const expiresAt = new Date(
    Date.now() + getServerEnvironment().AUTH_SESSION_DAYS * 86_400_000,
  );
  await Session.create({ userId, tokenHash: hashToken(token), expiresAt });
  return { token, expiresAt };
}

export async function signup(input: {
  name: string;
  email: string;
  password: string;
}) {
  await connectToDatabase();
  const existing = await User.exists({ emailNormalized: input.email });
  if (existing) {
    throw new ApiError({
      code: "BUSINESS_CONFLICT",
      message: "An account with this email already exists",
      status: 409,
    });
  }
  const passwordHash = await hash(
    input.password,
    getServerEnvironment().AUTH_BCRYPT_COST,
  );
  let user: UserRecord;
  try {
    user = await User.create({
      name: input.name,
      email: input.email,
      emailNormalized: input.email,
      passwordHash,
    });
  } catch (error) {
    if (
      error instanceof mongoose.mongo.MongoServerError &&
      error.code === 11000
    ) {
      throw new ApiError({
        code: "BUSINESS_CONFLICT",
        message: "An account with this email already exists",
        status: 409,
      });
    }
    throw error;
  }
  const session = await createSession(user._id);
  return {
    data: {
      user: publicUser(user),
      weddingState: "NONE" as const,
      nextActions: ["CREATE_WEDDING", "JOIN_WEDDING"] as const,
    },
    session,
  };
}

export async function login(
  input: { email: string; password: string },
  oldToken?: string,
) {
  await connectToDatabase();
  const fallbackHash = await getFallbackHash(
    getServerEnvironment().AUTH_BCRYPT_COST,
  );
  const user = await User.findOne({
    emailNormalized: input.email,
  }).lean<UserRecord>();
  // Always run a bcrypt comparison to keep unknown-email failures close to normal failures.
  const matches = await compare(
    input.password,
    user?.passwordHash ?? fallbackHash,
  );
  if (!user || !matches) {
    throw new ApiError({
      code: "INVALID_CREDENTIALS",
      message: "Invalid email or password",
      status: 401,
    });
  }
  const session = await createSession(user._id);
  if (isOpaqueToken(oldToken)) {
    await Session.deleteOne({ tokenHash: hashToken(oldToken) });
  }
  return { data: await accountSummary(user), session };
}

async function accountSummary(user: UserRecord): Promise<AccountSummary> {
  const membership = await WeddingMember.findOne({ userId: user._id }).lean<{
    _id: mongoose.Types.ObjectId;
    weddingId: mongoose.Types.ObjectId;
    role: "ADMIN" | "MANAGER";
  }>();
  return {
    user: publicUser(user),
    membership: membership
      ? {
          weddingId: membership.weddingId.toString(),
          memberId: membership._id.toString(),
          role: membership.role,
        }
      : null,
  };
}

export async function getCurrentAccount(
  token: string | undefined,
): Promise<AccountSummary | null> {
  if (!isOpaqueToken(token)) return null;
  await connectToDatabase();
  const session = await Session.findOne({
    tokenHash: hashToken(token),
    expiresAt: { $gt: new Date() },
  }).lean<{ userId: mongoose.Types.ObjectId }>();
  if (!session) return null;
  const user = await User.findById(session.userId).lean<UserRecord>();
  return user ? accountSummary(user) : null;
}

export async function logout(token: string | undefined): Promise<void> {
  if (!isOpaqueToken(token)) return;
  await connectToDatabase();
  await Session.deleteOne({ tokenHash: hashToken(token) });
}

export async function requestPasswordReset(email: string): Promise<void> {
  await connectToDatabase();
  const user = await User.findOne({
    emailNormalized: email,
  }).lean<UserRecord>();
  if (!user) return;
  let recordId: mongoose.Types.ObjectId | undefined;
  try {
    const token = createOpaqueToken();
    const expiresAt = new Date(
      Date.now() + getServerEnvironment().AUTH_RESET_MINUTES * 60_000,
    );
    const record = await PasswordResetToken.create({
      userId: user._id,
      tokenHash: hashToken(token),
      expiresAt,
    });
    recordId = record._id;
    const resetUrl = new URL(
      "/reset-password",
      getServerEnvironment().APP_BASE_URL,
    );
    resetUrl.searchParams.set("token", token);
    await sendPasswordResetEmail(user.email, resetUrl.toString());
  } catch {
    if (recordId) {
      try {
        await PasswordResetToken.deleteOne({ _id: recordId });
      } catch {
        logger.error("Failed to clean up undelivered password reset token", {
          action: "forgot-password",
        });
      }
    }
    logger.error("Password reset email could not be delivered", {
      action: "forgot-password",
    });
  }
}

export async function resetPassword(
  token: string,
  newPassword: string,
): Promise<void> {
  await connectToDatabase();
  const tokenHash = hashToken(token);
  const passwordHash = await hash(
    newPassword,
    getServerEnvironment().AUTH_BCRYPT_COST,
  );
  const dbSession = await mongoose.startSession();
  try {
    const consumed = await dbSession.withTransaction(async () => {
      const reset = await PasswordResetToken.findOneAndUpdate(
        {
          tokenHash,
          usedAt: { $exists: false },
          expiresAt: { $gt: new Date() },
        },
        { $set: { usedAt: new Date() } },
        { new: true, session: dbSession },
      );
      if (!reset) return false;
      const updated = await User.updateOne(
        { _id: reset.userId },
        { $set: { passwordHash } },
        { session: dbSession },
      );
      if (updated.matchedCount !== 1) {
        throw new Error("Password reset user disappeared during transaction");
      }
      await Session.deleteMany(
        { userId: reset.userId },
        { session: dbSession },
      );
      await PasswordResetToken.updateMany(
        { userId: reset.userId, usedAt: { $exists: false } },
        { $set: { usedAt: new Date() } },
        { session: dbSession },
      );
      return true;
    });
    if (!consumed) {
      throw new ApiError({
        code: "INVALID_RESET_TOKEN",
        message: "This reset link is invalid or expired",
        status: 400,
      });
    }
  } finally {
    await dbSession.endSession();
  }
}
