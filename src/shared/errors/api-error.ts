export type ApiErrorDetails = ReadonlyArray<{
  path?: string;
  message: string;
}>;

export class ApiError extends Error {
  readonly code: string;
  readonly status: number;
  readonly details: ApiErrorDetails | undefined;

  constructor(options: {
    code: string;
    message: string;
    status: number;
    details?: ApiErrorDetails;
    cause?: unknown;
  }) {
    super(options.message, { cause: options.cause });
    this.name = "ApiError";
    this.code = options.code;
    this.status = options.status;
    this.details = options.details;
  }
}

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) {
    return error;
  }

  return new ApiError({
    code: "INTERNAL_ERROR",
    message: "An unexpected error occurred",
    status: 500,
    cause: error,
  });
}
