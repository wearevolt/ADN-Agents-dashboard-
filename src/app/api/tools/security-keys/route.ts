import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/withAuth";
import { prisma } from "@/lib/prisma";

async function isAdmin(userId: string): Promise<boolean> {
  const match = await prisma.userRole.findFirst({
    where: { userId, role: { name: "ADMIN" } },
    select: { id: true },
  });
  return !!match;
}

const MAIN_USERINFO_URL = process.env.MAIN_USERINFO_URL;

async function resolveCanonicalUserId(request: Request, userId: string): Promise<string> {
  if (!MAIN_USERINFO_URL) return userId;
  try {
    const cookieHeader = request.headers.get("cookie") || "";
    const body = JSON.stringify({ query: "query Me { me { id } }", variables: {} });
    const upstream = await fetch(MAIN_USERINFO_URL, {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json", cookie: cookieHeader },
      body,
    });
    if (!upstream.ok) return userId;
    const json = (await upstream.json()) as any;
    const me = json?.data?.me;
    return me?.id ? String(me.id) : userId;
  } catch {
    return userId;
  }
}

export const GET = withAuth(async ({ request, user }) => {
  // Only ADMINs can list security keys. Accept ADMIN either from JWT roles or DB mapping
  const isAdminByJwt = Array.isArray(user.roles) && user.roles.includes("ADMIN");
  let allowed = isAdminByJwt;
  if (!allowed) {
    const canonicalId = await resolveCanonicalUserId(request, user.id);
    allowed = await isAdmin(canonicalId);
  }
  if (!allowed) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const keys = await prisma.securityKey.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, systemName: true, description: true },
  });
  return NextResponse.json(
    keys.map((k) => ({ id: k.id, system_name: k.systemName, description: k.description }))
  );
});

export const POST = withAuth(async ({ request, user }) => {
  // Only ADMIN can create
  if (!(await isAdmin(user.id))) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const body = await request.json().catch(() => null) as { system_name?: string; description?: string } | null;
  if (!body?.system_name) return NextResponse.json({ error: "missing_system_name" }, { status: 400 });
  try {
    const created = await prisma.securityKey.create({
      data: { systemName: body.system_name.trim(), description: body.description || null, createdByUserId: user.id },
      select: { id: true },
    });
    return NextResponse.json(created, { status: 201 });
  } catch (e: any) {
    const isUnique = (e?.meta as any)?.target?.includes("system_name");
    return NextResponse.json({ error: isUnique ? "system_name_conflict" : "create_failed" }, { status: isUnique ? 409 : 500 });
  }
});


