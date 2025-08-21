import { headers } from "next/headers";
import { getAuthCookieFromHeaders, verifyJwtToken, type CurrentUser } from "@/lib/auth/serverAuth";

// Get current user in Server Components / SSR; returns null if unauthorized
export function getCurrentUser(): CurrentUser | null {
  const hdrs = headers();
  const token = getAuthCookieFromHeaders(hdrs as unknown as Headers);
  if (!token) return null;
  try {
    return verifyJwtToken(token);
  } catch {
    return null;
  }
}
