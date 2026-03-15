"use client";

import { useState } from "react";
import { Copy, Check, Share2, ExternalLink } from "lucide-react";
import { useToast } from "@/context/ToastContext";

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
  siteUrl: string;
}

export default function AgentShareLinks({ referralCode, packages, siteUrl }: Props) {
  const toast = useToast();
  const [copied, setCopied] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const allPkgsUrl = `${siteUrl}/category/all?ref=${referralCode}`;

  const copy = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(id);
    toast.success("Link copied to clipboard!");
    setTimeout(() => setCopied(null), 2000);
  };

  const share = async (url: string, title: string) => {
    if (navigator.share) {
      await navigator.share({ title: `${title} — FirmCare`, url });
    } else {
      await copy(url, title);
    }
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
        <p className="font-mono text-sm break-all text-white/90 mb-4">{allPkgsUrl}</p>
        <div className="flex items-center gap-3">
          <button
            onClick={() => copy(allPkgsUrl, "master")}
            className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-semibold transition-colors"
          >
            {copied === "master" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            Copy
          </button>
          <button
            onClick={() => share(allPkgsUrl, "All Packages")}
            className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-semibold transition-colors"
          >
            <Share2 className="w-4 h-4" />
            Share
          </button>
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
                <div className="flex items-center gap-2 shrink-0">
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
                  <button
                    onClick={() => share(url, pkg.title)}
                    className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
                    title="Share"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
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
