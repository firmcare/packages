import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-utils";
import { auth } from "@/auth";
import { logAudit } from "@/lib/audit";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const session = await auth();
    const { id } = await params;
    const { status } = await req.json();

    if (!["PENDING", "PAID", "CANCELLED"].includes(status)) {
      return new NextResponse("Invalid status", { status: 400 });
    }

    const reward = await prisma.referralReward.update({
      where: { id },
      data: { status },
    });

    if (session?.user?.id) {
      await logAudit(session.user.id, "REFERRAL_STATUS_UPDATE", "ReferralReward", id,
        `Referral reward status set to ${status}`);
    }

    return NextResponse.json(reward);
  } catch {
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
