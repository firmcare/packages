import { auth } from "@/auth";
import { NextResponse } from "next/server";
import crypto from "crypto";

export async function POST() {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN" && session?.user?.role !== "SUPERADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      return new NextResponse("Cloudinary not configured", { status: 500 });
    }

    const timestamp = Math.round(new Date().getTime() / 1000);
    const folder = "firmcare/packages";

    // Build the string to sign
    const paramsToSign = `folder=${folder}&timestamp=${timestamp}`;
    const signature = crypto
      .createHash("sha256")
      .update(paramsToSign + apiSecret)
      .digest("hex");

    return NextResponse.json({
      signature,
      timestamp,
      apiKey,
      cloudName,
      folder,
    });
  } catch {
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

