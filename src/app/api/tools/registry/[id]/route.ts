import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/withAuth";
import { prisma } from "@/lib/prisma";

const MAIN_USERINFO_URL = process.env.MAIN_USERINFO_URL;
const AUTH_DEBUG = String(process.env.AUTH_DEBUG || "").toLowerCase() === "true" || process.env.AUTH_DEBUG === "1";

async function resolveCanonicalUserId(request: Request, fallbackUserId: string): Promise<string> {
  let canonicalUserId = fallbackUserId;
  if (!MAIN_USERINFO_URL) return canonicalUserId;
  try {
    const cookieHeader = request.headers.get("cookie") || "";
    const body = JSON.stringify({ query: "query Me { me { id email } }", variables: {} });
    const upstream = await fetch(MAIN_USERINFO_URL, {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json", cookie: cookieHeader },
      body,
    });
    if (upstream.ok) {
      const json = (await upstream.json()) as any;
      const me = json?.data?.me;
      if (me?.id) canonicalUserId = String(me.id);
    } else if (AUTH_DEBUG) {
      console.log("[auth] tools/registry/[id]: upstream me not ok, status:", upstream.status);
    }
  } catch (e) {
    if (AUTH_DEBUG) console.log("[auth] tools/registry/[id]: upstream me failed", (e as Error)?.message || e);
  }
  return canonicalUserId;
}

async function isAdmin(request: Request, userId: string): Promise<boolean> {
  const canonicalUserId = await resolveCanonicalUserId(request, userId);
  const match = await prisma.userRole.findFirst({
    where: { userId: canonicalUserId, role: { name: "ADMIN" } },
    select: { id: true },
  });
  return !!match;
}

export const GET = withAuth(async ({ request }) => {
  const id = request.url.split("/registry/")[1]?.split("/")[0];
  if (!id) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const item = await prisma.toolsRegistry.findUnique({
    where: { id },
    include: {
      toolTags: { include: { tag: { select: { id: true, name: true } } } },
      n8n: {
        select: {
          externalUrl: true,
          securityKeyId: true,
          returnDirect: true,
          isIsolated: true,
          streamIfSingleTool: true,
          flashAnswerNeeded: true,
          timeoutSeconds: true,
        },
      },
      dust: {
        select: {
          dustWorkspaceSid: true,
          dustAgentSid: true,
          securityKeyId: true,
          returnDirect: true,
          isIsolated: true,
          streamIfSingleTool: true,
          apiTimeoutSeconds: true,
          messageEventsTimeoutSeconds: true,
          conversationEventsTimeoutSeconds: true,
        },
      },
    },
  });
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({
    id: item.id,
    explicitCallName: item.explicitCallName,
    readableName: item.readableName,
    description: item.description || null,
    toolType: item.toolType,
    tags: item.toolTags.map((tt) => tt.tag),
    n8n: item.n8n
      ? {
        external_url: item.n8n.externalUrl,
        security_key_id: item.n8n.securityKeyId,
        return_direct: item.n8n.returnDirect,
        is_isolated: item.n8n.isIsolated,
        stream_if_single_tool: item.n8n.streamIfSingleTool,
        flash_answer_needed: item.n8n.flashAnswerNeeded,
        timeout_seconds: item.n8n.timeoutSeconds,
      }
      : null,
    dust: item.dust
      ? {
        dust_workspace_sid: item.dust.dustWorkspaceSid,
        dust_agent_sid: item.dust.dustAgentSid,
        security_key_id: item.dust.securityKeyId,
        return_direct: item.dust.returnDirect,
        is_isolated: item.dust.isIsolated,
        stream_if_single_tool: item.dust.streamIfSingleTool,
        api_timeout_seconds: item.dust.apiTimeoutSeconds,
        message_events_timeout_seconds: item.dust.messageEventsTimeoutSeconds,
        conversation_events_timeout_seconds: item.dust.conversationEventsTimeoutSeconds,
      }
      : null,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  });
});

export const PATCH = withAuth(async ({ request, user }) => {
  const id = request.url.split("/registry/")[1]?.split("/")[0];
  if (!id) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const body = await request.json().catch(() => null) as {
    explicit_call_name?: string;
    readable_name?: string;
    description?: string | null;
    tag_ids?: string[];
    // tool_type changes are not allowed in MVP
  } | null;
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

  // tool_type change is forbidden in MVP
  if ((body as any).tool_type) {
    return NextResponse.json({ error: "tool_type_change_forbidden" }, { status: 400 });
  }

  // Both ADMIN and USER can edit Hardcoded-only related fields on registry (name/label)
  try {
    const tagIds = Array.isArray(body.tag_ids) ? body.tag_ids.map(String) : undefined;
    if (tagIds) {
      const existing = await prisma.tag.findMany({ where: { id: { in: tagIds } }, select: { id: true } });
      const set = new Set(existing.map((t) => t.id));
      const missing = tagIds.filter((tid) => !set.has(tid));
      if (missing.length) return NextResponse.json({ error: "invalid_tag_ids" }, { status: 400 });
    }
    const updated = await prisma.$transaction(async (tx) => {
      const u = await tx.toolsRegistry.update({
        where: { id },
        data: {
          explicitCallName: body.explicit_call_name?.trim() || undefined,
          readableName: body.readable_name?.trim() || undefined,
          description: body.description !== undefined ? (body.description?.trim?.() || null) : undefined,
        },
        select: { id: true },
      });
      if (tagIds) {
        await tx.toolsRegistryTag.deleteMany({ where: { toolId: id } });
        if (tagIds.length) {
          await tx.toolsRegistryTag.createMany({
            data: tagIds.map((tid) => ({ toolId: id, tagId: tid })),
            skipDuplicates: true,
          });
        }
      }
      return u;
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
  const admin = await isAdmin(request, user.id);
  if (!admin) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  try {
    await prisma.toolsRegistry.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "delete_failed" }, { status: 500 });
  }
});


