import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/withAuth";
import { prisma } from "@/lib/prisma";

export const GET = withAuth(async ({ request }) => {
  const id = request.url.split("/hardcoded/")[1]?.split("/")[0];
  if (!id) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const tool = await prisma.hardcodedTool.findUnique({
    where: { id },
    include: { registry: { select: { explicitCallName: true, readableName: true, toolType: true } } },
  });
  if (!tool) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(tool);
});

export const PATCH = withAuth(async ({ request }) => {
  const id = request.url.split("/hardcoded/")[1]?.split("/")[0];
  if (!id) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const body = await request.json().catch(() => null) as { notes?: string } | null;
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  try {
    const updated = await prisma.hardcodedTool.update({ where: { id }, data: { notes: body.notes ?? null } });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "update_failed" }, { status: 500 });
  }
});

export const DELETE = withAuth(async ({ request }) => {
  const id = request.url.split("/hardcoded/")[1]?.split("/")[0];
  if (!id) return NextResponse.json({ error: "Not found" }, { status: 404 });
  try {
    // deleting registry will cascade delete hardcoded profile, but here we allow profile-only delete
    await prisma.hardcodedTool.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "delete_failed" }, { status: 500 });
  }
});


