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
  const tag = searchParams.get("tag");
  const where = {
    ...(type ? { toolType: type as any } : {}),
    ...(tag ? { toolTags: { some: { tag: { name: tag } } } } : {}),
  } as any;
  const items = await prisma.toolsRegistry.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      toolTags: { include: { tag: { select: { id: true, name: true } } } },
    },
  });
  const mapped = items.map((r) => ({
    id: r.id,
    explicitCallName: r.explicitCallName,
    readableName: r.readableName,
    description: r.description || null,
    toolType: r.toolType,
    tags: r.toolTags.map((tt) => tt.tag),
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  }));
  return NextResponse.json(mapped);
});

export const POST = withAuth(async ({ request, user }) => {
  // Create registry entry; USER may only create HARD_CODED
  const body = await request.json().catch(() => null) as {
    explicit_call_name?: string;
    readable_name?: string;
    description?: string;
    tool_type?: "HARD_CODED" | "N8N" | "DUST";
    tag_ids?: string[];
  } | null;
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

  const admin = await isAdmin(user.id);
  const explicitCallName = String(body.explicit_call_name || "").trim();
  const readableName = String(body.readable_name || "").trim();
  const description = body.description ? String(body.description).trim() : null;
  let toolType = (body.tool_type as any) || "HARD_CODED";

  if (!explicitCallName || !readableName) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  if (!admin) {
    toolType = "HARD_CODED";
  }

  const tagIds = Array.isArray(body.tag_ids) ? body.tag_ids.map(String) : [];

  try {
    if (tagIds.length) {
      const existing = await prisma.tag.findMany({ where: { id: { in: tagIds } }, select: { id: true } });
      const set = new Set(existing.map((t) => t.id));
      const missing = tagIds.filter((id) => !set.has(id));
      if (missing.length) return NextResponse.json({ error: "invalid_tag_ids" }, { status: 400 });
    }
    const created = await prisma.toolsRegistry.create({
      data: {
        explicitCallName,
        readableName,
        description,
        toolType,
        toolTags: tagIds.length ? { createMany: { data: tagIds.map((id) => ({ tagId: id })) } } : undefined,
      } as any,
      select: { id: true },
    });
    return NextResponse.json(created, { status: 201 });
  } catch (e: any) {
    const msg = (e?.meta as any)?.target?.includes("explicit_call_name") ? "explicit_call_name_conflict" : "create_failed";
    const status = msg === "explicit_call_name_conflict" ? 409 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
});


