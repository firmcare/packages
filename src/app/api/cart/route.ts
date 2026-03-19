import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

  const cart = await prisma.cart.findUnique({ where: { userId: session.user.id } });
  return NextResponse.json({
    items:  cart ? JSON.parse(cart.items)  : [],
    extras: cart ? JSON.parse(cart.extras) : {},
  });
}

export async function PUT(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

  const { items, extras } = await req.json();

  await prisma.cart.upsert({
    where:  { userId: session.user.id },
    update: { items: JSON.stringify(items ?? []), extras: JSON.stringify(extras ?? {}) },
    create: { userId: session.user.id, items: JSON.stringify(items ?? []), extras: JSON.stringify(extras ?? {}) },
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

  await prisma.cart.deleteMany({ where: { userId: session.user.id } });
  return NextResponse.json({ ok: true });
}
