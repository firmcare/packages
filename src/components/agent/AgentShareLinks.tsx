"use client";

import { useState } from "react";
import { Copy, Check, Share2, ExternalLink } from "lucide-react";
import { useToast } from "@/context/ToastContext";
import ShareDialog from "@/components/ui/ShareDialog";

interface Package {
  id: string;
  title: string;
  slug: string;
  price: number;
  category: string;
}

interface Props {
  referralCode: string;
  packages: Package[];
}

export default function AgentShareLinks({ referralCode, packages }: Props) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://firmcare.com.ng";
  const toast = useToast();
  const [copied, setCopied] = useState<string | null>(null);
  const [shareOpen, setShareOpen] = useState<string | null>(null); // id of open dialog
  const [search, setSearch] = useState("");

  // Master link goes to home with ?ref= so the code persists across any navigation
  const allPkgsUrl = `${siteUrl}?ref=${referralCode}`;

  const copy = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(id);
    toast.success("Link copied to clipboard!");
    setTimeout(() => setCopied(null), 2000);
  };

  const filtered = packages.filter((p) =>
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Master link */}
      <div className="bg-gradient-to-r from-primary to-[#8a3a7a] rounded-2xl p-6 text-white">
        <p className="text-white/80 text-sm font-medium mb-1">All Packages — Master Link</p>
        <p className="text-xs text-white/60 mb-2">
          Anyone who visits via this link will have your referral code automatically applied at checkout, regardless of which package they choose.
        </p>
        <p className="font-mono text-sm break-all text-white/90 mb-4">{allPkgsUrl}</p>
        <div className="flex items-center gap-3 relative">
          <button
            onClick={() => copy(allPkgsUrl, "master")}
            className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-semibold transition-colors"
          >
            {copied === "master" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            Copy
          </button>
          <div className="relative">
            <button
              onClick={() => setShareOpen(shareOpen === "master" ? null : "master")}
              className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-semibold transition-colors"
            >
              <Share2 className="w-4 h-4" />
              Share
            </button>
            {shareOpen === "master" && (
              <ShareDialog
                url={allPkgsUrl}
                title="FirmCare Diagnostics — Book a health screening"
                onClose={() => setShareOpen(null)}
                copied={copied === "master-dialog"}
                onCopy={() => copy(allPkgsUrl, "master-dialog")}
              />
            )}
          </div>
        </div>
      </div>

      {/* Per-package links */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-4 border-b border-gray-100">
          <input
            type="text"
            placeholder="Search packages…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>

        <div className="divide-y divide-gray-50">
          {filtered.map((pkg) => {
            const url = `${siteUrl}/package/${pkg.slug}?ref=${referralCode}`;
            return (
              <div key={pkg.id} className="px-5 py-4 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{pkg.title}</p>
                  <p className="text-xs text-gray-400">{pkg.category} · ₦{pkg.price.toLocaleString()}</p>
                  <p className="text-xs text-gray-400 font-mono truncate mt-0.5">{url}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => copy(url, pkg.id)}
                    className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
                    title="Copy link"
                  >
                    {copied === pkg.id ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                  <div className="relative">
                    <button
                      onClick={() => setShareOpen(shareOpen === pkg.id ? null : pkg.id)}
                      className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
                      title="Share"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                    {shareOpen === pkg.id && (
                      <ShareDialog
                        url={url}
                        title={`${pkg.title} — FirmCare`}
                        onClose={() => setShareOpen(null)}
                        copied={copied === `${pkg.id}-dialog`}
                        onCopy={() => copy(url, `${pkg.id}-dialog`)}
                      />
                    )}
                  </div>
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
                    title="Open"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="px-5 py-10 text-center text-gray-400 text-sm">No packages found.</div>
          )}
        </div>
      </div>
    </div>
  );
}
