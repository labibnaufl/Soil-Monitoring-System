import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Runs before routes are rendered (Edge Runtime compatible — no auth() import here).
// Fast redirect gate only: cookie presence. Real 8h vs 30d expiry is enforced
// in auth() jwt callback (returns null when expired), then pages redirect.
export function proxy(req: NextRequest) {
  const { nextUrl, cookies } = req;

  // Check for session token in cookies (Auth.js v5 stores session in cookie).
  // Production (HTTPS) uses the __Secure- prefix; dev uses the plain name.
  const sessionToken =
    cookies.get("authjs.session-token")?.value ??
    cookies.get("__Secure-authjs.session-token")?.value;
  const isLoggedIn = !!sessionToken;

  const isApiAuthRoute = nextUrl.pathname.startsWith("/api/auth");
  const isLoginRoute = nextUrl.pathname === "/auth/login";
  const isDashboardRoute = nextUrl.pathname.startsWith("/dashboard");

  // Always allow API auth routes
  if (isApiAuthRoute) {
    return NextResponse.next();
  }

  // Redirect to dashboard if already logged in and trying to access login
  if (isLoggedIn && isLoginRoute) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }

  // Redirect to login if accessing dashboard without session
  if (isDashboardRoute && !isLoggedIn) {
    return NextResponse.redirect(new URL("/auth/login", nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/auth/login"],
};
