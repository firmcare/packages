"use client";

import { TrendingUp, TrendingDown, Minus, CalendarDays, Banknote, Users, Package, LucideIcon } from "lucide-react";

type Color    = "blue" | "emerald" | "violet" | "amber";
type IconName = "calendar" | "banknote" | "users" | "package";

const COLORS: Record<Color, { border: string; iconBg: string; iconText: string }> = {
  blue:    { border: "border-t-blue-500",    iconBg: "bg-blue-50",    iconText: "text-blue-600"    },
  emerald: { border: "border-t-emerald-500", iconBg: "bg-emerald-50", iconText: "text-emerald-600" },
  violet:  { border: "border-t-violet-500",  iconBg: "bg-violet-50",  iconText: "text-violet-600"  },
  amber:   { border: "border-t-amber-500",   iconBg: "bg-amber-50",   iconText: "text-amber-600"   },
};

const ICONS: Record<IconName, LucideIcon> = {
  calendar: CalendarDays,
  banknote: Banknote,
  users:    Users,
  package:  Package,
};

interface Stat {
  title: string;
  value: string;
  tooltip?: string;
  change: string | null;
  trend: "up" | "down" | "neutral";
  color?: Color;
  iconName?: IconName;
}

export default function DashboardStats({ stats }: { stats: Stat[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, i) => {
        const c    = COLORS[stat.color ?? "blue"];
        const Icon = stat.iconName ? ICONS[stat.iconName] : null;
        return (
          <div key={i} className={`bg-white rounded-xl shadow-sm border border-gray-100 border-t-4 ${c.border} p-6`}>
            <div className="flex items-start justify-between mb-4">
              {Icon && (
                <div className={`p-2.5 rounded-xl ${c.iconBg}`}>
                  <Icon className={`w-5 h-5 ${c.iconText}`} />
                </div>
              )}
              {stat.change !== null && (
                <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${
                  stat.trend === "up"
                    ? "bg-green-50 text-green-600"
                    : stat.trend === "down"
                    ? "bg-red-50 text-red-600"
                    : "bg-gray-100 text-gray-500"
                }`}>
                  {stat.trend === "up"      && <TrendingUp  className="w-3 h-3" />}
                  {stat.trend === "down"    && <TrendingDown className="w-3 h-3" />}
                  {stat.trend === "neutral" && <Minus        className="w-3 h-3" />}
                  {stat.change}
                </div>
              )}
            </div>
            <p className="text-sm text-gray-500 mb-1">{stat.title}</p>
            <h3 className="text-3xl font-bold text-gray-900" title={stat.tooltip}>
              {stat.value}
            </h3>
            {stat.change !== null && (
              <p className="text-xs text-gray-400 mt-2">vs last month</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
