import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// secureCookie mirrors NextAuth v5's own logic: use __Secure- prefix when AUTH_URL is HTTPS.
const secureCookie = (process.env.AUTH_URL ?? process.env.NEXTAUTH_URL ?? "").startsWith("https://");

async function getSessionToken(request: NextRequest) {
  return getToken({ req: request, secret: process.env.AUTH_SECRET, secureCookie, cookieName: secureCookie ? "__Secure-authjs.session-token" : "authjs.session-token" });
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect /admin routes
  if (pathname.startsWith("/admin")) {
    const token = await getSessionToken(request);

    if (!token) {
      const loginUrl = new URL("/auth/admin/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    const role = token.role as string;
    if (role !== "ADMIN" && role !== "SUPERADMIN") {
      return NextResponse.redirect(new URL("/", request.url));
    }

    // Block deactivated admins — redirect to admin login with error
    if (token.isActive === false) {
      const loginUrl = new URL("/auth/admin/login", request.url);
      loginUrl.searchParams.set("error", "account_deactivated");
      return NextResponse.redirect(loginUrl);
    }
  }

  // Protect /agent routes
  if (pathname.startsWith("/agent")) {
    const token = await getSessionToken(request);

    if (!token) {
      const loginUrl = new URL("/auth/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    const role = token.role as string;
    if (role !== "AGENT" && role !== "ADMIN" && role !== "SUPERADMIN") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    // Block deactivated agents — redirect to login with error
    if (role === "AGENT" && token.isActive === false) {
      const loginUrl = new URL("/auth/login", request.url);
      loginUrl.searchParams.set("error", "account_deactivated");
      return NextResponse.redirect(loginUrl);
    }

    // Force password change on first login
    if (token.mustChangePassword && !pathname.startsWith("/agent/change-password")) {
      return NextResponse.redirect(new URL("/agent/change-password", request.url));
    }
  }

  const response = NextResponse.next();
  response.headers.set('x-pathname', pathname);
  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};

