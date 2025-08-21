import { NextResponse } from "next/server";
import { getAuthCookieFromHeaders, verifyJwtToken } from "@/lib/auth/serverAuth";

const MAIN_USERINFO_URL = process.env.MAIN_USERINFO_URL; // optional: main backend GraphQL endpoint
const AUTH_DEBUG = String(process.env.AUTH_DEBUG || "").toLowerCase() === "true" || process.env.AUTH_DEBUG === "1";

export async function GET(request: Request) {
  try {
    const token = getAuthCookieFromHeaders(request.headers);
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = verifyJwtToken(token);

    // Optional upstream validation (moneyball-style): call GraphQL `me`
    let meId: string | undefined;
    let meEmail: string | undefined;
    if (MAIN_USERINFO_URL) {
      const cookieHeader = request.headers.get("cookie") || "";
      const body = JSON.stringify({
        query: "query Me { me { id email } }",
        variables: {},
      });
      if (AUTH_DEBUG) {
        console.log("[auth] upstream me URL:", MAIN_USERINFO_URL);
        console.log("[auth] upstream me request body:", body);
      }
      const upstream = await fetch(MAIN_USERINFO_URL, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          accept: "application/json",
          cookie: cookieHeader,
        },
        body,
      });
      if (AUTH_DEBUG) {
        console.log("[auth] upstream me status:", upstream.status);
      }
      if (!upstream.ok) {
        if (AUTH_DEBUG) {
          try {
            const text = await upstream.text();
            console.log("[auth] upstream me error response:", text);
          } catch (e) {
            console.log("[auth] upstream me error: failed to read body");
          }
        }
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      let json: any = null;
      try {
        json = await upstream.json();
        if (AUTH_DEBUG) {
          console.log("[auth] upstream me response JSON:", json);
        }
      } catch (e) {
        if (AUTH_DEBUG) {
          console.log("[auth] upstream me: failed to parse JSON");
        }
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      const me = json?.data?.me;
      if (!me) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      meId = me?.id as string | undefined;
      meEmail = me?.email as string | undefined;
    }

    return NextResponse.json({
      id: meId || user.id,
      email: meEmail || user.email,
      active: true,
      roles: user.roles ?? [],
      tenantId: user.tenantId ?? null,
    });
  } catch (err) {
    if (AUTH_DEBUG) {
      console.log("[auth] GET /api/auth/user error:", (err as Error)?.message || err);
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
