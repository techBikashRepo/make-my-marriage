import { authHandler, parseBody, requireSameOrigin } from "@/modules/auth/http";
import { enforceAuthRequestLimits } from "@/modules/auth/rate-limit";
import { resetPasswordSchema } from "@/modules/auth/schemas";
import { resetPassword } from "@/modules/auth/service";
import { successResponse } from "@/shared/http/response";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<Response> {
  return authHandler(request, "reset-password", async (requestId) => {
    requireSameOrigin(request);
    const { token, newPassword } = await parseBody(
      request,
      resetPasswordSchema,
    );
    await enforceAuthRequestLimits(request, "RESET_PASSWORD", token);
    await resetPassword(token, newPassword);
    return successResponse({ reset: true }, { requestId });
  });
}
