import { authHandler, getSessionCookie } from "@/modules/auth/http";
import { getCurrentAccount } from "@/modules/auth/service";
import { ApiError } from "@/shared/errors/api-error";
import { successResponse } from "@/shared/http/response";

export const runtime = "nodejs";

export async function GET(request: Request): Promise<Response> {
  return authHandler(request, "me", async (requestId) => {
    const account = await getCurrentAccount(await getSessionCookie());
    if (!account)
      throw new ApiError({
        code: "AUTHENTICATION_REQUIRED",
        message: "Sign in to continue",
        status: 401,
      });
    return successResponse(account, { requestId });
  });
}
