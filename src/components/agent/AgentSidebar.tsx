"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Gift, Share2, User, Wallet, X } from "lucide-react";

interface AgentSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const menuItems = [
  { name: "Dashboard",   href: "/agent/dashboard",  icon: LayoutDashboard },
  { name: "My Referrals", href: "/agent/referrals", icon: Gift            },
  { name: "Wallet",      href: "/agent/wallet",     icon: Wallet          },
  { name: "Share Links", href: "/agent/share",      icon: Share2          },
  { name: "Profile",     href: "/agent/profile",    icon: User            },
];

export default function AgentSidebar({ isOpen, onClose }: AgentSidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={`
        fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 z-50
        flex flex-col transition-transform duration-300 ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0
      `}
    >
      {/* Logo */}
      <div className="p-5 border-b border-gray-200 flex items-center justify-between shrink-0">
        <Link href="/agent/dashboard" className="flex items-center gap-2" onClick={onClose}>
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shrink-0">
            <span className="text-white font-bold text-lg">F</span>
          </div>
          <div>
            <h1 className="font-bold text-base text-gray-900 leading-tight">FirmCare</h1>
            <p className="text-xs text-gray-500">Agent Portal</p>
          </div>
        </Link>
        <button
          onClick={onClose}
          className="lg:hidden p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          aria-label="Close sidebar"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium ${
                isActive
                  ? "bg-primary text-white"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              <Icon className="w-5 h-5 shrink-0" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Badge */}
      <div className="p-4 border-t border-gray-100 shrink-0">
        <div className="px-3 py-2 bg-purple-50 rounded-lg">
          <p className="text-xs font-semibold text-primary">Role: AGENT</p>
        </div>
      </div>
    </aside>
  );
}
