import {
  authHandler,
  getSessionCookie,
  parseBody,
  requireSameOrigin,
  setSessionCookie,
} from "@/modules/auth/http";
import { enforceAuthRequestLimits } from "@/modules/auth/rate-limit";
import { loginSchema } from "@/modules/auth/schemas";
import { login } from "@/modules/auth/service";
import { successResponse } from "@/shared/http/response";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<Response> {
  return authHandler(request, "login", async (requestId) => {
    requireSameOrigin(request);
    const input = await parseBody(request, loginSchema);
    await enforceAuthRequestLimits(request, "LOGIN", input.email);
    const result = await login(input, await getSessionCookie());
    await setSessionCookie(result.session.token, result.session.expiresAt);
    return successResponse(result.data, { requestId });
  });
}
