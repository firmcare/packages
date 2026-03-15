"use client";

import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface Stat {
  title: string;
  value: string;
  change: string;
  trend: "up" | "down" | "neutral";
}

interface DashboardStatsProps {
  stats: Stat[];
}

export default function DashboardStats({ stats }: DashboardStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <div key={index} className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 mb-2">{stat.title}</p>
          <div className="flex items-end justify-between">
            <h3 className="text-3xl font-bold text-gray-900">{stat.value}</h3>
            <div
              className={`flex items-center gap-1 text-sm font-medium ${
                stat.trend === "up"
                  ? "text-green-600"
                  : stat.trend === "down"
                  ? "text-red-600"
                  : "text-gray-600"
              }`}
            >
              {stat.trend === "up" && <TrendingUp className="w-4 h-4" />}
              {stat.trend === "down" && <TrendingDown className="w-4 h-4" />}
              {stat.trend === "neutral" && <Minus className="w-4 h-4" />}
              <span>{stat.change}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

