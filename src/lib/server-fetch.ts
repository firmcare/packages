import { cookies } from "next/headers";

const BASE = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export async function adminFetch<T>(path: string): Promise<T> {
  const cookieStore = await cookies();
  const res = await fetch(`${BASE}${path}`, {
    headers: { Cookie: cookieStore.toString() },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`adminFetch ${path} failed: ${res.status}`);
  return res.json();
}
