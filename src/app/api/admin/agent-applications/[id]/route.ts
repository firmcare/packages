import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-utils";
import { sendAgentApprovedEmail, sendAgentRejectedEmail } from "@/lib/email";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

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

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const { action, adminNotes } = await req.json();
    // action: "approve" | "reject"

    const application = await prisma.agentApplication.findUnique({ where: { id } });
    if (!application) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }
    if (application.status !== "PENDING") {
      return NextResponse.json({ error: "Application already processed" }, { status: 409 });
    }

    if (action === "reject") {
      await prisma.agentApplication.update({
        where: { id },
        data: {
          status: "REJECTED",
          adminNotes: adminNotes || null,
          processedAt: new Date(),
        },
      });

      // Fire-and-forget rejection email
      sendAgentRejectedEmail(application.email, application.name, adminNotes || undefined).catch(
        console.error
      );

      return NextResponse.json({ success: true, status: "REJECTED" });
    }

    if (action === "approve") {
      const agentRole = await ensureAgentRole();

      // Check if a user with this email already exists
      let user = await prisma.user.findUnique({
        where: { email: application.email },
        include: { role: true },
      });

      let tempPassword: string | null = null;

      if (user) {
        // Upgrade existing user to AGENT role
        await prisma.user.update({
          where: { id: user.id },
          data: { roleId: agentRole.id, emailVerified: true },
        });
      } else {
        // Create a new user account
        tempPassword = crypto.randomBytes(8).toString("hex");
        const hashedPassword = await bcrypt.hash(tempPassword, 12);
        const referralCode = generateReferralCode(application.name);

        user = await prisma.user.create({
          data: {
            name: application.name,
            email: application.email,
            phone: application.phone || null,
            password: hashedPassword,
            roleId: agentRole.id,
            referralCode,
            emailVerified: true,
          },
          include: { role: true },
        });
      }

      await prisma.agentApplication.update({
        where: { id },
        data: {
          status: "APPROVED",
          adminNotes: adminNotes || null,
          processedAt: new Date(),
          userId: user.id,
        },
      });

      // Send approval email
      sendAgentApprovedEmail(
        application.email,
        application.name,
        tempPassword ?? "(your existing password)",
        user.referralCode,
        BASE_URL
      ).catch(console.error);

      return NextResponse.json({ success: true, status: "APPROVED", userId: user.id });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err) {
    console.error("[admin/agent-applications/[id]]", err);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
