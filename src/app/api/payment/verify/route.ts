import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { sendBookingConfirmedEmail } from "@/lib/email";
import { createNotification, notifyAdmins } from "@/lib/notify";

const REFERRAL_REWARD_PERCENT_DEFAULTS: Record<string, number> = {
  USER: 5, ADMIN: 3, AGENT: 10,
};

async function getReferralPercent(roleName: string): Promise<number> {
  const key =
    roleName === "AGENT" ? "referral_reward_percent_agent"
    : roleName === "ADMIN" || roleName === "SUPERADMIN" ? "referral_reward_percent_admin"
    : "referral_reward_percent_user";

  const { prisma } = await import("@/lib/prisma");
  const setting = await prisma.siteSetting.findUnique({ where: { key } });
  if (setting?.value) {
    const n = parseFloat(setting.value);
    if (!isNaN(n)) return n;
  }
  const defaultKey = roleName === "AGENT" ? "AGENT" : roleName === "ADMIN" || roleName === "SUPERADMIN" ? "ADMIN" : "USER";
  return REFERRAL_REWARD_PERCENT_DEFAULTS[defaultKey];
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { reference } = await req.json();
    if (!reference) {
      return new NextResponse("Reference required", { status: 400 });
    }

    // Verify with Paystack
    const verifyRes = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      { headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` } }
    );

    if (!verifyRes.ok) {
      return new NextResponse("Payment verification failed", { status: 502 });
    }

    const verifyData = await verifyRes.json();
    const tx = verifyData.data;

    if (tx.status !== "success") {
      return NextResponse.json({ success: false, message: "Payment was not successful." });
    }

    // Idempotency — don't process the same reference twice
    const existingTx = await prisma.transaction.findUnique({ where: { reference } });
    if (existingTx) {
      return NextResponse.json({ success: true, message: "Already processed." });
    }

    const meta = tx.metadata ?? {};
    const cartItems: {
      id: string;
      title: string;
      price: string;
      includes?: string[];
      customItems?: { name: string; price: number }[];
    }[] = meta.cartItems ?? [];
    const homeCollection: boolean = meta.homeCollection === true || meta.homeCollection === "true";
    const referralCode: string | null = meta.referralCode ?? null;
    const discount: number = Number(meta.discount ?? 0);
    const totalPaid = tx.amount / 100; // kobo → NGN
    const perItemAmount = cartItems.length > 0 ? totalPaid / cartItems.length : totalPaid;

    // ── Upgrade PENDING bookings created by initialize ────────────────────────
    const pendingBookings = await prisma.booking.findMany({
      where: { paymentRef: reference, userId: session.user.id, status: "PENDING" },
    });

    let bookings: { id: string; totalAmount: { toNumber(): number } }[];

    if (pendingBookings.length > 0) {
      await prisma.booking.updateMany({
        where: { paymentRef: reference, userId: session.user.id, status: "PENDING" },
        data: { status: "CONFIRMED", totalAmount: perItemAmount },
      });
      bookings = pendingBookings;
    } else {
      // Fallback: create CONFIRMED bookings directly (covers legacy / edge cases)
      const { resolveCartItems } = await import("@/lib/booking-utils");
      const bookingDate = meta.bookingDate
        ? new Date(meta.bookingDate)
        : (() => { const d = new Date(); d.setDate(d.getDate() + 1); return d; })();

      const resolved = await resolveCartItems(cartItems, totalPaid);
      bookings = await Promise.all(
        resolved.map(({ packageId, notes }) =>
          prisma.booking.create({
            data: {
              userId: session.user.id,
              packageId,
              date: bookingDate,
              homeCollection,
              totalAmount: perItemAmount,
              status: "CONFIRMED",
              paymentRef: reference,
              ...(notes ? { notes } : {}),
            },
          })
        )
      );
    }

    // ── Transaction record ────────────────────────────────────────────────────
    await prisma.transaction.create({
      data: {
        userId: session.user.id,
        bookingId: bookings[0].id,
        amount: totalPaid + discount,
        discount,
        finalAmount: totalPaid,
        paymentMethod: "CARD",
        status: "COMPLETED",
        reference,
        metadata: JSON.stringify({ paystackReference: reference, cartItems }),
      },
    });

    // ── Referral ──────────────────────────────────────────────────────────────
    if (referralCode) {
      const referrer = await prisma.user.findUnique({
        where: { referralCode: referralCode.toUpperCase() },
        select: { id: true, role: { select: { name: true } } },
      });

      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { referredByCode: true },
      });
      if (!user?.referredByCode) {
        await prisma.user.update({
          where: { id: session.user.id },
          data: { referredByCode: referralCode.toUpperCase() },
        });
      }

      if (referrer && referrer.id !== session.user.id) {
        const roleName = referrer.role.name;
        const rewardPercent = await getReferralPercent(roleName);
        const referralType =
          roleName === "AGENT" ? "AGENT"
          : roleName === "ADMIN" || roleName === "SUPERADMIN" ? "ADMIN"
          : "USER";

        await Promise.all(
          bookings.map((booking) => {
            const rewardAmount = Math.round(booking.totalAmount.toNumber() * rewardPercent) / 100;
            return prisma.referralReward.create({
              data: {
                referrerId: referrer.id,
                refereeId: session.user.id,
                bookingId: booking.id,
                amount: rewardAmount,
                status: "PENDING",
                referralType,
              },
            });
          })
        );
      }
    }

    // ── In-app notifications ──────────────────────────────────────────────────
    const pkgTitles = cartItems.map((i) => i.title).join(", ");
    createNotification({
      userId: session.user.id,
      type: "booking_confirmed",
      title: "Booking Confirmed",
      message: `Your payment was successful and ${bookings.length} booking${bookings.length > 1 ? "s have" : " has"} been confirmed: ${pkgTitles}.`,
      bookingId: bookings[0]?.id,
    });
    notifyAdmins(
      "New Booking",
      `A new booking was placed for: ${pkgTitles}. Reference: ${reference}.`,
      bookings[0]?.id
    );

    // ── Confirmation email ────────────────────────────────────────────────────
    const confirmedUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { email: true, name: true },
    });
    if (confirmedUser) {
      const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
      const bookingDate = meta.bookingDate ? new Date(meta.bookingDate) : new Date();
      const emailLineItems = cartItems.flatMap((item) => {
        if (item.customItems?.length) {
          return item.customItems.map((t) => ({ title: t.name, amount: t.price }));
        }
        return [{
          title: item.title,
          amount: parseFloat(item.price.replace(/[^0-9.]/g, "")) || perItemAmount,
        }];
      });

      sendBookingConfirmedEmail(
        confirmedUser.email,
        confirmedUser.name,
        emailLineItems,
        totalPaid,
        bookingDate,
        homeCollection,
        reference,
        baseUrl
      ).catch(console.error);
    }

    return NextResponse.json({ success: true, bookingCount: bookings.length });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Payment verify error:", error);
    return NextResponse.json({ success: false, message: `Server error: ${msg}` }, { status: 500 });
  }
}
