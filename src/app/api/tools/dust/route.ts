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
    dust_workspace_sid?: string;
    dust_agent_sid?: string;
    security_key_id?: string;
    return_direct?: boolean;
    is_isolated?: boolean;
    stream_if_single_tool?: boolean;
    api_timeout_seconds?: number;
    message_events_timeout_seconds?: number;
    conversation_events_timeout_seconds?: number;
  } | null;

  if (!body?.id || !body.dust_workspace_sid || !body.dust_agent_sid || !body.security_key_id) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }

  const reg = await prisma.toolsRegistry.findUnique({ where: { id: body.id } });
  if (!reg) return NextResponse.json({ error: "registry_not_found" }, { status: 404 });
  if (reg.toolType !== "DUST") return NextResponse.json({ error: "type_mismatch" }, { status: 400 });

  try {
    const created = await prisma.dustTool.create({
      data: {
        id: reg.id,
        dustWorkspaceSid: body.dust_workspace_sid,
        dustAgentSid: body.dust_agent_sid,
        securityKeyId: body.security_key_id,
        returnDirect: !!body.return_direct,
        isIsolated: !!body.is_isolated,
        streamIfSingleTool: !!body.stream_if_single_tool,
        apiTimeoutSeconds: body.api_timeout_seconds ?? 30,
        messageEventsTimeoutSeconds: body.message_events_timeout_seconds ?? 180,
        conversationEventsTimeoutSeconds: body.conversation_events_timeout_seconds ?? 30,
      },
    });
    return NextResponse.json(created, { status: 201 });
  } catch {
    return NextResponse.json({ error: "create_failed" }, { status: 500 });
  }
});


