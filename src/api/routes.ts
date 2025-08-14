import { AGNO_CONFIG, AGNO_ENDPOINTS } from "@/lib/config";

export const APIRoutes = {
  // Agno API Routes
  GetPlaygroundAgents: (PlaygroundApiUrl: string = AGNO_CONFIG.API_URL) =>
    `${PlaygroundApiUrl}${AGNO_ENDPOINTS.AGENTS}`,
  AgentRun: (PlaygroundApiUrl: string = AGNO_CONFIG.API_URL) =>
    `${PlaygroundApiUrl}${AGNO_ENDPOINTS.CHAT}`,
  PlaygroundStatus: (PlaygroundApiUrl: string = AGNO_CONFIG.API_URL) =>
    `${PlaygroundApiUrl}${AGNO_ENDPOINTS.STATUS}`,
  GetPlaygroundSessions: (PlaygroundApiUrl: string = AGNO_CONFIG.API_URL, agentId: string) =>
    `${PlaygroundApiUrl}${AGNO_ENDPOINTS.SESSIONS}/${agentId}`,
  GetPlaygroundSession: (
    PlaygroundApiUrl: string = AGNO_CONFIG.API_URL,
    agentId: string,
    sessionId: string
  ) => `${PlaygroundApiUrl}${AGNO_ENDPOINTS.SESSIONS}/${agentId}/${sessionId}`,

  DeletePlaygroundSession: (
    PlaygroundApiUrl: string = AGNO_CONFIG.API_URL,
    agentId: string,
    sessionId: string
  ) => `${PlaygroundApiUrl}${AGNO_ENDPOINTS.SESSIONS}/${agentId}/${sessionId}`,
};
