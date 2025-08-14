import { toast } from "sonner";

import { APIRoutes } from "./routes";
import { AGNO_CONFIG, getAgnoHeaders } from "@/lib/config";

import { Agent, ComboboxAgent, SessionEntry } from "@/types/playground";

const resolveBase = (maybeBase?: string): string => {
  const trimmed = (maybeBase || "").trim();
  return trimmed ? trimmed.replace(/\/$/, "") : AGNO_CONFIG.API_URL;
};

export const getPlaygroundAgentsAPI = async (endpoint: string = ""): Promise<ComboboxAgent[]> => {
  const url = APIRoutes.GetPlaygroundAgents(resolveBase(endpoint));
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: getAgnoHeaders(),
    });
    if (!response.ok) {
      toast.error(`Failed to fetch playground agents: ${response.statusText}`);
      return [];
    }
    const data = await response.json();
    // Transform the API response into the expected shape.
    const agents: ComboboxAgent[] = data.map((item: Agent) => ({
      value: item.agent_id || "",
      label: item.name || "",
      model: item.model || "",
      storage: item.storage || false,
    }));
    return agents;
  } catch (error) {
    console.error("Error fetching playground agents:", error);
    toast.error("Error fetching playground agents");
    return [];
  }
};

export const getPlaygroundStatusAPI = async (base: string = ""): Promise<number> => {
  const response = await fetch(APIRoutes.PlaygroundStatus(resolveBase(base)), {
    method: "GET",
    headers: getAgnoHeaders(),
  });
  return response.status;
};

export const getAllPlaygroundSessionsAPI = async (
  base: string = "",
  agentId: string
): Promise<SessionEntry[]> => {
  try {
    const response = await fetch(APIRoutes.GetPlaygroundSessions(resolveBase(base), agentId), {
      method: "GET",
      headers: getAgnoHeaders(),
    });
    if (!response.ok) {
      if (response.status === 404) {
        // Return empty array when storage is not enabled
        return [];
      }
      throw new Error(`Failed to fetch sessions: ${response.statusText}`);
    }
    return response.json();
  } catch (error) {
    console.error("Error fetching sessions:", error);
    return [];
  }
};

export const getPlaygroundSessionAPI = async (
  base: string = "",
  agentId: string,
  sessionId: string
) => {
  const response = await fetch(
    APIRoutes.GetPlaygroundSession(resolveBase(base), agentId, sessionId),
    {
      method: "GET",
      headers: getAgnoHeaders(),
    }
  );
  return response.json();
};

export const deletePlaygroundSessionAPI = async (
  base: string = "",
  agentId: string,
  sessionId: string
) => {
  const response = await fetch(
    APIRoutes.DeletePlaygroundSession(resolveBase(base), agentId, sessionId),
    {
      method: "DELETE",
      headers: getAgnoHeaders(),
    }
  );
  return response;
};

// Новая функция для отправки сообщений в чат
export const sendMessageToAgentAPI = async (
  message: string,
  agentId: string,
  sessionId?: string,
  base: string = ""
) => {
  try {
    const response = await fetch(APIRoutes.AgentRun(resolveBase(base)), {
      method: "POST",
      headers: getAgnoHeaders(),
      body: JSON.stringify({
        model: agentId,
        messages: [
          {
            role: "user",
            content: message,
          },
        ],
        session_id: sessionId,
        stream: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to send message: ${response.statusText}`);
    }

    return response;
  } catch (error) {
    console.error("Error sending message:", error);
    throw error;
  }
};
