import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const state = { readyState: 0 };
  const connect = vi.fn();
  const mongoose = {
    connection: {
      get readyState() {
        return state.readyState;
      },
    },
    connect,
  };

  return { connect, mongoose, state };
});

vi.mock("server-only", () => ({}));
vi.mock("mongoose", () => ({ default: mocks.mongoose }));
vi.mock("@/shared/config/env", () => ({
  getServerEnvironment: () => ({
    APP_BASE_URL: "http://localhost:3000",
    MONGODB_URI: "mongodb://localhost:27017/make-my-marriage-test",
    MONGODB_MAX_POOL_SIZE: 10,
  }),
}));

type TestMongooseGlobal = typeof globalThis & {
  __makeMyMarriageMongoose?: unknown;
};

beforeEach(() => {
  delete (globalThis as TestMongooseGlobal).__makeMyMarriageMongoose;
  mocks.connect.mockReset();
  mocks.state.readyState = 0;
  vi.resetModules();
});

describe("connectToDatabase", () => {
  it("shares one connection attempt across concurrent callers", async () => {
    mocks.connect.mockImplementation(async () => {
      mocks.state.readyState = 1;
      return mocks.mongoose;
    });

    const { connectToDatabase } =
      await import("@/integrations/mongodb/connection");
    const [firstConnection, secondConnection] = await Promise.all([
      connectToDatabase(),
      connectToDatabase(),
    ]);

    expect(mocks.connect).toHaveBeenCalledOnce();
    expect(firstConnection).toBe(secondConnection);
  });

  it("returns an active cached connection without reconnecting", async () => {
    mocks.connect.mockImplementation(async () => {
      mocks.state.readyState = 1;
      return mocks.mongoose;
    });

    const { connectToDatabase } =
      await import("@/integrations/mongodb/connection");

    await connectToDatabase();
    await connectToDatabase();

    expect(mocks.connect).toHaveBeenCalledOnce();
  });

  it("retries after a failed connection attempt", async () => {
    mocks.connect
      .mockRejectedValueOnce(new Error("connection failed"))
      .mockImplementationOnce(async () => {
        mocks.state.readyState = 1;
        return mocks.mongoose;
      });

    const { connectToDatabase } =
      await import("@/integrations/mongodb/connection");

    await expect(connectToDatabase()).rejects.toThrow("connection failed");
    await expect(connectToDatabase()).resolves.toBe(mocks.mongoose);
    expect(mocks.connect).toHaveBeenCalledTimes(2);
  });

  it("reconnects instead of returning a stale cached connection", async () => {
    mocks.connect.mockImplementation(async () => {
      mocks.state.readyState = 1;
      return mocks.mongoose;
    });

    const { connectToDatabase } =
      await import("@/integrations/mongodb/connection");

    await connectToDatabase();
    mocks.state.readyState = 0;
    await connectToDatabase();

    expect(mocks.connect).toHaveBeenCalledTimes(2);
  });

  it("rejects a connection attempt that never reaches connected state", async () => {
    mocks.connect.mockResolvedValue(mocks.mongoose);

    const { connectToDatabase } =
      await import("@/integrations/mongodb/connection");

    await expect(connectToDatabase()).rejects.toThrow(
      "MongoDB connection did not reach the connected state",
    );
  });
});
