"use client";

import { signOut } from "next-auth/react";
import { LogOut, Menu, User, ChevronRight, Home } from "lucide-react";
import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import NotificationBell from "@/components/NotificationBell";

interface Props {
  user: { name?: string | null; email?: string | null };
  onMenuOpen: () => void;
}

const segmentLabels: Record<string, string> = {
  dashboard: "Dashboard",
  bookings: "My Bookings",
  profile: "Profile",
};

function useBreadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
  return segments
    .map((segment, index) => {
      const href = "/" + segments.slice(0, index + 1).join("/");
      const label = segmentLabels[segment];
      const isLast = index === segments.length - 1;
      return label ? { href, label, isLast } : null;
    })
    .filter(Boolean) as { href: string; label: string; isLast: boolean }[];
}

export default function DashboardHeader({ user, onMenuOpen }: Props) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const breadcrumbs = useBreadcrumbs();

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
      <div className="flex items-center justify-between px-4 lg:px-8 py-4">
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuOpen}
            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
          >
            <Menu className="w-6 h-6" />
          </button>

          <nav className="flex items-center gap-1 text-sm" aria-label="Breadcrumb">
            <Link href="/" className="text-gray-400 hover:text-primary transition-colors">
              <Home className="w-4 h-4" />
            </Link>
            {breadcrumbs.map((crumb) => (
              <span key={crumb.href} className="flex items-center gap-1">
                <ChevronRight className="w-4 h-4 text-gray-300" />
                {crumb.isLast ? (
                  <span className="font-semibold text-gray-900">{crumb.label}</span>
                ) : (
                  <Link href={crumb.href} className="text-gray-500 hover:text-primary transition-colors">
                    {crumb.label}
                  </Link>
                )}
              </span>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-1">
          <NotificationBell bookingsHref="/dashboard/bookings" />

          <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-3 p-2 hover:bg-gray-100 rounded-lg"
          >
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium text-gray-900">{user.name || "Patient"}</p>
              <p className="text-xs text-gray-500">{user.email}</p>
            </div>
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
              <Link
                href="/dashboard/profile"
                onClick={() => setShowUserMenu(false)}
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                <User className="w-4 h-4" />
                My Profile
              </Link>
              <hr className="my-1 border-gray-100" />
              <button
                onClick={() => signOut({ callbackUrl: "/auth/login" })}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          )}
          </div>
        </div>
      </div>
    </header>
  );
}
