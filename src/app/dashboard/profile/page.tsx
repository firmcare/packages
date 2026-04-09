"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { User, Mail, Phone, MapPin, Copy, Check, Loader2, Save } from "lucide-react";
import useSWR from "swr";

interface Profile {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  address: string | null;
  referralCode: string;
  role: { name: string };
  _count: { bookings: number };
}

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [form, setForm] = useState({ name: "", phone: "", address: "" });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [formInitialized, setFormInitialized] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/auth/login?callbackUrl=/dashboard/profile");
  }, [status, router]);

  const { data: profile, isLoading: loading, mutate: mutateProfile } = useSWR<Profile>(
    session?.user ? "/api/users/me" : null
  );

  // Populate form once profile loads
  useEffect(() => {
    if (profile && !formInitialized) {
      setForm({ name: profile.name ?? "", phone: profile.phone ?? "", address: profile.address ?? "" });
      setFormInitialized(true);
    }
  }, [profile, formInitialized]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess(false);

    try {
      const res = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) throw new Error(await res.text());

      const updated = await res.json();
      mutateProfile((prev) => prev ? { ...prev, ...updated } : prev, false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save changes.");
    } finally {
      setSaving(false);
    }
  };

  const copyReferral = () => {
    if (profile?.referralCode) {
      navigator.clipboard.writeText(profile.referralCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
        <p className="text-gray-500 mt-1">Manage your personal information.</p>
      </div>

      {/* Account Summary */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 flex items-center gap-5">
        <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center shrink-0">
          <User className="w-8 h-8 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">{profile.name || "Patient"}</h2>
          <p className="text-gray-500 text-sm">{profile.email}</p>
          <div className="flex items-center gap-4 mt-2">
            <span className="text-xs font-medium bg-primary/10 text-primary px-2.5 py-1 rounded-full">
              {profile.role.name}
            </span>
            <span className="text-xs text-gray-500">{profile._count.bookings} booking{profile._count.bookings !== 1 ? "s" : ""}</span>
          </div>
        </div>
      </div>

      {/* Edit Form */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Personal Information</h3>

        {success && (
          <div className="mb-4 flex items-center gap-2 bg-green-50 text-green-700 px-4 py-3 rounded-lg text-sm font-medium">
            <Check className="w-4 h-4" /> Profile updated successfully.
          </div>
        )}
        {error && (
          <div className="mb-4 bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-5">
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
              <User className="w-4 h-4" /> Full Name
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Your full name"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
              <Mail className="w-4 h-4" /> Email Address
            </label>
            <input
              type="email"
              value={profile.email}
              disabled
              className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-500 cursor-not-allowed"
            />
            <p className="text-xs text-gray-400 mt-1">Email cannot be changed.</p>
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
              <Phone className="w-4 h-4" /> Phone Number
            </label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="+234 800 000 0000"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
              <MapPin className="w-4 h-4" /> Address
            </label>
            <textarea
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              placeholder="Your home or office address"
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary-dark transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </div>

      {/* Referral Code */}
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-6">
        <h3 className="font-semibold text-gray-900 mb-1">Referral Code</h3>
        <p className="text-sm text-gray-500 mb-4">Share this code with friends and family to invite them to FirmCare.</p>
        <div className="flex items-center gap-3">
          <code className="flex-1 bg-white border border-gray-200 rounded-lg px-4 py-3 text-lg font-mono font-bold text-primary tracking-widest">
            {profile.referralCode}
          </code>
          <button
            onClick={copyReferral}
            className="flex items-center gap-2 px-4 py-3 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      </div>
    </div>
  );
}
