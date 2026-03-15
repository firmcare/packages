
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";
import { checkPermission } from "@/lib/permissions";

// Helper function to generate slug from title
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

const packageSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  price: z.number().min(0),
  imageUrl: z.string().url().optional(),
  categoryId: z.string().min(1),
  testIds: z.array(z.string()).optional(),
});

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const hasPermission = await checkPermission(session.user.id, 'packages', 'create');
    if (!hasPermission) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const body = await req.json();
    const validatedData = packageSchema.parse(body);
    const { testIds, title, ...rest } = validatedData;

    const pkg = await prisma.package.create({
      data: {
        title,
        slug: generateSlug(title),
        ...rest,
        tests: testIds ? {
          connect: testIds.map((id) => ({ id })),
        } : undefined,
      },
    });

    return NextResponse.json(pkg);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.issues), { status: 400 });
    }
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get('categoryId');

    const where = categoryId ? { categoryId } : {};

    const packages = await prisma.package.findMany({
      where,
      include: {
        category: true,
        tests: true,
      },
      orderBy: { title: 'asc' }
    });
    return NextResponse.json(packages);
  } catch (error) {
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
