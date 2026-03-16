import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getNigerianBanks } from "@/lib/paystack-transfer";

export async function GET() {
  const session = await auth();
  const role = session?.user?.role;
  if (!session?.user?.id || (role !== "AGENT" && role !== "ADMIN" && role !== "SUPERADMIN")) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const banks = await getNigerianBanks();
    return NextResponse.json(banks);
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}
