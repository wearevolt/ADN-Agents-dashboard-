import { proxyDelete, proxyGet } from "../../../_utils";

export async function GET(
  _req: Request,
  { params }: any
) {
  const { agentId, sessionId } = params;
  return proxyGet(`/sessions/${encodeURIComponent(agentId)}/${encodeURIComponent(sessionId)}`);
}

export async function DELETE(
  _req: Request,
  { params }: any
) {
  const { agentId, sessionId } = params;
  return proxyDelete(`/sessions/${encodeURIComponent(agentId)}/${encodeURIComponent(sessionId)}`);
}
