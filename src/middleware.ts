import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Simple middleware without importing auth (Edge Runtime compatible)
export default function middleware(req: NextRequest) {
  const { nextUrl, cookies } = req;

  // Check for session token in cookies (Auth.js v5 stores session in cookie)
  const sessionToken = cookies.get("authjs.session-token")?.value;
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
