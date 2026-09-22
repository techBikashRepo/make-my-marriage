import { toApiError } from "@/shared/errors/api-error";

type ResponseMeta = Readonly<{
  requestId: string;
  nextCursor?: string | null;
  hasMore?: boolean;
}>;

export function successResponse<T>(
  data: T,
  meta: ResponseMeta,
  init?: ResponseInit,
): Response {
  return Response.json({ data, meta }, init);
}

export function errorResponse(error: unknown, requestId: string): Response {
  const apiError = toApiError(error);

  return Response.json(
    {
      error: {
        code: apiError.code,
        message: apiError.message,
        ...(apiError.details ? { details: apiError.details } : {}),
      },
      meta: { requestId },
    },
    { status: apiError.status },
  );
}
