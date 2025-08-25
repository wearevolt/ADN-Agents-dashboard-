import { proxyGet } from "../../_utils";

export async function GET(_req: Request, { params }: any) {
  const { agentId } = params;
  return proxyGet(`/sessions/${encodeURIComponent(agentId)}`);
}
