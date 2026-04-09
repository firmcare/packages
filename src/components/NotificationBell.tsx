"use client";

import { useEffect, useRef } from "react";
import useSWR from "swr";
import { Bell, CheckCheck, BookOpen, Activity, FileCheck, CircleCheck, CircleX } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  bookingId: string | null;
  isRead: boolean;
  createdAt: string;
}

interface NotificationsResponse {
  notifications: Notification[];
  unreadCount: number;
}

const TYPE_ICON: Record<string, React.ReactNode> = {
  booking_confirmed: <BookOpen className="w-4 h-4 text-blue-500" />,
  status_update: <Activity className="w-4 h-4 text-purple-500" />,
  results_ready: <FileCheck className="w-4 h-4 text-teal-500" />,
  new_booking: <BookOpen className="w-4 h-4 text-primary" />,
  completed: <CircleCheck className="w-4 h-4 text-green-500" />,
  cancelled: <CircleX className="w-4 h-4 text-red-500" />,
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

interface Props {
  bookingsHref?: string;
}

export default function NotificationBell({ bookingsHref = "/dashboard/bookings" }: Props) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data, mutate } = useSWR<NotificationsResponse>("/api/notifications", {
    refreshInterval: 30_000,
  });

  const notifications = data?.notifications ?? [];
  const unreadCount = data?.unreadCount ?? 0;

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const markAllRead = async () => {
    await fetch("/api/notifications", { method: "PATCH" });
    mutate(
      (prev) => prev
        ? { ...prev, notifications: prev.notifications.map((n) => ({ ...n, isRead: true })), unreadCount: 0 }
        : prev,
      false
    );
  };

  const markOneRead = async (id: string) => {
    await fetch(`/api/notifications/${id}`, { method: "PATCH" });
    mutate(
      (prev) => prev
        ? {
            ...prev,
            notifications: prev.notifications.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
            unreadCount: Math.max(0, prev.unreadCount - 1),
          }
        : prev,
      false
    );
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors relative"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-4.5 h-4.5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 leading-none">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <span className="font-semibold text-gray-900 text-sm">Notifications</span>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-1 text-xs text-primary hover:text-primary-dark font-medium"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-96 overflow-y-auto divide-y divide-gray-50">
            {notifications.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <Bell className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-400">No notifications yet</p>
              </div>
            ) : (
              notifications.map((n) => {
                const icon = TYPE_ICON[n.type] ?? TYPE_ICON["status_update"];
                const href = n.bookingId ? bookingsHref : null;

                const inner = (
                  <div
                    className={`flex gap-3 px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer ${!n.isRead ? "bg-purple-50/40" : ""}`}
                    onClick={() => !n.isRead && markOneRead(n.id)}
                  >
                    <div className="mt-0.5 shrink-0">{icon}</div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm leading-snug ${!n.isRead ? "font-semibold text-gray-900" : "font-medium text-gray-700"}`}>
                        {n.title}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5 leading-relaxed line-clamp-2">
                        {n.message}
                      </p>
                      <p className="text-[11px] text-gray-400 mt-1">{timeAgo(n.createdAt)}</p>
                    </div>
                    {!n.isRead && (
                      <div className="w-2 h-2 bg-primary rounded-full mt-1.5 shrink-0" />
                    )}
                  </div>
                );

                return href ? (
                  <Link key={n.id} href={href} onClick={() => { setOpen(false); !n.isRead && markOneRead(n.id); }}>
                    {inner}
                  </Link>
                ) : (
                  <div key={n.id}>{inner}</div>
                );
              })
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="border-t border-gray-100 px-4 py-2.5 text-center">
              <Link
                href={bookingsHref}
                onClick={() => setOpen(false)}
                className="text-xs text-primary hover:text-primary-dark font-medium"
              >
                View all bookings
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
