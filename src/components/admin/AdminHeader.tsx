"use client";

import { signOut } from "next-auth/react";
import { LogOut, Menu, ChevronRight, Home } from "lucide-react";
import NotificationBell from "@/components/NotificationBell";
import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";

interface AdminHeaderProps {
  user: {
    name?: string | null;
    email?: string | null;
    role: string;
  };
  onMenuOpen: () => void;
}

const segmentLabels: Record<string, string> = {
  admin: "Dashboard",
  packages: "Packages",
  bookings: "Bookings",
  promos: "Promos",
  transactions: "Transactions",
  analytics: "Analytics",
  reports: "Reports",
  referrals: "Referrals",
  tests: "Tests",
  users: "Users",
  settings: "Settings",
  new: "New",
  edit: "Edit",
  detail: "Details",
};

function useBreadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
  return segments
    .map((seg, i) => {
      const label = segmentLabels[seg];
      if (!label) return null;
      return {
        href: "/" + segments.slice(0, i + 1).join("/"),
        label,
        isLast: i === segments.length - 1,
      };
    })
    .filter(Boolean) as { href: string; label: string; isLast: boolean }[];
}

export default function AdminHeader({ user, onMenuOpen }: AdminHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const breadcrumbs = useBreadcrumbs();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const initials = (user.name ?? user.email ?? "A")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
      <div className="flex items-center justify-between px-4 lg:px-8 h-16">

        {/* Left: hamburger + breadcrumb */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onMenuOpen}
            className="lg:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors shrink-0"
            aria-label="Open sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Breadcrumb — sm and up */}
          <nav className="hidden sm:flex items-center gap-1 text-sm min-w-0" aria-label="Breadcrumb">
            <Link href="/" className="text-gray-400 hover:text-primary transition-colors shrink-0">
              <Home className="w-4 h-4" />
            </Link>
            {breadcrumbs.map((crumb) => (
              <span key={crumb.href} className="flex items-center gap-1 min-w-0">
                <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
                {crumb.isLast ? (
                  <span className="font-semibold text-gray-900 truncate">{crumb.label}</span>
                ) : (
                  <Link href={crumb.href} className="text-gray-500 hover:text-primary transition-colors truncate">
                    {crumb.label}
                  </Link>
                )}
              </span>
            ))}
          </nav>

          {/* Current page title — mobile only */}
          <span className="sm:hidden font-semibold text-gray-900 truncate">
            {breadcrumbs.at(-1)?.label ?? "Admin"}
          </span>
        </div>

        {/* Right: bell + user menu */}
        <div className="flex items-center gap-1 shrink-0">
          <NotificationBell bookingsHref="/admin/bookings" />

          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="flex items-center gap-2 p-1.5 pl-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="User menu"
            >
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center shrink-0">
                <span className="text-white text-xs font-bold">{initials}</span>
              </div>
              <div className="hidden md:block text-left leading-tight max-w-32">
                <p className="text-sm font-semibold text-gray-900 truncate">{user.name ?? "Admin"}</p>
                <p className="text-xs text-gray-400 truncate">{user.email}</p>
              </div>
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-50">
                {/* Mobile-only user info */}
                <div className="px-4 py-3 border-b border-gray-100 md:hidden">
                  <p className="text-sm font-semibold text-gray-900 truncate">{user.name ?? "Admin"}</p>
                  <p className="text-xs text-gray-400 truncate">{user.email}</p>
                  <span className="inline-block mt-1.5 text-xs font-semibold text-primary bg-purple-50 px-2 py-0.5 rounded-full">
                    {user.role}
                  </span>
                </div>

                <Link
                  href="/"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Home className="w-4 h-4 text-gray-400" />
                  View Site
                </Link>

                <div className="border-t border-gray-100 mt-1 pt-1">
                  <button
                    onClick={() => signOut({ callbackUrl: "/auth/admin/login" })}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors rounded-b-xl"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
