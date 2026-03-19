"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Calendar,
  Tag,
  CreditCard,
  Users,
  Settings,
  BarChart3,
  FileText,
  Gift,
  Mail,
  X,
  UserSquare2,
  Wallet,
  Shield,
  ClipboardList,
} from "lucide-react";

interface AdminSidebarProps {
  userRole: "ADMIN" | "SUPERADMIN" | "USER";
  isOpen: boolean;
  onClose: () => void;
}

const menuItems = [
  { name: "Dashboard",    href: "/admin",              icon: LayoutDashboard, roles: ["ADMIN", "SUPERADMIN"] },
  { name: "Packages",     href: "/admin/packages",     icon: Package,         roles: ["ADMIN", "SUPERADMIN"] },
  { name: "Bookings",     href: "/admin/bookings",     icon: Calendar,        roles: ["ADMIN", "SUPERADMIN"] },
  { name: "Promos",       href: "/admin/promos",       icon: Tag,             roles: ["ADMIN", "SUPERADMIN"] },
  { name: "Transactions", href: "/admin/transactions", icon: CreditCard,      roles: ["ADMIN", "SUPERADMIN"] },
  { name: "Analytics",    href: "/admin/analytics",    icon: BarChart3,       roles: ["ADMIN", "SUPERADMIN"] },
  { name: "Reports",      href: "/admin/reports",      icon: FileText,        roles: ["ADMIN", "SUPERADMIN"] },
  { name: "Referrals",    href: "/admin/referrals",    icon: Gift,            roles: ["ADMIN", "SUPERADMIN"] },
  { name: "Agents",       href: "/admin/agents",       icon: UserSquare2,     roles: ["ADMIN", "SUPERADMIN"] },
  { name: "Withdrawals",  href: "/admin/withdrawals",  icon: Wallet,          roles: ["ADMIN", "SUPERADMIN"] },
  { name: "Email",        href: "/admin/email",        icon: Mail,            roles: ["ADMIN", "SUPERADMIN"] },
  { name: "Users",        href: "/admin/users",        icon: Users,           roles: ["SUPERADMIN"] },
  { name: "Admins",       href: "/admin/admins",       icon: Shield,          roles: ["SUPERADMIN"] },
  { name: "Audit Log",    href: "/admin/audit",        icon: ClipboardList,   roles: ["SUPERADMIN"] },
  { name: "Settings",     href: "/admin/settings",     icon: Settings,        roles: ["SUPERADMIN"] },
];

export default function AdminSidebar({ userRole, isOpen, onClose }: AdminSidebarProps) {
  const pathname = usePathname();
  const filtered = menuItems.filter((item) => item.roles.includes(userRole));

  return (
    <aside
      className={`
        fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 z-50
        flex flex-col transition-transform duration-300 ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0
      `}
    >
      {/* Logo + mobile close button */}
      <div className="p-3.5 border-b border-gray-200 flex items-center justify-between shrink-0">
        <Link href="/admin" className="flex items-center gap-2" onClick={onClose}>
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shrink-0">
            <span className="text-white font-bold text-lg">F</span>
          </div>
          <div>
            <h1 className="font-bold text-base text-gray-900 leading-tight">FirmCare</h1>
            <p className="text-xs text-gray-500">Admin Panel</p>
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

      {/* Nav links */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
        {filtered.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href !== "/admin" && pathname.startsWith(item.href));

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

      {/* Role badge */}
      <div className="p-4 border-t border-gray-100 shrink-0">
        <div className="px-3 py-2 bg-purple-50 rounded-lg">
          <p className="text-xs font-semibold text-primary">Role: {userRole}</p>
        </div>
      </div>
    </aside>
  );
}
