"use client";

import { CalendarDays } from "lucide-react";

export interface DateRange {
  from: string; // YYYY-MM-DD or ""
  to: string;   // YYYY-MM-DD or ""
}

interface Props {
  value: DateRange;
  onChange: (range: DateRange) => void;
  className?: string;
}

function fmt(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function getPresets() {
  const now = new Date();
  const todayStr = fmt(now);
  const ago = (n: number) => { const d = new Date(); d.setDate(d.getDate() - n); return fmt(d); };
  return [
    { label: "All time",    from: "",                                                                to: "" },
    { label: "Today",       from: todayStr,                                                          to: todayStr },
    { label: "7 days",      from: ago(7),                                                            to: "" },
    { label: "30 days",     from: ago(30),                                                           to: "" },
    { label: "This month",  from: fmt(new Date(now.getFullYear(), now.getMonth(), 1)),               to: fmt(new Date(now.getFullYear(), now.getMonth() + 1, 0)) },
    { label: "Last month",  from: fmt(new Date(now.getFullYear(), now.getMonth() - 1, 1)),          to: fmt(new Date(now.getFullYear(), now.getMonth(), 0)) },
  ];
}

export function inRange(dateStr: string | Date, from: string, to: string): boolean {
  if (!from && !to) return true;
  const dStr = fmt(new Date(dateStr));
  if (from && dStr < from) return false;
  if (to && dStr > to) return false;
  return true;
}

export default function DateRangeFilter({ value, onChange, className }: Props) {
  const presets = getPresets();
  const active = presets.find(p => p.from === value.from && p.to === value.to)?.label;

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className ?? ""}`}>
      <CalendarDays className="w-4 h-4 text-gray-400 shrink-0" />
      <div className="flex items-center gap-1 flex-wrap">
        {presets.map(p => (
          <button
            key={p.label}
            type="button"
            onClick={() => onChange({ from: p.from, to: p.to })}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              active === p.label
                ? "bg-primary text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap w-full sm:w-auto">
        <input
          type="date"
          value={value.from}
          onChange={e => onChange({ ...value, from: e.target.value })}
          className="h-7 flex-1 min-w-0 px-2 text-xs border border-gray-200 rounded-lg bg-white text-gray-700 focus:ring-1 focus:ring-primary focus:outline-none"
        />
        <span className="text-xs text-gray-400 shrink-0">→</span>
        <input
          type="date"
          value={value.to}
          onChange={e => onChange({ ...value, to: e.target.value })}
          className="h-7 flex-1 min-w-0 px-2 text-xs border border-gray-200 rounded-lg bg-white text-gray-700 focus:ring-1 focus:ring-primary focus:outline-none"
        />
      </div>
    </div>
  );
}
