import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(new URL("/auth/unsubscribed?status=invalid", req.url));
  }

  const user = await prisma.user.findUnique({ where: { unsubscribeToken: token } });
  if (!user) {
    return NextResponse.redirect(new URL("/auth/unsubscribed?status=invalid", req.url));
  }

  if (!user.emailUnsubscribed) {
    await prisma.user.update({
      where: { id: user.id },
      data: { emailUnsubscribed: true },
    });
  }

  return NextResponse.redirect(new URL("/auth/unsubscribed?status=success", req.url));
}

// Allow re-subscribe via POST (if we ever need it from a settings page)
export async function POST(req: Request) {
  const { token } = await req.json().catch(() => ({}));
  if (!token) return NextResponse.json({ error: "Missing token" }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { unsubscribeToken: token } });
  if (!user) return NextResponse.json({ error: "Invalid token" }, { status: 404 });

  await prisma.user.update({ where: { id: user.id }, data: { emailUnsubscribed: false } });
  return NextResponse.json({ success: true });
}
