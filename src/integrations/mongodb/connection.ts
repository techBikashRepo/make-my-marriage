import "server-only";

import mongoose from "mongoose";

import { getServerEnvironment } from "@/shared/config/env";

type MongooseCache = {
  connection: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

const globalWithMongoose = globalThis as typeof globalThis & {
  __makeMyMarriageMongoose?: MongooseCache;
};

const cache = globalWithMongoose.__makeMyMarriageMongoose ?? {
  connection: null,
  promise: null,
};

globalWithMongoose.__makeMyMarriageMongoose = cache;

function hasActiveConnection(connection: typeof mongoose | null): boolean {
  return connection?.connection.readyState === 1;
}

export async function connectToDatabase(): Promise<typeof mongoose> {
  if (hasActiveConnection(cache.connection)) {
    return cache.connection as typeof mongoose;
  }

  if (cache.connection) {
    cache.connection = null;
    cache.promise = null;
  }

  if (!cache.promise) {
    const environment = getServerEnvironment();

    cache.promise = mongoose
      .connect(environment.MONGODB_URI, {
        bufferCommands: false,
        maxPoolSize: environment.MONGODB_MAX_POOL_SIZE,
      })
      .catch((error: unknown) => {
        cache.connection = null;
        cache.promise = null;
        throw error;
      });
  }

  const connection = await cache.promise;

  if (!hasActiveConnection(connection)) {
    cache.connection = null;
    cache.promise = null;
    throw new Error("MongoDB connection did not reach the connected state");
  }

  cache.connection = connection;
  return connection;
}
