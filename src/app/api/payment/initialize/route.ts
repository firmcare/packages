import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { resolveCartItems } from "@/lib/booking-utils";

const initSchema = z.object({
  amount: z.number().positive(),
  cartItems: z.array(z.object({
    id: z.string(),
    title: z.string(),
    price: z.string(),
    includes: z.array(z.string()).optional(),
    customItems: z.array(z.object({ name: z.string(), price: z.number() })).optional(),
  })),
  homeCollection: z.boolean(),
  bookingDate: z.iso.datetime(),
  promoCode: z.string().nullish(),
  referralCode: z.string().nullish(),
  discount: z.number().min(0).default(0),
});

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id || !session.user.email) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const data = initSchema.parse(body);

    const amountKobo = Math.round(data.amount * 100);
    const reference = `FC-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
    const bookingDate = new Date(data.bookingDate);

    // Resolve cart items using the ORIGINAL total (before discount) so totalAmount captures gross price
    const originalTotal = data.amount + data.discount;
    const resolved = await resolveCartItems(data.cartItems, originalTotal);

    // Remove any abandoned PENDING bookings for these packages before creating fresh ones
    const packageIds = resolved.map((r) => r.packageId);
    if (packageIds.length > 0) {
      await prisma.booking.deleteMany({
        where: {
          userId: session.user.id,
          packageId: { in: packageIds },
          status: "PENDING",
        },
      });
    }

    // Create PENDING bookings — these exist even if the user abandons payment
    await prisma.booking.createMany({
      data: resolved.map(({ packageId, notes, unitAmount }) => ({
        userId: session.user.id,
        packageId,
        date: bookingDate,
        homeCollection: data.homeCollection,
        totalAmount: unitAmount,       // gross (pre-discount) per-item amount
        status: "PENDING" as const,
        paymentRef: reference,
        referralCode: data.referralCode ?? null,
        notes: notes ?? undefined,
      })),
    });

    // Initialise Paystack transaction
    const paystackRes = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: session.user.email,
        amount: amountKobo,
        reference,
        metadata: {
          userId: session.user.id,
          cartItems: data.cartItems,
          homeCollection: data.homeCollection,
          bookingDate: data.bookingDate,
          promoCode: data.promoCode ?? null,
          referralCode: data.referralCode ?? null,
          discount: data.discount,
          custom_fields: [
            { display_name: "Customer", variable_name: "customer", value: session.user.name ?? session.user.email },
          ],
        },
      }),
    });

    if (!paystackRes.ok) {
      // Roll back the PENDING bookings so they don't linger
      await prisma.booking.deleteMany({ where: { paymentRef: reference } });
      const err = await paystackRes.text();
      console.error("Paystack init error:", err);
      return new NextResponse("Payment gateway error", { status: 502 });
    }

    const result = await paystackRes.json();
    return NextResponse.json({
      reference: result.data.reference,
      access_code: result.data.access_code,
      authorization_url: result.data.authorization_url,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.issues), { status: 400 });
    }
    console.error("Payment initialize error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
