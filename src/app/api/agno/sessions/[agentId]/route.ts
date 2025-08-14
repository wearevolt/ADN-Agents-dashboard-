import { proxyGet } from "../../_utils";

export async function GET(_req: Request, context: { params: { agentId: string } }) {
  const { agentId } = context.params;
  return proxyGet(`/sessions/${encodeURIComponent(agentId)}`);
}
