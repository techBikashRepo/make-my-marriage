import { describe, expect, it } from "vitest";

import { ApiError } from "@/shared/errors/api-error";
import { errorResponse, successResponse } from "@/shared/http/response";

describe("API responses", () => {
  it("creates the documented success envelope", async () => {
    const response = successResponse(
      { id: "resource_01" },
      { requestId: "req_01" },
      { status: 201 },
    );

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({
      data: { id: "resource_01" },
      meta: { requestId: "req_01" },
    });
  });

  it("creates the documented error envelope", async () => {
    const response = errorResponse(
      new ApiError({
        code: "VALIDATION_ERROR",
        message: "Request validation failed",
        status: 400,
        details: [{ path: "email", message: "Invalid email" }],
      }),
      "req_02",
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "VALIDATION_ERROR",
        message: "Request validation failed",
        details: [{ path: "email", message: "Invalid email" }],
      },
      meta: { requestId: "req_02" },
    });
  });

  it("does not expose unexpected error details", async () => {
    const response = errorResponse(
      new Error("database credentials were rejected"),
      "req_03",
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "INTERNAL_ERROR",
        message: "An unexpected error occurred",
      },
      meta: { requestId: "req_03" },
    });
  });
});
