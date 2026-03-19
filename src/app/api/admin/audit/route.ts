import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-utils";

const PAGE_SIZE = 50;

// Maps UI category → action prefixes / exact matches
const CATEGORY_ACTIONS: Record<string, string[]> = {
  Bookings:    ["BOOKING_STATUS_UPDATE", "BOOKING_NOTES_UPDATE", "BOOKING_RESULT_UPLOADED"],
  Packages:    ["PACKAGE_CREATED", "PACKAGE_UPDATED", "PACKAGE_DELETED", "PACKAGE_TOGGLED"],
  Tests:       ["TEST_CREATED", "TEST_UPDATED", "TEST_DELETED"],
  Promos:      ["PROMO_CREATED", "PROMO_UPDATED", "PROMO_DELETED", "PROMO_TOGGLED"],
  Agents:      ["AGENT_CREATED", "AGENT_DEACTIVATED", "AGENT_REACTIVATED", "AGENT_APPLICATION_APPROVED", "AGENT_APPLICATION_REJECTED"],
  Admins:      ["ADMIN_CREATED", "ADMIN_UPGRADED", "ADMIN_DEACTIVATED", "ADMIN_REACTIVATED", "ADMIN_PASSWORD_RESET", "ROLE_CHANGE", "USER_ROLE_CHANGE"],
  Withdrawals: ["WITHDRAWAL_APPROVED", "WITHDRAWAL_COMPLETED", "WITHDRAWAL_REJECTED", "WITHDRAWAL_FAILED"],
  Referrals:   ["REFERRAL_STATUS_UPDATE"],
  Settings:    ["SETTINGS_UPDATED"],
};

export async function GET(req: Request) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(req.url);
    const page     = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const search   = searchParams.get("search")?.trim() ?? "";
    const category = searchParams.get("category")?.trim() ?? "";
    const from     = searchParams.get("from") ?? "";
    const to       = searchParams.get("to") ?? "";
    const format   = searchParams.get("format") ?? "";

    const where: Record<string, unknown> = {};

    if (category && CATEGORY_ACTIONS[category]) {
      where.action = { in: CATEGORY_ACTIONS[category] };
    }

    if (from || to) {
      where.createdAt = {
        ...(from ? { gte: new Date(from) } : {}),
        ...(to   ? { lte: new Date(to + "T23:59:59.999Z") } : {}),
      };
    }

    if (search) {
      where.OR = [
        { detail:       { contains: search, mode: "insensitive" } },
        { resourceName: { contains: search, mode: "insensitive" } },
        { actor: { name:  { contains: search, mode: "insensitive" } } },
        { actor: { email: { contains: search, mode: "insensitive" } } },
      ];
    }

    // CSV export — return all matching rows (capped at 5000)
    if (format === "csv") {
      const logs = await prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: 5000,
        include: {
          actor: { select: { name: true, email: true, role: { select: { name: true } } } },
        },
      });

      const header = ["Timestamp", "Actor", "Role", "Action", "Resource", "Resource Name", "Detail", "IP"].join(",");
      const rows = logs.map((l) => [
        l.createdAt.toISOString(),
        `"${(l.actor.name ?? l.actor.email ?? "").replace(/"/g, '""')}"`,
        l.actor.role.name,
        l.action,
        l.resource,
        `"${(l.resourceName ?? "").replace(/"/g, '""')}"`,
        `"${(l.detail ?? "").replace(/"/g, '""')}"`,
        l.ip ?? "",
      ].join(","));

      const csv = [header, ...rows].join("\n");
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="audit-log-${new Date().toISOString().slice(0, 10)}.csv"`,
        },
      });
    }

    // Paginated JSON response
    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        include: {
          actor: { select: { id: true, name: true, email: true, role: { select: { name: true } } } },
        },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return NextResponse.json({
      logs: logs.map((l) => ({ ...l, createdAt: l.createdAt.toISOString() })),
      total,
      page,
      pages: Math.ceil(total / PAGE_SIZE),
    });
  } catch (err) {
    console.error("[admin/audit GET]", err);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
