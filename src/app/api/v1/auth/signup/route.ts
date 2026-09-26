import { enforceAuthRequestLimits } from "@/modules/auth/rate-limit";
import {
  authHandler,
  parseBody,
  requireSameOrigin,
  setSessionCookie,
} from "@/modules/auth/http";
import { signupSchema } from "@/modules/auth/schemas";
import { signup } from "@/modules/auth/service";
import { successResponse } from "@/shared/http/response";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<Response> {
  return authHandler(request, "signup", async (requestId) => {
    requireSameOrigin(request);
    const input = await parseBody(request, signupSchema);
    await enforceAuthRequestLimits(request, "SIGNUP", input.email);
    const result = await signup(input);
    await setSessionCookie(result.session.token, result.session.expiresAt);
    return successResponse(result.data, { requestId }, { status: 201 });
  });
}
