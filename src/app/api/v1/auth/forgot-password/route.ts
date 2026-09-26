import { authHandler, parseBody, requireSameOrigin } from "@/modules/auth/http";
import { enforceAuthRequestLimits } from "@/modules/auth/rate-limit";
import { forgotPasswordSchema } from "@/modules/auth/schemas";
import { requestPasswordReset } from "@/modules/auth/service";
import { successResponse } from "@/shared/http/response";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<Response> {
  return authHandler(request, "forgot-password", async (requestId) => {
    requireSameOrigin(request);
    const { email } = await parseBody(request, forgotPasswordSchema);
    await enforceAuthRequestLimits(request, "FORGOT_PASSWORD", email);
    await requestPasswordReset(email);
    return successResponse({ accepted: true }, { requestId });
  });
}
