"use client";

import { useState } from "react";
import { useScrollLock } from "@/hooks/useScrollLock";
import {
  User, Mail, Phone, Calendar, MapPin,
  CheckCircle, XCircle, Gift, X, BookOpen,
} from "lucide-react";
import Pagination from "@/components/ui/Pagination";
import { usePagination } from "@/hooks/usePagination";

interface UserData {
  id: string;
  email: string | null;
  name: string | null;
  phone: string | null;
  address: string | null;
  emailVerified: boolean;
  referralCode: string | null;
  referredByCode: string | null;
  createdAt: string;
  _count: { bookings: number };
}

interface UserManagementProps {
  users: UserData[];
}

function UserDetailsModal({ user, onClose }: { user: UserData; onClose: () => void }) {
  useScrollLock();
  const fmt = (iso: string) =>
    new Date(iso).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <span className="text-sm font-bold text-primary">
                {(user.name ?? user.email ?? "U").charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <p className="font-bold text-gray-900">{user.name ?? "—"}</p>
              <p className="text-xs text-gray-400">{user.email}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Details */}
        <div className="px-6 py-5 space-y-3">
          <Row icon={<Mail className="w-4 h-4" />} label="Email" value={user.email ?? "—"} />
          <Row icon={<Phone className="w-4 h-4" />} label="Phone" value={user.phone ?? "—"} />
          <Row icon={<MapPin className="w-4 h-4" />} label="Address" value={user.address ?? "—"} />
          <Row
            icon={user.emailVerified
              ? <CheckCircle className="w-4 h-4 text-green-500" />
              : <XCircle className="w-4 h-4 text-red-400" />}
            label="Email Verified"
            value={user.emailVerified ? "Verified" : "Not verified"}
            valueClass={user.emailVerified ? "text-green-600" : "text-red-500"}
          />
          <Row
            icon={<BookOpen className="w-4 h-4" />}
            label="Total Bookings"
            value={String(user._count.bookings)}
          />
          <Row
            icon={<Gift className="w-4 h-4" />}
            label="Referral Code"
            value={user.referralCode ?? "—"}
            mono
          />
          <Row
            icon={<Gift className="w-4 h-4" />}
            label="Referred By"
            value={user.referredByCode ?? "—"}
            mono
          />
          <Row
            icon={<Calendar className="w-4 h-4" />}
            label="Joined"
            value={fmt(user.createdAt)}
          />
        </div>
      </div>
    </div>
  );
}

function Row({
  icon, label, value, valueClass = "text-gray-900", mono = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  valueClass?: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 py-1">
      <span className="text-gray-300 shrink-0">{icon}</span>
      <span className="text-xs font-semibold text-gray-400 w-28 shrink-0">{label}</span>
      <span className={`text-sm truncate ${valueClass} ${mono ? "font-mono" : ""}`}>{value}</span>
    </div>
  );
}

export default function UserManagement({ users }: UserManagementProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selected, setSelected] = useState<UserData | null>(null);

  const filteredUsers = users.filter((user) =>
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.phone?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const { page, setPage, totalPages, paged, totalItems, pageSize } = usePagination(filteredUsers, 25);

  const fmt = (iso: string) =>
    new Date(iso).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });

  return (
    <>
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <input
            type="text"
            placeholder="Search by name, email or phone…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">Phone</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Bookings</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">Joined</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paged.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-sm text-gray-400 italic">
                    No users found.
                  </td>
                </tr>
              ) : paged.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-primary">
                          {(user.name ?? user.email ?? "U").charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <span className="font-medium text-gray-900 truncate max-w-35">
                        {user.name ?? <span className="text-gray-400 italic">No name</span>}
                      </span>
                      {!user.emailVerified && (
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-yellow-100 text-yellow-700 shrink-0">
                          Unverified
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap text-gray-500 hidden md:table-cell max-w-45">
                    <span className="truncate block max-w-45">{user.email ?? "—"}</span>
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap text-gray-500 hidden lg:table-cell">
                    {user.phone ?? "—"}
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap text-gray-900 hidden sm:table-cell">
                    {user._count.bookings}
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap text-gray-500 hidden lg:table-cell">
                    {fmt(user.createdAt)}
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap text-right">
                    <button
                      onClick={() => setSelected(user)}
                      className="text-xs font-semibold text-primary hover:underline"
                    >
                      Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-6 pb-4">
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} totalItems={totalItems} pageSize={pageSize} />
        </div>
      </div>

      {selected && (
        <UserDetailsModal user={selected} onClose={() => setSelected(null)} />
      )}
    </>
  );
}
