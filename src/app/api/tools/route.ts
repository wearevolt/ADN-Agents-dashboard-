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

// Unified create: creates tools_registry and corresponding profile in one transaction
export const POST = withAuth(async ({ request, user }) => {
  const body = await request.json().catch(() => null) as
    | {
      explicit_call_name?: string;
      readable_name?: string;
      tool_type?: "HARD_CODED" | "N8N" | "DUST";
      tag_ids?: string[];
      profile?: Record<string, unknown>;
    }
    | null;
  if (!body) return NextResponse.json({ error: "invalid_json" }, { status: 400 });

  const explicitCallName = String(body.explicit_call_name || "").trim();
  const readableName = String(body.readable_name || "").trim();
  let toolType = (body.tool_type as any) || "HARD_CODED";
  const profile = (body.profile || {}) as Record<string, any>;
  const tagIds = Array.isArray(body.tag_ids) ? body.tag_ids.map(String) : [];

  if (!explicitCallName || !readableName) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }

  const admin = await isAdmin(user.id);
  if (!admin) {
    toolType = "HARD_CODED";
  }

  // Basic validations per type
  if (toolType === "N8N") {
    if (!admin) return NextResponse.json({ error: "forbidden" }, { status: 403 });
    if (!profile.external_url || !profile.security_key_id) {
      return NextResponse.json({ error: "missing_profile_fields" }, { status: 400 });
    }
  } else if (toolType === "DUST") {
    if (!admin) return NextResponse.json({ error: "forbidden" }, { status: 403 });
    if (!profile.dust_workspace_sid || !profile.dust_agent_sid || !profile.security_key_id) {
      return NextResponse.json({ error: "missing_profile_fields" }, { status: 400 });
    }
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Validate tag IDs if provided
      if (tagIds.length > 0) {
        const existing = await tx.tag.findMany({ where: { id: { in: tagIds } }, select: { id: true } });
        const existingIds = new Set(existing.map((t) => t.id));
        const missing = tagIds.filter((id) => !existingIds.has(id));
        if (missing.length > 0) {
          throw Object.assign(new Error("invalid_tag_ids"), { code: "INVALID_TAGS" });
        }
      }
      const reg = await tx.toolsRegistry.create({
        data: {
          explicitCallName,
          readableName,
          toolType,
          toolTags: tagIds.length
            ? { createMany: { data: tagIds.map((id) => ({ tagId: id })) } }
            : undefined,
        },
        select: { id: true, toolType: true },
      });

      if (toolType === "HARD_CODED") {
        await tx.hardcodedTool.create({ data: { id: reg.id, notes: (profile.notes as string) || null } });
      } else if (toolType === "N8N") {
        await tx.n8NTool.create({
          data: {
            id: reg.id,
            externalUrl: String(profile.external_url),
            securityKeyId: String(profile.security_key_id),
            returnDirect: !!profile.return_direct,
            isIsolated: !!profile.is_isolated,
            streamIfSingleTool: !!profile.stream_if_single_tool,
            flashAnswerNeeded: !!profile.flash_answer_needed,
            timeoutSeconds: Number(profile.timeout_seconds ?? 30),
          },
        });
      } else if (toolType === "DUST") {
        await tx.dustTool.create({
          data: {
            id: reg.id,
            dustWorkspaceSid: String(profile.dust_workspace_sid),
            dustAgentSid: String(profile.dust_agent_sid),
            securityKeyId: String(profile.security_key_id),
            returnDirect: !!profile.return_direct,
            isIsolated: !!profile.is_isolated,
            streamIfSingleTool: !!profile.stream_if_single_tool,
            apiTimeoutSeconds: Number(profile.api_timeout_seconds ?? 30),
            messageEventsTimeoutSeconds: Number(profile.message_events_timeout_seconds ?? 180),
            conversationEventsTimeoutSeconds: Number(profile.conversation_events_timeout_seconds ?? 30),
          },
        });
      }

      return reg;
    });

    return NextResponse.json({ id: result.id }, { status: 201 });
  } catch (e: any) {
    const isUnique = (e?.meta as any)?.target?.includes("explicit_call_name");
    if (e?.code === "INVALID_TAGS") {
      return NextResponse.json({ error: "invalid_tag_ids" }, { status: 400 });
    }
    return NextResponse.json({ error: isUnique ? "explicit_call_name_conflict" : "create_failed" }, { status: isUnique ? 409 : 500 });
  }
});


