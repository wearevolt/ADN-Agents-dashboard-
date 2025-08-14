// Agno API Configuration
export const AGNO_CONFIG = {
  API_KEY: process.env.NEXT_PUBLIC_AGNO_API_KEY || "",
  API_URL: (process.env.NEXT_PUBLIC_AGNO_API_URL || "http://localhost:7777").replace(/\/$/, ""),
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
  if (AGNO_CONFIG.API_KEY) {
    headers["Authorization"] = `Bearer ${AGNO_CONFIG.API_KEY}`;
  }
  return headers;
};

export const AGNO_ENDPOINTS = {
  CHAT: "/chat/completions",
  AGENTS: "/models",
  SESSIONS: "/sessions",
  STATUS: "/status",
};
