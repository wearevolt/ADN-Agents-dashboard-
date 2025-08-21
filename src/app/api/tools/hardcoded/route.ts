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
  // List hardcoded tools joined with registry
  const items = await prisma.hardcodedTool.findMany({
    include: {
      registry: {
        select: { id: true, explicitCallName: true, readableName: true, toolType: true },
      },
    },
    orderBy: { id: "desc" },
  });
  return NextResponse.json(items);
});

export const POST = withAuth(async ({ request, user }) => {
  // USER and ADMIN can create hardcoded tool profile for an existing registry id
  const body = await request.json().catch(() => null) as { id?: string; notes?: string } | null;
  if (!body?.id) return NextResponse.json({ error: "missing_registry_id" }, { status: 400 });

  // Ensure registry exists and is HARD_CODED
  const reg = await prisma.toolsRegistry.findUnique({ where: { id: body.id } });
  if (!reg) return NextResponse.json({ error: "registry_not_found" }, { status: 404 });
  if (reg.toolType !== "HARD_CODED") return NextResponse.json({ error: "type_mismatch" }, { status: 400 });

  try {
    const created = await prisma.hardcodedTool.create({ data: { id: reg.id, notes: body.notes || null } });
    return NextResponse.json(created, { status: 201 });
  } catch {
    return NextResponse.json({ error: "create_failed" }, { status: 500 });
  }
});


