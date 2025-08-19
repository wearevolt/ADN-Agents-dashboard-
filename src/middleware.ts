import { NextResponse, type NextRequest } from "next/server";

// Presence-check middleware: ensure auth cookie exists; do NOT verify JWT here (Edge runtime)

const AUTH_COOKIE_NAME = process.env.AUTH_COOKIE_NAME || "auth_token";

// Public paths that should bypass auth presence-check
const PUBLIC_PATHS: readonly string[] = [
  "/health",
  "/api/health",
  "/favicon.ico",
  "/robots.txt",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip public paths
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return NextResponse.next();
  }

  // Presence-check for auth cookie
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (token) {
    return NextResponse.next();
  }

  // No cookie: return 401 for API routes, otherwise allow rendering (login screen will handle UI)
  const isApi = pathname.startsWith("/api");
  if (isApi) {
    return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "content-type": "application/json" },
    });
  }

  // Allow the app to render (client-side login screen will drive redirect on button click)
  return NextResponse.next();
}

// Exclude Next.js static assets from middleware
export const config = {
  matcher: [
    // Apply to all paths except _next/static, _next/image, favicon, robots
    "/((?!_next/static|_next/image|favicon.ico|robots.txt).*)",
  ],
};
