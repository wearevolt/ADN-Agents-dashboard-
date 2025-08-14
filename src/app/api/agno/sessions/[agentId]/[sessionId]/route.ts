import { proxyDelete, proxyGet } from "../../../_utils";

export async function GET(
  _req: Request,
  context: { params: { agentId: string; sessionId: string } }
) {
  const { agentId, sessionId } = context.params;
  return proxyGet(`/sessions/${encodeURIComponent(agentId)}/${encodeURIComponent(sessionId)}`);
}

export async function DELETE(
  _req: Request,
  context: { params: { agentId: string; sessionId: string } }
) {
  const { agentId, sessionId } = context.params;
  return proxyDelete(`/sessions/${encodeURIComponent(agentId)}/${encodeURIComponent(sessionId)}`);
}
