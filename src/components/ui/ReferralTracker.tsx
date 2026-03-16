"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";

const STORAGE_KEY = "firmcare-ref";
const TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

function ReferralTrackerInner() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const ref = searchParams.get("ref");
    if (!ref) return;
    // Store with expiry so stale codes don't linger
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ code: ref.toUpperCase(), expires: Date.now() + TTL_MS })
    );
  }, [searchParams]);

  return null;
}

export function getStoredReferralCode(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const { code, expires } = JSON.parse(raw);
    if (Date.now() > expires) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return code as string;
  } catch {
    return null;
  }
}

export default function ReferralTracker() {
  return (
    <Suspense fallback={null}>
      <ReferralTrackerInner />
    </Suspense>
  );
}
