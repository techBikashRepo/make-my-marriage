import { beforeEach, describe, expect, it, vi } from "vitest";
import { hash } from "bcryptjs";

import { createOpaqueToken, hashToken } from "@/modules/auth/tokens";

const mocks = vi.hoisted(() => ({
  userExists: vi.fn(),
  userCreate: vi.fn(),
  userFindOne: vi.fn(),
  userUpdateOne: vi.fn(),
  userFindById: vi.fn(),
  sessionCreate: vi.fn(),
  sessionDeleteOne: vi.fn(),
  sessionDeleteMany: vi.fn(),
  sessionFindOne: vi.fn(),
  resetFindOneAndUpdate: vi.fn(),
  resetCreate: vi.fn(),
  resetDeleteOne: vi.fn(),
  resetUpdateMany: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
  withTransaction: vi.fn(),
  endSession: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/integrations/mongodb/connection", () => ({
  connectToDatabase: vi.fn(),
}));
vi.mock("@/integrations/email/resend", () => ({
  sendPasswordResetEmail: mocks.sendPasswordResetEmail,
}));
vi.mock("@/shared/config/env", () => ({
  getServerEnvironment: () => ({
    APP_BASE_URL: "http://localhost:3000",
    AUTH_BCRYPT_COST: 10,
    AUTH_SESSION_DAYS: 7,
    AUTH_RESET_MINUTES: 30,
  }),
}));
vi.mock("@/modules/auth/models", () => ({
  User: {
    exists: mocks.userExists,
    create: mocks.userCreate,
    findOne: mocks.userFindOne,
    updateOne: mocks.userUpdateOne,
    findById: mocks.userFindById,
  },
  Session: {
    create: mocks.sessionCreate,
    deleteOne: mocks.sessionDeleteOne,
    deleteMany: mocks.sessionDeleteMany,
    findOne: mocks.sessionFindOne,
  },
  PasswordResetToken: {
    findOneAndUpdate: mocks.resetFindOneAndUpdate,
    create: mocks.resetCreate,
    deleteOne: mocks.resetDeleteOne,
    updateMany: mocks.resetUpdateMany,
  },
  WeddingMember: { findOne: vi.fn(() => ({ lean: () => null })) },
}));
vi.mock("mongoose", () => ({
  default: {
    mongo: { MongoServerError: class MongoServerError extends Error {} },
    startSession: async () => ({
      withTransaction: mocks.withTransaction,
      endSession: mocks.endSession,
    }),
  },
}));

const userId = { toString: () => "user-1" };

beforeEach(() => {
  vi.clearAllMocks();
  mocks.userExists.mockResolvedValue(null);
  mocks.userCreate.mockImplementation(
    async (input: Record<string, unknown>) => ({ _id: userId, ...input }),
  );
  mocks.sessionCreate.mockResolvedValue({});
  mocks.sessionDeleteOne.mockResolvedValue({});
  mocks.sessionDeleteMany.mockResolvedValue({});
  mocks.resetDeleteOne.mockResolvedValue({});
  mocks.resetUpdateMany.mockResolvedValue({ modifiedCount: 1 });
  mocks.endSession.mockResolvedValue(undefined);
  mocks.withTransaction.mockImplementation(
    async (callback: () => Promise<boolean>) => callback(),
  );
});

describe("authentication service security behavior", () => {
  it("hashes passwords and persists only the hash of the cookie credential", async () => {
    const { signup } = await import("@/modules/auth/service");
    const result = await signup({
      name: "Asha",
      email: "asha@example.com",
      password: "correct horse battery",
    });
    const persistedUser = mocks.userCreate.mock.calls[0]?.[0] as {
      passwordHash: string;
    };
    const persistedSession = mocks.sessionCreate.mock.calls[0]?.[0] as {
      tokenHash: string;
      userId: unknown;
    };
    expect(persistedUser.passwordHash).not.toBe("correct horse battery");
    expect(persistedUser.passwordHash).toMatch(/^\$2[aby]\$/);
    expect(persistedSession.tokenHash).toMatch(/^[a-f0-9]{64}$/);
    expect(persistedSession.tokenHash).not.toBe(result.session.token);
    expect(result.data.user).toEqual({
      id: "user-1",
      name: "Asha",
      email: "asha@example.com",
    });
    expect(JSON.stringify(result.data)).not.toContain("passwordHash");
  });

  it("uses a generic invalid-credential response for unknown emails", async () => {
    mocks.userFindOne.mockReturnValue({ lean: async () => null });
    const { login } = await import("@/modules/auth/service");
    await expect(
      login({ email: "missing@example.com", password: "guess" }),
    ).rejects.toMatchObject({
      code: "INVALID_CREDENTIALS",
      message: "Invalid email or password",
      status: 401,
    });
    expect(mocks.sessionCreate).not.toHaveBeenCalled();
  });

  it("replaces the old session after valid login without returning credentials", async () => {
    const user = {
      _id: userId,
      name: "Asha",
      email: "asha@example.com",
      passwordHash: await hash("correct horse battery", 10),
    };
    mocks.userFindOne.mockReturnValue({ lean: async () => user });
    const oldToken = createOpaqueToken();
    const { login } = await import("@/modules/auth/service");
    const result = await login(
      { email: "asha@example.com", password: "correct horse battery" },
      oldToken,
    );
    expect(result.data).toEqual({
      user: { id: "user-1", name: "Asha", email: "asha@example.com" },
      membership: null,
    });
    expect(mocks.sessionDeleteOne).toHaveBeenCalledWith({
      tokenHash: hashToken(oldToken),
    });
    expect(JSON.stringify(result.data)).not.toContain(result.session.token);
  });

  it("does not resolve a malformed or revoked session", async () => {
    mocks.sessionFindOne.mockReturnValue({ lean: async () => null });
    const { getCurrentAccount } = await import("@/modules/auth/service");
    await expect(getCurrentAccount("malformed")).resolves.toBeNull();
    await expect(getCurrentAccount(createOpaqueToken())).resolves.toBeNull();
    expect(mocks.sessionFindOne).toHaveBeenCalledTimes(1);
    expect(mocks.userFindById).not.toHaveBeenCalled();
  });

  it("consumes all reset credentials and revokes every session after changing the hash", async () => {
    mocks.resetFindOneAndUpdate.mockResolvedValue({ userId });
    mocks.userUpdateOne.mockResolvedValue({ matchedCount: 1 });
    const { resetPassword } = await import("@/modules/auth/service");
    await resetPassword("A".repeat(43), "new correct horse battery");
    expect(mocks.resetFindOneAndUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ usedAt: { $exists: false } }),
      expect.objectContaining({ $set: { usedAt: expect.any(Date) } }),
      expect.objectContaining({ session: expect.anything() }),
    );
    expect(mocks.userUpdateOne).toHaveBeenCalledWith(
      { _id: userId },
      { $set: { passwordHash: expect.stringMatching(/^\$2[aby]\$/) } },
      expect.anything(),
    );
    expect(mocks.sessionDeleteMany).toHaveBeenCalledWith(
      { userId },
      expect.anything(),
    );
    expect(mocks.resetUpdateMany).toHaveBeenCalledWith(
      { userId, usedAt: { $exists: false } },
      { $set: { usedAt: expect.any(Date) } },
      { session: expect.anything() },
    );
    expect(mocks.endSession).toHaveBeenCalledOnce();
  });

  it("does not report success when a retried reset transaction cannot consume the token", async () => {
    mocks.resetFindOneAndUpdate
      .mockResolvedValueOnce({ userId })
      .mockResolvedValueOnce(null);
    mocks.userUpdateOne.mockResolvedValue({ matchedCount: 1 });
    mocks.withTransaction.mockImplementationOnce(
      async (callback: () => Promise<boolean>) => {
        await callback(); // Simulate an aborted first transaction attempt.
        return callback();
      },
    );
    const { resetPassword } = await import("@/modules/auth/service");
    await expect(
      resetPassword("A".repeat(43), "new correct horse battery"),
    ).rejects.toMatchObject({ code: "INVALID_RESET_TOKEN", status: 400 });
    expect(mocks.endSession).toHaveBeenCalledOnce();
  });

  it("keeps recovery generic if email delivery fails", async () => {
    mocks.userFindOne
      .mockReturnValueOnce({ lean: async () => null })
      .mockReturnValueOnce({
        lean: async () => ({ _id: userId, email: "asha@example.com" }),
      });
    mocks.resetCreate.mockResolvedValue({ _id: "reset-1" });
    mocks.sendPasswordResetEmail.mockRejectedValue(
      new Error("provider unavailable"),
    );
    const { requestPasswordReset } = await import("@/modules/auth/service");
    await expect(
      requestPasswordReset("missing@example.com"),
    ).resolves.toBeUndefined();
    await expect(
      requestPasswordReset("asha@example.com"),
    ).resolves.toBeUndefined();
    expect(mocks.resetDeleteOne).toHaveBeenCalledWith({ _id: "reset-1" });
  });
});
