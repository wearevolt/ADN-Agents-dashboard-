import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/withAuth";
import { prisma } from "@/lib/prisma";

const MAIN_USERINFO_URL = process.env.MAIN_USERINFO_URL;
const AUTH_DEBUG = String(process.env.AUTH_DEBUG || "").toLowerCase() === "true" || process.env.AUTH_DEBUG === "1";

export const GET = withAuth(async ({ request, user }) => {
  // Resolve canonical userId: prefer upstream me.id when available
  let canonicalUserId: string = user.id;
  if (MAIN_USERINFO_URL) {
    try {
      const cookieHeader = request.headers.get("cookie") || "";
      const body = JSON.stringify({ query: "query Me { me { id email } }", variables: {} });
      const upstream = await fetch(MAIN_USERINFO_URL, {
        method: "POST",
        headers: { "content-type": "application/json", accept: "application/json", cookie: cookieHeader },
        body,
      });
      if (upstream.ok) {
        const json = (await upstream.json()) as any;
        const me = json?.data?.me;
        if (me?.id) canonicalUserId = String(me.id);
      } else if (AUTH_DEBUG) {
        console.log("[auth] roles: upstream me not ok, status:", upstream.status);
      }
    } catch (e) {
      if (AUTH_DEBUG) console.log("[auth] roles: upstream me failed", (e as Error)?.message || e);
    }
  }

  const roles = await prisma.userRole.findMany({
    where: { userId: canonicalUserId },
    include: { role: true },
  });

  const roleNames = roles.map((r) => r.role.name);
  const effective = roleNames.length > 0 ? roleNames : ["USER"]; // Default to USER for MVP

  return NextResponse.json({ roles: effective, userId: canonicalUserId });
});


