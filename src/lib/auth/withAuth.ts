import { NextResponse } from "next/server";
import { getAuthCookieFromHeaders, verifyJwtToken, type CurrentUser } from "@/lib/auth/serverAuth";

export type AuthedHandler = (ctx: { request: Request; user: CurrentUser }) => Promise<Response> | Response;

export function withAuth(handler: AuthedHandler) {
  return async (request: Request): Promise<Response> => {
    try {
      const token = getAuthCookieFromHeaders(request.headers);
      if (!token) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      const user = verifyJwtToken(token);
      return await handler({ request, user });
    } catch (err) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  };
}
