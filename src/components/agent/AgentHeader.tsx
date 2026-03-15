"use client";

import { Menu, LogOut, Copy } from "lucide-react";
import { signOut } from "next-auth/react";
import { useToast } from "@/context/ToastContext";

interface AgentHeaderProps {
  user: { name?: string | null; email?: string | null; referralCode?: string | null };
  onMenuOpen: () => void;
}

export default function AgentHeader({ user, onMenuOpen }: AgentHeaderProps) {
  const toast = useToast();

  const copyCode = async () => {
    if (!user.referralCode) return;
    await navigator.clipboard.writeText(user.referralCode);
    toast.success("Referral code copied!");
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 shrink-0">
      <button
        onClick={onMenuOpen}
        className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      <div className="flex items-center gap-3 ml-auto">
        {user.referralCode && (
          <button
            onClick={copyCode}
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-purple-50 border border-purple-200 rounded-lg text-xs font-mono font-bold text-primary hover:bg-purple-100 transition-colors"
          >
            <span>My code: {user.referralCode}</span>
            <Copy className="w-3.5 h-3.5" />
          </button>
        )}

        <div className="text-right hidden sm:block">
          <p className="text-sm font-semibold text-gray-800 leading-tight">{user.name ?? "Agent"}</p>
          <p className="text-xs text-gray-400">{user.email}</p>
        </div>

        <button
          onClick={() => signOut({ callbackUrl: "/auth/login" })}
          className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
          title="Sign out"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}
