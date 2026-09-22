const SAFE_REQUEST_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;

export type RequestContext = Readonly<{
  requestId: string;
}>;

export function createRequestId(candidate?: string | null): string {
  const normalizedCandidate = candidate?.trim();

  if (normalizedCandidate && SAFE_REQUEST_ID.test(normalizedCandidate)) {
    return normalizedCandidate;
  }

  return `req_${crypto.randomUUID()}`;
}

export function createRequestContext(
  candidate?: string | null,
): RequestContext {
  return { requestId: createRequestId(candidate) };
}
