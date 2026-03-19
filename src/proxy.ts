import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect /admin routes
  if (pathname.startsWith("/admin")) {
    const token = await getToken({ req: request, secret: process.env.AUTH_SECRET });

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
    const token = await getToken({ req: request, secret: process.env.AUTH_SECRET });

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
  }

  const response = NextResponse.next();
  response.headers.set('x-pathname', pathname);
  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};

