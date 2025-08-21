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
  // List tools registry with optional type filter
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const where = type ? { toolType: type as any } : undefined;
  const items = await prisma.toolsRegistry.findMany({
    where,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      explicitCallName: true,
      readableName: true,
      toolType: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  return NextResponse.json(items);
});

export const POST = withAuth(async ({ request, user }) => {
  // Create registry entry; USER may only create HARD_CODED
  const body = await request.json().catch(() => null) as {
    explicit_call_name?: string;
    readable_name?: string;
    tool_type?: "HARD_CODED" | "N8N" | "DUST";
  } | null;
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

  const admin = await isAdmin(user.id);
  const explicitCallName = String(body.explicit_call_name || "").trim();
  const readableName = String(body.readable_name || "").trim();
  let toolType = (body.tool_type as any) || "HARD_CODED";

  if (!explicitCallName || !readableName) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  if (!admin) {
    toolType = "HARD_CODED";
  }

  try {
    const created = await prisma.toolsRegistry.create({
      data: {
        explicitCallName,
        readableName,
        toolType,
      },
      select: { id: true },
    });
    return NextResponse.json(created, { status: 201 });
  } catch (e: any) {
    const msg = (e?.meta as any)?.target?.includes("explicit_call_name") ? "explicit_call_name_conflict" : "create_failed";
    const status = msg === "explicit_call_name_conflict" ? 409 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
});


