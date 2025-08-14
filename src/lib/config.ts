// Agno API Configuration
export const AGNO_CONFIG = {
  // Route all client requests through the internal Next.js API proxy
  API_URL: (process.env.NEXT_PUBLIC_AGNO_PROXY_BASE || "/api/agno").replace(/\/$/, ""),
  ENABLED: (process.env.NEXT_PUBLIC_AGNO_ENABLED ?? "true") === "true",
};

// Alternative endpoints for testing. Can be overridden via env as comma-separated list.
const envAltEndpoints = (process.env.NEXT_PUBLIC_AGNO_ALT_ENDPOINTS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

export const ALTERNATIVE_ENDPOINTS =
  envAltEndpoints.length > 0
    ? envAltEndpoints
    : [
        "http://localhost:7777",
        "http://localhost:8000",
        "http://localhost:3001",
        "https://api.openai.com/v1",
        "https://api.groq.com/openai/v1",
      ];

export const getAgnoHeaders = () => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  // Intentionally no Authorization header on the client
  return headers;
};

export const AGNO_ENDPOINTS = {
  CHAT: "/chat/completions",
  AGENTS: "/models",
  SESSIONS: "/sessions",
  STATUS: "/status",
};
