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

export const POST = withAuth(async ({ request, user }) => {
  if (!(await isAdmin(user.id))) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const body = await request.json().catch(() => null) as {
    id?: string;
    external_url?: string;
    security_key_id?: string;
    return_direct?: boolean;
    is_isolated?: boolean;
    stream_if_single_tool?: boolean;
    flash_answer_needed?: boolean;
    timeout_seconds?: number;
  } | null;
  if (!body?.id || !body.external_url || !body.security_key_id) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }

  const reg = await prisma.toolsRegistry.findUnique({ where: { id: body.id } });
  if (!reg) return NextResponse.json({ error: "registry_not_found" }, { status: 404 });
  if (reg.toolType !== "N8N") return NextResponse.json({ error: "type_mismatch" }, { status: 400 });

  try {
    const created = await prisma.n8NTool.create({
      data: {
        id: reg.id,
        externalUrl: body.external_url,
        securityKeyId: body.security_key_id,
        returnDirect: !!body.return_direct,
        isIsolated: !!body.is_isolated,
        streamIfSingleTool: !!body.stream_if_single_tool,
        flashAnswerNeeded: !!body.flash_answer_needed,
        timeoutSeconds: body.timeout_seconds ?? 30,
      },
    });
    return NextResponse.json(created, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: "create_failed" }, { status: 500 });
  }
});


