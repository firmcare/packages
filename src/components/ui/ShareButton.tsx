"use client";

import { useState } from "react";
import { Share2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { useToast } from "@/context/ToastContext";
import ShareDialog from "./ShareDialog";

interface ShareButtonProps {
  slug: string;
  title: string;
  className?: string;
  variant?: "icon" | "full";
}

export default function ShareButton({ slug, title, className = "", variant = "icon" }: ShareButtonProps) {
  const { data: session } = useSession();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const buildUrl = () => {
    const base = typeof window !== "undefined"
      ? window.location.origin
      : (process.env.NEXT_PUBLIC_SITE_URL ?? "");
    const path = `/package/${slug}`;
    const ref = (session?.user as any)?.referralCode;
    return ref ? `${base}${path}?ref=${ref}` : `${base}${path}`;
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(buildUrl());
    setCopied(true);
    toast.success("Link copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const buttonClass =
    variant === "full"
      ? `flex items-center gap-2 px-4 py-2 border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors ${className || "rounded-lg"}`
      : className || `p-2 rounded-full text-gray-400 hover:text-primary hover:bg-purple-50 transition-colors`;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={buttonClass}
        title="Share package"
        aria-label="Share package"
      >
        <Share2 className="w-4 h-4" />
        {variant === "full" && <span>Share</span>}
      </button>

      {open && (
        <ShareDialog
          url={buildUrl()}
          title={`${title} — FirmCare`}
          onClose={() => setOpen(false)}
          copied={copied}
          onCopy={handleCopy}
        />
      )}
    </div>
  );
}
