import { describe, expect, it } from "vitest";

import {
  createRequestContext,
  createRequestId,
} from "@/shared/http/request-context";

describe("request context", () => {
  it("preserves a safe incoming request ID", () => {
    expect(createRequestContext(" request_01.example ")).toEqual({
      requestId: "request_01.example",
    });
  });

  it.each([null, "", "contains spaces", "contains\nnewline", "a".repeat(129)])(
    "generates a request ID for an unsafe candidate: %s",
    (candidate) => {
      expect(createRequestId(candidate)).toMatch(
        /^req_[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
      );
    },
  );
});
