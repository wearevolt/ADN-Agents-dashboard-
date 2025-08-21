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

export const PATCH = withAuth(async ({ request, user }) => {
  if (!(await isAdmin(user.id))) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const id = request.url.split("/security-keys/")[1]?.split("/")[0];
  if (!id) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const body = await request.json().catch(() => null) as { description?: string } | null;
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  try {
    const updated = await prisma.securityKey.update({ where: { id }, data: { description: body.description ?? null } });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "update_failed" }, { status: 500 });
  }
});

export const DELETE = withAuth(async ({ request, user }) => {
  if (!(await isAdmin(user.id))) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const id = request.url.split("/security-keys/")[1]?.split("/")[0];
  if (!id) return NextResponse.json({ error: "Not found" }, { status: 404 });
  try {
    await prisma.securityKey.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "delete_failed" }, { status: 500 });
  }
});


