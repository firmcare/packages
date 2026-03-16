import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { name, email, phone, city, motivation } = await req.json();

    if (!name?.trim() || !email?.trim() || !motivation?.trim()) {
      return NextResponse.json(
        { error: "Name, email, and motivation are required." },
        { status: 400 }
      );
    }

    const emailLower = email.trim().toLowerCase();

    // Block duplicate pending/approved applications from the same email
    const existing = await prisma.agentApplication.findFirst({
      where: {
        email: emailLower,
        status: { in: ["PENDING", "APPROVED"] },
      },
    });
    if (existing) {
      return NextResponse.json(
        {
          error:
            existing.status === "APPROVED"
              ? "An agent account already exists for this email."
              : "You already have a pending application. We will be in touch shortly.",
        },
        { status: 409 }
      );
    }

    await prisma.agentApplication.create({
      data: {
        name: name.trim(),
        email: emailLower,
        phone: phone?.trim() || null,
        city: city?.trim() || null,
        motivation: motivation.trim(),
      },
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err) {
    console.error("[agent/apply]", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
