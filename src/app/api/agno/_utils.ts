import { NextRequest } from "next/server";

const ALLOWED_RESPONSE_HEADERS = [
  "content-type",
  "content-length",
  "transfer-encoding",
  "cache-control",
];

export const getUpstreamBase = (): string => {
  const base =
    process.env.AGNO_API_URL || process.env.NEXT_PUBLIC_AGNO_API_URL || "http://localhost:7777";
  return base.replace(/\/$/, "");
};

export const buildServerHeaders = (incoming?: HeadersInit): Headers => {
  const headers = new Headers(incoming);
  headers.set("Content-Type", "application/json");
  const apiKey = process.env.AGNO_API_KEY;
  if (apiKey) {
    headers.set("Authorization", `Bearer ${apiKey}`);
  } else {
    headers.delete("Authorization");
  }
  return headers;
};

export const filterResponseHeaders = (headers: Headers): Headers => {
  const out = new Headers();
  headers.forEach((value, key) => {
    if (ALLOWED_RESPONSE_HEADERS.includes(key.toLowerCase())) {
      out.set(key, value as string);
    }
  });
  return out;
};

export const proxyGet = async (path: string): Promise<Response> => {
  const upstream = `${getUpstreamBase()}${path}`;
  const res = await fetch(upstream, { method: "GET", headers: buildServerHeaders() });
  const headers = filterResponseHeaders(res.headers);
  return new Response(res.body, { status: res.status, headers });
};

export const proxyDelete = async (path: string): Promise<Response> => {
  const upstream = `${getUpstreamBase()}${path}`;
  const res = await fetch(upstream, { method: "DELETE", headers: buildServerHeaders() });
  const headers = filterResponseHeaders(res.headers);
  return new Response(res.body, { status: res.status, headers });
};

export const proxyPost = async (path: string, req: NextRequest): Promise<Response> => {
  const upstream = `${getUpstreamBase()}${path}`;
  const body = await req.text();
  const res = await fetch(upstream, {
    method: "POST",
    headers: buildServerHeaders(req.headers),
    body,
  });
  const headers = filterResponseHeaders(res.headers);
  return new Response(res.body, { status: res.status, headers });
};
