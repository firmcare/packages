import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { resolveAccountNumber, createTransferRecipient } from "@/lib/paystack-transfer";

function requireAgent(role?: string) {
  return role === "AGENT" || role === "ADMIN" || role === "SUPERADMIN";
}

// GET — fetch saved bank account
export async function GET() {
  const session = await auth();
  if (!session?.user?.id || !requireAgent(session.user.role)) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const account = await prisma.agentBankAccount.findUnique({
    where: { userId: session.user.id },
  });

  return NextResponse.json(account);
}

// POST — verify account number before saving (returns accountName)
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id || !requireAgent(session.user.role)) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { accountNumber, bankCode } = await req.json();
  if (!accountNumber || !bankCode) {
    return NextResponse.json({ error: "accountNumber and bankCode are required" }, { status: 400 });
  }

  const resolved = await resolveAccountNumber(accountNumber, bankCode);
  if (!resolved) {
    return NextResponse.json({ error: "Could not verify account. Check the account number and bank." }, { status: 422 });
  }

  return NextResponse.json({ accountName: resolved.accountName });
}

// PUT — save bank account (creates Paystack recipient)
export async function PUT(req: Request) {
  const session = await auth();
  if (!session?.user?.id || !requireAgent(session.user.role)) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { accountNumber, bankCode, bankName, accountName } = await req.json();
  if (!accountNumber || !bankCode || !bankName || !accountName) {
    return NextResponse.json({ error: "All fields required" }, { status: 400 });
  }

  try {
    // Create or reuse a Paystack recipient
    const recipientCode = await createTransferRecipient(accountName, accountNumber, bankCode);

    const account = await prisma.agentBankAccount.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        bankCode,
        bankName,
        accountNumber,
        accountName,
        paystackRecipientCode: recipientCode,
      },
      update: {
        bankCode,
        bankName,
        accountNumber,
        accountName,
        paystackRecipientCode: recipientCode,
      },
    });

    return NextResponse.json(account);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to save bank account";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
