import { auth } from "@/auth";
import { NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN" && session?.user?.role !== "SUPERADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey    = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      return new NextResponse("Cloudinary not configured", { status: 500 });
    }

    const { publicId } = await req.json().catch(() => ({}));
    const timestamp = Math.round(Date.now() / 1000);
    const folder    = "firmcare/email-images";

    // Build params string in alphabetical order (Cloudinary requirement)
    // Include public_id when provided so we can enforce overwrite=false deduplication
    const paramsToSign = publicId
      ? `folder=${folder}&overwrite=false&public_id=${publicId}&timestamp=${timestamp}`
      : `folder=${folder}&timestamp=${timestamp}`;

    const signature = crypto
      .createHash("sha256")
      .update(paramsToSign + apiSecret)
      .digest("hex");

    return NextResponse.json({ signature, timestamp, apiKey, cloudName, folder, publicId: publicId ?? null });
  } catch {
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

