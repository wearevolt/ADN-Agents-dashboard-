import jwt from "jsonwebtoken";

// Server-side JWT verification and user normalization

export interface CurrentUser {
  id: string; // fallback to email or device_id if sub is missing
  email?: string;
  roles?: string[];
  tenantId?: string;
  active: boolean;
  sessionId?: string;
  deviceId?: string;
}

const AUTH_COOKIE_NAME = process.env.AUTH_COOKIE_NAME || "auth_token";
const JWT_SECRET = process.env.JWT_SECRET as string;
const JWT_ISS = process.env.JWT_ISS; // optional strict issuer check
const JWT_AUD = process.env.JWT_AUD; // optional strict audience check
const AUTH_DEBUG = String(process.env.AUTH_DEBUG || "").toLowerCase() === "true" || process.env.AUTH_DEBUG === "1";

if (!JWT_SECRET) {
  // Fail fast on boot if missing secret (helps avoid silent 401 in production)
  // In dev you may provide via .env.local
  throw new Error("JWT_SECRET is required for server auth verification");
}

export function getAuthCookieFromHeaders(headers: Headers): string | null {
  // Next.js Request headers interface exposes cookies differently, but on server we can accept Headers
  const cookieHeader = headers.get("cookie");
  if (AUTH_DEBUG) {
    console.log("[auth] cookie header:", cookieHeader || "<none>");
  }
  if (!cookieHeader) return null;
  const cookies = cookieHeader.split(/;\s*/);
  for (const c of cookies) {
    const [name, ...rest] = c.split("=");
    if (name === AUTH_COOKIE_NAME) {
      const token = rest.join("=");
      if (AUTH_DEBUG) {
        console.log("[auth] extracted token:", token);
      }
      return token;
    }
  }
  return null;
}

export function verifyJwtToken(token: string): CurrentUser {
  const options: jwt.VerifyOptions = {
    algorithms: ["HS256"],
  };
  if (JWT_ISS) options.issuer = JWT_ISS;
  if (JWT_AUD) options.audience = JWT_AUD;

  let decoded: jwt.JwtPayload;
  try {
    decoded = jwt.verify(token, JWT_SECRET, options) as jwt.JwtPayload;
    if (AUTH_DEBUG) {
      console.log("[auth] decoded JWT payload (verified):", decoded);
    }
  } catch (err) {
    if (AUTH_DEBUG) {
      const loose = jwt.decode(token, { complete: true });
      console.log("[auth] jwt.verify failed:", (err as Error)?.message || err);
      console.log("[auth] decoded without verify (for debugging only):", loose);
    }
    throw err;
  }

  // Map standard/custom claims to CurrentUser; support moneyball-style payloads
  const sub = (decoded.sub as string) || "";
  const email = (decoded.user_data as any)?.email || (decoded.email as string) || undefined;
  const deviceId = (decoded.device_id as string) || undefined;
  const roles = (decoded.roles as string[]) || undefined;
  const tenantId = (decoded.tenant as string) || (decoded.tenant_id as string) || undefined;
  const sessionId = (decoded.session_id as string) || undefined;

  // Choose identifier: sub -> email -> device_id
  const id = sub || email || deviceId || "";
  if (!id) {
    throw new Error("Invalid token: missing identifier (sub/email/device_id)");
  }

  return {
    id,
    email,
    roles,
    tenantId,
    active: true,
    sessionId,
    deviceId,
  };
}
