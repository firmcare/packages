import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-utils";
import { logAudit } from "@/lib/audit";
import { auth } from "@/auth";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { normalizeEmail, emailVariantsFilter } from "@/lib/email-utils";

async function ensureAgentRole() {
  return prisma.customRole.upsert({
    where: { name: "AGENT" },
    update: {},
    create: {
      name: "AGENT",
      description: "Marketing agent — earns referral rewards for bringing in customers",
      isSystem: true,
    },
  });
}

function generateReferralCode(name: string): string {
  const prefix = name.replace(/[^a-zA-Z]/g, "").slice(0, 3).toUpperCase();
  const suffix = Date.now().toString(36).slice(-4).toUpperCase();
  return `${prefix}${suffix}`;
}

export async function GET() {
  try {
    await requireAdmin();

    const agentRole = await prisma.customRole.findUnique({ where: { name: "AGENT" } });
    const [agents, pendingApplicationsCount] = await Promise.all([
      agentRole
        ? prisma.user.findMany({
            where: { roleId: agentRole.id },
            select: {
              id: true, name: true, email: true, phone: true, referralCode: true,
              createdAt: true, isActive: true,
              _count: { select: { referralRewardsGiven: true } },
            },
            orderBy: { createdAt: "desc" },
          })
        : Promise.resolve([]),
      prisma.agentApplication.count({ where: { status: "PENDING" } }),
    ]);

    const enriched = await Promise.all(
      agents.map(async (agent) => {
        const [pendingRewards, confirmedRewards, paidRewards] = await Promise.all([
          prisma.referralReward.aggregate({ where: { referrerId: agent.id, status: "PENDING"   }, _sum: { amount: true } }),
          prisma.referralReward.aggregate({ where: { referrerId: agent.id, status: "CONFIRMED" }, _sum: { amount: true } }),
          prisma.referralReward.aggregate({ where: { referrerId: agent.id, status: "PAID"      }, _sum: { amount: true } }),
        ]);
        const confirmedAmount = Number(confirmedRewards._sum.amount ?? 0);
        const paidAmount      = Number(paidRewards._sum.amount ?? 0);
        return {
          ...agent,
          createdAt: agent.createdAt.toISOString(),
          totalReferrals: agent._count.referralRewardsGiven,
          pendingAmount:  Number(pendingRewards._sum.amount ?? 0),   // booking paid, not yet completed
          availableAmount: confirmedAmount,                           // confirmed, ready to withdraw
          paidOutAmount:  paidAmount,                                 // already withdrawn
          totalEarned:    confirmedAmount + paidAmount,               // lifetime (excl. pending/cancelled)
        };
      })
    );

    return NextResponse.json({ agents: enriched, pendingApplicationsCount });
  } catch (err) {
    console.error("GET /api/admin/agents error:", err);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    await requireAdmin();
    const { name, email: rawEmail, phone } = await req.json();
    if (!name?.trim() || !rawEmail?.trim()) {
      return new NextResponse("Name and email are required", { status: 400 });
    }
    const email = normalizeEmail(rawEmail);
    const existing = await prisma.user.findFirst({ where: emailVariantsFilter(email) });
    if (existing) return new NextResponse("Email already in use", { status: 409 });

    const agentRole = await ensureAgentRole();
    const tempPassword = crypto.randomBytes(8).toString("hex");
    const hashedPassword = await bcrypt.hash(tempPassword, 12);
    const referralCode = generateReferralCode(name.trim());

    const agent = await prisma.user.create({
      data: {
        name: name.trim(), email, phone: phone?.trim() || null,
        password: hashedPassword, roleId: agentRole.id, referralCode, emailVerified: true,
      },
      select: { id: true, name: true, email: true, phone: true, referralCode: true, createdAt: true },
    });

    if (session?.user?.id) {
      await logAudit(session.user.id, "AGENT_CREATED", "User", agent.id, `Created agent account for ${agent.email}`, {
        resourceName: agent.name ?? agent.email ?? undefined,
        metadata: { email: agent.email, referralCode },
      });
    }

    return NextResponse.json({ agent: { ...agent, createdAt: agent.createdAt.toISOString() }, tempPassword }, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return new NextResponse(`Error: ${msg}`, { status: 500 });
  }
}
