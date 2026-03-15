"use client";

import { useState } from "react";
import { Share2, Copy, Check } from "lucide-react";
import { useSession } from "next-auth/react";
import { useToast } from "@/context/ToastContext";

interface ShareButtonProps {
  slug: string;
  title: string;
  /** optional extra css classes for the button */
  className?: string;
  /** "icon" = icon-only button, "full" = icon + label */
  variant?: "icon" | "full";
}

export default function ShareButton({ slug, title, className = "", variant = "icon" }: ShareButtonProps) {
  const { data: session } = useSession();
  const toast = useToast();
  const [copied, setCopied] = useState(false);

  const buildUrl = () => {
    const base = typeof window !== "undefined" ? window.location.origin : "";
    const path = `/package/${slug}`;
    const ref = (session?.user as any)?.referralCode;
    return ref ? `${base}${path}?ref=${ref}` : `${base}${path}`;
  };

  const handleShare = async () => {
    const url = buildUrl();

    if (navigator.share) {
      try {
        await navigator.share({ title: `${title} — FirmCare`, url });
        return;
      } catch {
        // user cancelled or not supported — fall through to clipboard
      }
    }

    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success("Link copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  if (variant === "full") {
    return (
      <button
        onClick={handleShare}
        className={`flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors ${className}`}
        title="Share package"
      >
        {copied ? <Check className="w-4 h-4 text-green-600" /> : <Share2 className="w-4 h-4" />}
        {copied ? "Copied!" : "Share"}
      </button>
    );
  }

  return (
    <button
      onClick={handleShare}
      className={`p-2 rounded-full text-gray-400 hover:text-primary hover:bg-purple-50 transition-colors ${className}`}
      title="Share package"
      aria-label="Share package"
    >
      {copied ? <Check className="w-4 h-4 text-green-600" /> : <Share2 className="w-4 h-4" />}
    </button>
  );
}
