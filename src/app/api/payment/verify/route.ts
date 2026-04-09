import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { sendBookingConfirmedEmail } from "@/lib/email";
import { createNotification, isNotifEnabled, notifyAdmins } from "@/lib/notify";
import { logBookingEvent } from "@/lib/booking-log";

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
    const homeCollectionLocationId: string | null = meta.homeCollectionLocationId ?? null;
    const homeCollection: boolean = homeCollectionLocationId !== null;
    const referralCode: string | null = meta.referralCode ?? null;
    const discount: number = Number(meta.discount ?? 0);
    const totalPaid = tx.amount / 100; // kobo → NGN
    const n = cartItems.length > 0 ? cartItems.length : 1;
    // Per-item breakdown: originalAmount = gross, discountAmount = discount split, netAmount = actual paid
    const originalPerItem = (totalPaid + discount) / n;
    const discountPerItem = discount / n;
    const netPerItem = totalPaid / n;

    // ── Upgrade PENDING bookings created by initialize ────────────────────────
    const pendingBookings = await prisma.booking.findMany({
      where: { paymentRef: reference, userId: session.user.id, status: "PENDING" },
    });

    let bookings: { id: string; totalAmount: { toNumber(): number } }[];

    if (pendingBookings.length > 0) {
      // totalAmount was already stored as gross in initialize; just set status + discountAmount
      await prisma.booking.updateMany({
        where: { paymentRef: reference, userId: session.user.id, status: "PENDING" },
        data: { status: "CONFIRMED", discountAmount: discountPerItem },
      });
      bookings = pendingBookings;
    } else {
      // Fallback: create CONFIRMED bookings directly (covers legacy / edge cases)
      const { resolveCartItems } = await import("@/lib/booking-utils");
      const bookingDate = meta.bookingDate
        ? new Date(meta.bookingDate)
        : (() => { const d = new Date(); d.setDate(d.getDate() + 1); return d; })();

      const resolved = await resolveCartItems(cartItems, totalPaid + discount);
      bookings = await Promise.all(
        resolved.map(({ packageId, notes }) =>
          prisma.booking.create({
            data: {
              userId: session.user.id,
              packageId,
              date: bookingDate,
              homeCollection,
              homeCollectionLocationId,
              totalAmount: originalPerItem,
              discountAmount: discountPerItem,
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

      if (referrer && referrer.id !== session.user.id) {
        const roleName = referrer.role.name;
        // Only record referredByCode for user-to-user referrals
        if (roleName === "USER") {
          const existingUser = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { referredByCode: true },
          });
          if (!existingUser?.referredByCode) {
            await prisma.user.update({
              where: { id: session.user.id },
              data: { referredByCode: referralCode.toUpperCase() },
            });
          }
        }
        const rewardPercent = await getReferralPercent(roleName);
        const referralType =
          roleName === "AGENT" ? "AGENT"
          : roleName === "ADMIN" || roleName === "SUPERADMIN" ? "ADMIN"
          : "USER";

        // Reward is calculated on the net amount paid per booking (after any voucher discount)
        const rewardAmount = Math.round(netPerItem * rewardPercent) / 100;
        await Promise.all(
          bookings.map((booking) =>
            prisma.referralReward.create({
              data: {
                referrerId: referrer.id,
                refereeId: session.user.id,
                bookingId: booking.id,
                amount: rewardAmount,
                rewardPercent,
                status: "PENDING",
                referralType,
              },
            })
          )
        );
      }
    }

    // ── Booking logs ─────────────────────────────────────────────────────────
    await Promise.all(
      bookings.map((b) =>
        logBookingEvent(b.id, "PAYMENT_CONFIRMED", "Payment confirmed by Paystack", "Paystack")
      )
    );

    // ── In-app notifications ──────────────────────────────────────────────────
    const pkgTitles = cartItems.map((i) => i.title).join(", ");
    if (await isNotifEnabled("notify_on_booking_confirmed")) {
      await Promise.all(
        bookings.map((b, i) =>
          createNotification({
            userId: session.user.id,
            type: "booking_confirmed",
            title: "Booking Confirmed",
            message: `Your booking for "${cartItems[i]?.title ?? pkgTitles}" has been confirmed. We look forward to seeing you!`,
            bookingId: b.id,
          })
        )
      );
    }
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
          amount: parseFloat(item.price.replace(/[^0-9.]/g, "")) || netPerItem,
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
