import {
  authHandler,
  clearSessionCookie,
  getSessionCookie,
  requireSameOrigin,
} from "@/modules/auth/http";
import { logout } from "@/modules/auth/service";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<Response> {
  return authHandler(request, "logout", async (requestId) => {
    requireSameOrigin(request);
    await logout(await getSessionCookie());
    await clearSessionCookie();
    return new Response(null, {
      status: 204,
      headers: { "x-request-id": requestId },
    });
  });
}
