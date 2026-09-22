import { describe, expect, it } from "vitest";

import { parseServerEnvironment } from "@/shared/config/env.schema";

describe("parseServerEnvironment", () => {
  it("parses valid server configuration and applies safe defaults", () => {
    const environment = parseServerEnvironment({
      APP_BASE_URL: "http://localhost:3000",
      MONGODB_URI: "mongodb://localhost:27017/make-my-marriage-test",
    });

    expect(environment).toEqual({
      APP_BASE_URL: "http://localhost:3000",
      MONGODB_URI: "mongodb://localhost:27017/make-my-marriage-test",
      MONGODB_MAX_POOL_SIZE: 10,
    });
  });

  it("rejects missing required server configuration", () => {
    expect(() => parseServerEnvironment({})).toThrow(
      "Invalid server environment configuration",
    );
  });
});
