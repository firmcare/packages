"use client";

import { useState } from "react";
import { Save, Loader2, Lock, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/context/ToastContext";

interface Props {
  user: {
    id: string;
    name: string | null;
    email: string;
    phone: string | null;
    address: string | null;
    referralCode: string;
    createdAt: Date;
  };
}

export default function AgentProfileForm({ user }: Props) {
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name:    user.name    ?? "",
    phone:   user.phone   ?? "",
    address: user.address ?? "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/agent/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        toast.success("Profile updated successfully.");
      } else {
        toast.error("Failed to update profile.");
      }
    } catch {
      toast.error("An error occurred.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Full Name</label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email Address</label>
        <input
          type="email"
          value={user.email}
          readOnly
          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-400 cursor-not-allowed"
        />
        <p className="text-xs text-gray-400 mt-1">Contact admin to change your email.</p>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Phone Number</label>
        <input
          type="tel"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Address</label>
        <textarea
          rows={2}
          value={form.address}
          onChange={(e) => setForm({ ...form, address: e.target.value })}
          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Referral Code</label>
        <input
          type="text"
          value={user.referralCode}
          readOnly
          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-primary font-mono font-bold cursor-not-allowed"
        />
        <p className="text-xs text-gray-400 mt-1">
          Agent since {new Date(user.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" })}.
        </p>
      </div>

      <button
        type="submit"
        disabled={saving}
        className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-dark disabled:opacity-50 transition-colors"
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        {saving ? "Saving…" : "Save Changes"}
      </button>
    </form>
  );
}

export function AgentChangePasswordForm() {
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const [show, setShow] = useState({ current: false, next: false, confirm: false });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pw.next !== pw.confirm) {
      toast.error("New passwords do not match.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/agent/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: pw.current, newPassword: pw.next }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Password changed successfully.");
        setPw({ current: "", next: "", confirm: "" });
      } else {
        toast.error(data.error || "Failed to change password.");
      }
    } catch {
      toast.error("An error occurred.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
      <div className="flex items-center gap-2 mb-1">
        <Lock className="w-4 h-4 text-primary" />
        <h2 className="text-base font-semibold text-gray-800">Change Password</h2>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Current Password</label>
        <div className="relative">
          <input
            type={show.current ? "text" : "password"}
            value={pw.current}
            onChange={(e) => setPw({ ...pw, current: e.target.value })}
            required
            className="w-full px-4 py-2.5 pr-10 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
          />
          <button type="button" onClick={() => setShow({ ...show, current: !show.current })} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600">
            {show.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">New Password</label>
        <div className="relative">
          <input
            type={show.next ? "text" : "password"}
            value={pw.next}
            onChange={(e) => setPw({ ...pw, next: e.target.value })}
            required
            minLength={8}
            className="w-full px-4 py-2.5 pr-10 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
          />
          <button type="button" onClick={() => setShow({ ...show, next: !show.next })} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600">
            {show.next ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-1">Minimum 8 characters.</p>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Confirm New Password</label>
        <div className="relative">
          <input
            type={show.confirm ? "text" : "password"}
            value={pw.confirm}
            onChange={(e) => setPw({ ...pw, confirm: e.target.value })}
            required
            className="w-full px-4 py-2.5 pr-10 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
          />
          <button type="button" onClick={() => setShow({ ...show, confirm: !show.confirm })} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600">
            {show.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={saving}
        className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-dark disabled:opacity-50 transition-colors"
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
        {saving ? "Saving…" : "Change Password"}
      </button>
    </form>
  );
}
