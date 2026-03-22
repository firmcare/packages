import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeEmail, emailVariantsFilter } from "@/lib/email-utils";

export async function POST(req: Request) {
  try {
    const { name, email, phone, city, motivation } = await req.json();

    if (!name?.trim() || !email?.trim() || !motivation?.trim()) {
      return NextResponse.json(
        { error: "Name, email, and motivation are required." },
        { status: 400 }
      );
    }

    const normalised = normalizeEmail(email);

    // Block if any user account resolves to the same base email
    const existingUser = await prisma.user.findFirst({
      where: emailVariantsFilter(normalised),
      select: { role: { select: { name: true } } },
    });
    if (existingUser) {
      const role = existingUser.role?.name;
      return NextResponse.json(
        {
          error:
            role === "AGENT"
              ? "An agent account already exists for this email address."
              : "This email is already registered. Please use a different email address to apply.",
        },
        { status: 409 }
      );
    }

    // Block duplicate pending/approved applications for the same base email
    const existing = await prisma.agentApplication.findFirst({
      where: {
        ...emailVariantsFilter(normalised),
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

    // Store the normalised email so future lookups are consistent
    await prisma.agentApplication.create({
      data: {
        name: name.trim(),
        email: normalised,
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
