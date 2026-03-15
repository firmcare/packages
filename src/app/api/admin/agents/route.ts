import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-utils";
import bcrypt from "bcryptjs";
import crypto from "crypto";

// Ensure AGENT role exists (creates it on first call if missing)
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
    if (!agentRole) return NextResponse.json([]);

    const agents = await prisma.user.findMany({
      where: { roleId: agentRole.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        referralCode: true,
        createdAt: true,
        _count: {
          select: { referralRewardsGiven: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Enrich with total earnings
    const enriched = await Promise.all(
      agents.map(async (agent) => {
        const earned = await prisma.referralReward.aggregate({
          where: { referrerId: agent.id, status: "PAID" },
          _sum: { amount: true },
        });
        return {
          ...agent,
          totalReferrals: agent._count.referralRewardsGiven,
          totalEarned: Number(earned._sum.amount ?? 0),
        };
      })
    );

    return NextResponse.json(enriched);
  } catch {
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await requireAdmin();

    const { name, email, phone } = await req.json();
    if (!name?.trim() || !email?.trim()) {
      return new NextResponse("Name and email are required", { status: 400 });
    }

    // Check email not already in use
    const existing = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
    if (existing) {
      return new NextResponse("Email already in use", { status: 409 });
    }

    const agentRole = await ensureAgentRole();

    // Generate a temporary password (agent must change on first login)
    const tempPassword = crypto.randomBytes(8).toString("hex");
    const hashedPassword = await bcrypt.hash(tempPassword, 12);

    const referralCode = generateReferralCode(name.trim());

    const agent = await prisma.user.create({
      data: {
        name:          name.trim(),
        email:         email.trim().toLowerCase(),
        phone:         phone?.trim() || null,
        password:      hashedPassword,
        roleId:        agentRole.id,
        referralCode,
        emailVerified: true, // Admin-created accounts are pre-verified
      },
      select: { id: true, name: true, email: true, phone: true, referralCode: true, createdAt: true },
    });

    return NextResponse.json({ agent, tempPassword }, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return new NextResponse(`Error: ${msg}`, { status: 500 });
  }
}
