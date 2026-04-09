"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
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
  BookOpen,
  X,
  UserSquare2,
  Wallet,
  Shield,
  ClipboardList,
  ChevronDown,
  TrendingUp,
  Megaphone,
  SlidersHorizontal,
  UsersRound,
  MapPin,
} from "lucide-react";

interface AdminSidebarProps {
  userRole: "ADMIN" | "SUPERADMIN" | "USER";
  isOpen: boolean;
  onClose: () => void;
}

type NavItem =
  | { type: "link"; name: string; href: string; icon: React.ElementType; roles: string[] }
  | {
      type: "group";
      name: string;
      icon: React.ElementType;
      roles: string[];
      children: { name: string; href: string; icon: React.ElementType; roles: string[] }[];
    };

const navItems: NavItem[] = [
  { type: "link",  name: "Dashboard", href: "/admin",           icon: LayoutDashboard, roles: ["ADMIN", "SUPERADMIN"] },
  { type: "link",  name: "Packages",  href: "/admin/packages",  icon: Package,         roles: ["ADMIN", "SUPERADMIN"] },
  { type: "link",  name: "Locations", href: "/admin/locations", icon: MapPin,           roles: ["ADMIN", "SUPERADMIN"] },
  { type: "link",  name: "Bookings",  href: "/admin/bookings",  icon: Calendar,        roles: ["ADMIN", "SUPERADMIN"] },
  {
    type: "group", name: "Finance",   icon: CreditCard,          roles: ["ADMIN", "SUPERADMIN"],
    children: [
      { name: "Transactions", href: "/admin/transactions", icon: CreditCard,  roles: ["ADMIN", "SUPERADMIN"] },
      { name: "Referrals",    href: "/admin/referrals",    icon: Gift,        roles: ["ADMIN", "SUPERADMIN"] },
      { name: "Withdrawals",  href: "/admin/withdrawals",  icon: Wallet,      roles: ["ADMIN", "SUPERADMIN"] },
      { name: "Agents",       href: "/admin/agents",       icon: UserSquare2, roles: ["ADMIN", "SUPERADMIN"] },
    ],
  },
  {
    type: "group", name: "Marketing", icon: Megaphone,           roles: ["ADMIN", "SUPERADMIN"],
    children: [
      { name: "Promos", href: "/admin/promos", icon: Tag,      roles: ["ADMIN", "SUPERADMIN"] },
      { name: "Email",  href: "/admin/email",  icon: Mail,     roles: ["ADMIN", "SUPERADMIN"] },
      { name: "Blog",   href: "/admin/blog",   icon: BookOpen, roles: ["ADMIN", "SUPERADMIN"] },
    ],
  },
  {
    type: "group", name: "Insights",  icon: TrendingUp,          roles: ["ADMIN", "SUPERADMIN"],
    children: [
      { name: "Analytics", href: "/admin/analytics", icon: BarChart3, roles: ["ADMIN", "SUPERADMIN"] },
      { name: "Reports",   href: "/admin/reports",   icon: FileText,  roles: ["ADMIN", "SUPERADMIN"] },
    ],
  },
  {
    type: "group", name: "Users",     icon: Users,               roles: ["SUPERADMIN"],
    children: [
      { name: "All Users", href: "/admin/users",  icon: Users,  roles: ["SUPERADMIN"] },
      { name: "Admins",    href: "/admin/admins", icon: Shield, roles: ["SUPERADMIN"] },
    ],
  },
  {
    type: "group", name: "System",    icon: SlidersHorizontal,   roles: ["SUPERADMIN"],
    children: [
      { name: "Team",      href: "/admin/team",     icon: UsersRound,    roles: ["SUPERADMIN"] },
      { name: "Audit Log", href: "/admin/audit",    icon: ClipboardList, roles: ["SUPERADMIN"] },
      { name: "Settings",  href: "/admin/settings", icon: Settings,      roles: ["SUPERADMIN"] },
    ],
  },
];

function getOpenGroups(pathname: string, items: NavItem[]): string[] {
  return items
    .filter((item): item is Extract<NavItem, { type: "group" }> => item.type === "group")
    .filter((group) => group.children.some((c) => pathname.startsWith(c.href)))
    .map((g) => g.name);
}

export default function AdminSidebar({ userRole, isOpen, onClose }: AdminSidebarProps) {
  const pathname = usePathname();
  const visible = navItems.filter((item) => item.roles.includes(userRole));
  const [openGroups, setOpenGroups] = useState<string[]>(() => getOpenGroups(pathname, visible));

  // Auto-open the group that contains the active route on navigation
  useEffect(() => {
    setOpenGroups((prev) => {
      const active = getOpenGroups(pathname, visible);
      const merged = Array.from(new Set([...prev, ...active]));
      return merged;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  function toggleGroup(name: string) {
    setOpenGroups((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );
  }

  return (
    <aside
      className={`
        fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 z-50
        flex flex-col transition-transform duration-300 ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0
      `}
    >
      {/* Logo + mobile close */}
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

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
        {visible.map((item) => {
          if (item.type === "link") {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium ${
                  isActive ? "bg-primary text-white" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                <Icon className="w-5 h-5 shrink-0" />
                {item.name}
              </Link>
            );
          }

          // Group
          const Icon = item.icon;
          const visibleChildren = item.children.filter((c) => c.roles.includes(userRole));
          const isExpanded = openGroups.includes(item.name);
          const hasActiveChild = visibleChildren.some((c) => pathname.startsWith(c.href));

          return (
            <div key={item.name}>
              <button
                onClick={() => toggleGroup(item.name)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium ${
                  hasActiveChild && !isExpanded
                    ? "bg-primary/10 text-primary"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span className="flex-1 text-left">{item.name}</span>
                <ChevronDown
                  className={`w-4 h-4 shrink-0 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                />
              </button>

              {isExpanded && (
                <div className="mt-0.5 ml-3 pl-3 border-l border-gray-200 space-y-0.5">
                  {visibleChildren.map((child) => {
                    const ChildIcon = child.icon;
                    const isActive = pathname.startsWith(child.href);
                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        onClick={onClose}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm font-medium ${
                          isActive ? "bg-primary text-white" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                        }`}
                      >
                        <ChildIcon className="w-4 h-4 shrink-0" />
                        {child.name}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
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
