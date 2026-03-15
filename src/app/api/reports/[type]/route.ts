import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return '';
  const headers = Object.keys(rows[0]);
  const lines = [
    headers.join(','),
    ...rows.map((row) =>
      headers
        .map((h) => {
          const val = row[h] ?? '';
          const str = String(val).replace(/"/g, '""');
          return `"${str}"`;
        })
        .join(',')
    ),
  ];
  return lines.join('\r\n');
}

async function revenueReport() {
  const transactions = await prisma.transaction.findMany({
    where: { status: 'COMPLETED' },
    select: {
      createdAt: true,
      amount: true,
      discount: true,
      finalAmount: true,
      paymentMethod: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  return transactions.map((t) => ({
    date: t.createdAt.toISOString().split('T')[0],
    amount: Number(t.amount),
    discount: Number(t.discount),
    final_amount: Number(t.finalAmount),
    payment_method: t.paymentMethod,
  }));
}

async function bookingsReport() {
  const bookings = await prisma.booking.findMany({
    include: {
      user: { select: { name: true, email: true } },
      package: { select: { title: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return bookings.map((b) => ({
    id: b.id,
    user_name: b.user.name ?? '',
    user_email: b.user.email,
    package: b.package.title,
    date: b.date.toISOString().split('T')[0],
    status: b.status,
    home_collection: b.homeCollection ? 'Yes' : 'No',
    total_amount: Number(b.totalAmount),
    created_at: b.createdAt.toISOString().split('T')[0],
  }));
}

async function usersReport() {
  const users = await prisma.user.findMany({
    include: {
      role: { select: { name: true } },
      _count: { select: { bookings: true, transactions: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return users.map((u) => ({
    id: u.id,
    name: u.name ?? '',
    email: u.email,
    role: u.role.name,
    bookings: u._count.bookings,
    transactions: u._count.transactions,
    joined: u.createdAt.toISOString().split('T')[0],
  }));
}

async function packagesReport() {
  const packages = await prisma.package.findMany({
    include: {
      category: { select: { name: true } },
      _count: { select: { bookings: true } },
    },
    orderBy: { title: 'asc' },
  });

  return packages.map((p) => ({
    id: p.id,
    title: p.title,
    category: p.category.name,
    price: Number(p.price),
    active: p.isActive ? 'Yes' : 'No',
    total_bookings: p._count.bookings,
  }));
}

async function promosReport() {
  const promos = await prisma.promo.findMany({
    include: {
      _count: { select: { transactions: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return promos.map((p) => ({
    code: p.code,
    discount_type: p.discountType,
    discount_value: Number(p.discountValue),
    valid_from: p.validFrom.toISOString().split('T')[0],
    valid_until: p.validUntil.toISOString().split('T')[0],
    usage_count: p.usageCount,
    usage_limit: p.usageLimit ?? 'Unlimited',
    active: p.isActive ? 'Yes' : 'No',
    times_used_in_transactions: p._count.transactions,
  }));
}

const reportHandlers: Record<string, () => Promise<Record<string, unknown>[]>> = {
  revenue: revenueReport,
  bookings: bookingsReport,
  users: usersReport,
  packages: packagesReport,
  promos: promosReport,
};

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ type: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPERADMIN')) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { type } = await params;
    const handler = reportHandlers[type];
    if (!handler) {
      return new NextResponse('Unknown report type', { status: 400 });
    }

    const rows = await handler();
    const csv = toCsv(rows);

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${type}-report-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch {
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
