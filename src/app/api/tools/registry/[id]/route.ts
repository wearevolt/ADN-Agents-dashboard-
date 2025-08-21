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

export const GET = withAuth(async ({ request }) => {
  const id = request.url.split("/registry/")[1]?.split("/")[0];
  if (!id) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const item = await prisma.toolsRegistry.findUnique({
    where: { id },
    select: {
      id: true,
      explicitCallName: true,
      readableName: true,
      toolType: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(item);
});

export const PATCH = withAuth(async ({ request, user }) => {
  const id = request.url.split("/registry/")[1]?.split("/")[0];
  if (!id) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const body = await request.json().catch(() => null) as {
    explicit_call_name?: string;
    readable_name?: string;
    // tool_type changes are not allowed in MVP
  } | null;
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

  // tool_type change is forbidden in MVP
  if ((body as any).tool_type) {
    return NextResponse.json({ error: "tool_type_change_forbidden" }, { status: 400 });
  }

  // Both ADMIN and USER can edit Hardcoded-only related fields on registry (name/label)
  try {
    const updated = await prisma.toolsRegistry.update({
      where: { id },
      data: {
        explicitCallName: body.explicit_call_name?.trim() || undefined,
        readableName: body.readable_name?.trim() || undefined,
      },
      select: { id: true },
    });
    return NextResponse.json(updated);
  } catch (e: any) {
    const msg = (e?.meta as any)?.target?.includes("explicit_call_name") ? "explicit_call_name_conflict" : "update_failed";
    const status = msg === "explicit_call_name_conflict" ? 409 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
});

export const DELETE = withAuth(async ({ request, user }) => {
  const id = request.url.split("/registry/")[1]?.split("/")[0];
  if (!id) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const admin = await isAdmin(user.id);
  if (!admin) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  try {
    await prisma.toolsRegistry.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "delete_failed" }, { status: 500 });
  }
});


