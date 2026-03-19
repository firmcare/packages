
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";
import { logAudit } from "@/lib/audit";

const testSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  price: z.number().min(0),
});

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN" && session?.user?.role !== "SUPERADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const validatedData = testSchema.parse(body);

    const test = await prisma.test.create({
      data: validatedData,
    });

    await logAudit(session.user.id, "TEST_CREATED", "Test", test.id, `Created test "${validatedData.name}"`, {
      resourceName: validatedData.name,
      metadata: { price: validatedData.price },
    });

    return NextResponse.json(test);
  } catch (error) {
    console.error(error);
    if (error instanceof z.ZodError) {
        return new NextResponse(JSON.stringify(error.issues), { status: 400 });
    }
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN" && session?.user?.role !== "SUPERADMIN") {
         return new NextResponse("Unauthorized", { status: 401 });
    }
    const tests = await prisma.test.findMany({
      orderBy: { name: 'asc' }
    });
    return NextResponse.json(tests);
  } catch (error) {
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
