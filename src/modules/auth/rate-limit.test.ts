import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ findOneAndUpdate: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/integrations/mongodb/connection", () => ({
  connectToDatabase: vi.fn(),
}));
vi.mock("@/modules/auth/models", () => ({
  RateLimitBucket: { findOneAndUpdate: mocks.findOneAndUpdate },
}));

beforeEach(() => vi.clearAllMocks());

describe("authentication rate limits", () => {
  it("blocks excessive requests using only hashed identifiers", async () => {
    mocks.findOneAndUpdate.mockResolvedValue({ count: 11 });
    const { enforceAuthRateLimit } = await import("@/modules/auth/rate-limit");
    await expect(
      enforceAuthRateLimit("LOGIN", "user@example.com"),
    ).rejects.toMatchObject({ code: "RATE_LIMITED", status: 429 });
    const filter = mocks.findOneAndUpdate.mock.calls[0]?.[0] as {
      bucketKeyHash: string;
    };
    expect(filter.bucketKeyHash).toMatch(/^[a-f0-9]{64}$/);
    expect(JSON.stringify(filter)).not.toContain("user@example.com");
  });

  it("counts a concurrent first-request insert race", async () => {
    mocks.findOneAndUpdate
      .mockRejectedValueOnce(
        Object.assign(new Error("duplicate"), { code: 11000 }),
      )
      .mockResolvedValueOnce({ count: 1 });
    const { enforceAuthRateLimit } = await import("@/modules/auth/rate-limit");
    await expect(
      enforceAuthRateLimit("SIGNUP", "new@example.com"),
    ).resolves.toBeUndefined();
    expect(mocks.findOneAndUpdate).toHaveBeenCalledTimes(2);
    expect(mocks.findOneAndUpdate.mock.calls[1]?.[2]).toMatchObject({
      new: true,
      lean: true,
    });
  });
});
