"use client";

import { useState } from "react";
import {
  Shield, UserPlus, Mail, Calendar, Loader2, X,
  ChevronDown, RefreshCw, Eye, EyeOff, Copy, Check, UserMinus, KeyRound,
} from "lucide-react";
import { useToast } from "@/context/ToastContext";
import ConfirmModal from "@/components/ui/ConfirmModal";

interface AdminUser {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  createdAt: string;
  emailVerified: boolean;
  isActive: boolean;
  role: { id: string; name: string };
  _count: { bookings: number };
}

interface Props {
  admins: AdminUser[];
  currentUserId: string;
}

const ROLE_BADGE: Record<string, string> = {
  SUPERADMIN: "bg-red-100 text-red-700 border border-red-200",
  ADMIN:      "bg-purple-100 text-purple-700 border border-purple-200",
};

export default function AdminsManager({ admins: initial, currentUserId }: Props) {
  const toast = useToast();
  const [admins, setAdmins] = useState<AdminUser[]>(initial);

  // ── Invite form state ───────────────────────────────────────────────────────
  const [showForm, setShowForm]       = useState(false);
  const [formName, setFormName]       = useState("");
  const [formEmail, setFormEmail]     = useState("");
  const [formRole, setFormRole]       = useState<"ADMIN" | "SUPERADMIN">("ADMIN");
  const [formPassword, setFormPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [creating, setCreating]       = useState(false);
  const [copiedPwd, setCopiedPwd]     = useState(false);
  const [createdTempPwd, setCreatedTempPwd] = useState<string | null>(null);

  // ── Role-change / revoke / reset state ─────────────────────────────────────
  const [confirmRevoke, setConfirmRevoke] = useState<AdminUser | null>(null);
  const [confirmPromote, setConfirmPromote] = useState<{ user: AdminUser; toRole: "ADMIN" | "SUPERADMIN" } | null>(null);
  const [actioning, setActioning] = useState<string | null>(null);
  const [resetPwdResult, setResetPwdResult] = useState<{ name: string; tempPassword: string } | null>(null);

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const fmt = (iso: string) =>
    new Date(iso).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });

  const copyPassword = (pwd: string) => {
    navigator.clipboard.writeText(pwd).then(() => {
      setCopiedPwd(true);
      setTimeout(() => setCopiedPwd(false), 2000);
    });
  };

  // ── Create admin ─────────────────────────────────────────────────────────────
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch("/api/admin/admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: formName, email: formEmail, role: formRole, password: formPassword || undefined }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Failed to create admin."); return; }

      if (data.isUpgrade) {
        toast.success(`${formEmail} has been upgraded to ${formRole}.`);
        setAdmins((prev) => {
          const existing = prev.find((a) => a.id === data.id);
          if (existing) return prev.map((a) => a.id === data.id ? { ...a, role: data.role } : a);
          return [{ ...data, phone: null, emailVerified: true, _count: { bookings: 0 } }, ...prev];
        });
      } else {
        if (data.tempPassword) {
          setCreatedTempPwd(data.tempPassword);
          toast.success("Admin created! Copy the temporary password below.");
        } else {
          toast.success("Admin created successfully.");
        }
        setAdmins((prev) => [{ ...data, phone: null, emailVerified: true, _count: { bookings: 0 } }, ...prev]);
      }

      setFormName(""); setFormEmail(""); setFormPassword(""); setShowForm(false);
    } catch {
      toast.error("An error occurred.");
    } finally {
      setCreating(false);
    }
  };

  // ── Change role ───────────────────────────────────────────────────────────────
  const handleRoleChange = async (user: AdminUser, toRole: "ADMIN" | "SUPERADMIN") => {
    setActioning(user.id);
    try {
      const res = await fetch(`/api/admin/admins/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: toRole }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Failed to change role."); return; }
      setAdmins((prev) => prev.map((a) => a.id === user.id ? { ...a, role: data.role } : a));
      toast.success(`${user.name ?? user.email} is now ${toRole}.`);
    } catch {
      toast.error("An error occurred.");
    } finally {
      setActioning(null);
      setConfirmPromote(null);
    }
  };

  // ── Deactivate admin ──────────────────────────────────────────────────────────
  const handleRevoke = async (user: AdminUser) => {
    setActioning(user.id);
    try {
      const res = await fetch(`/api/admin/admins/${user.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Failed to deactivate admin."); return; }
      setAdmins((prev) => prev.map((a) => a.id === user.id ? { ...a, isActive: false } : a));
      toast.success(`${user.name ?? user.email}'s account has been deactivated.`);
    } catch {
      toast.error("An error occurred.");
    } finally {
      setActioning(null);
      setConfirmRevoke(null);
    }
  };

  // ── Reactivate admin ──────────────────────────────────────────────────────────
  const handleReactivate = async (user: AdminUser) => {
    setActioning(user.id);
    try {
      const res = await fetch(`/api/admin/admins/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reactivate" }),
      });
      if (!res.ok) { toast.error("Failed to reactivate admin."); return; }
      setAdmins((prev) => prev.map((a) => a.id === user.id ? { ...a, isActive: true } : a));
      toast.success(`${user.name ?? user.email}'s account has been reactivated.`);
    } catch {
      toast.error("An error occurred.");
    } finally {
      setActioning(null);
    }
  };

  // ── Reset admin password ──────────────────────────────────────────────────────
  const handleResetPassword = async (user: AdminUser) => {
    setActioning(user.id);
    try {
      const res = await fetch(`/api/admin/admins/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset_password" }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error("Failed to reset password."); return; }
      setResetPwdResult({ name: user.name ?? user.email ?? "Admin", tempPassword: data.tempPassword });
      toast.success("Password reset successfully.");
    } catch {
      toast.error("An error occurred.");
    } finally {
      setActioning(null);
    }
  };

  return (
    <div className="space-y-6">

      {/* ── Invite / onboard form ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <button
          onClick={() => setShowForm((v) => !v)}
          className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <UserPlus className="w-4.5 h-4.5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">Onboard New Admin</p>
              <p className="text-xs text-gray-400">Add a new admin or promote an existing user</p>
            </div>
          </div>
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showForm ? "rotate-180" : ""}`} />
        </button>

        {showForm && (
          <form onSubmit={handleCreate} className="px-6 pb-6 border-t border-gray-100 pt-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Full Name *</label>
                <input
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Jane Doe"
                  className="w-full h-10 px-3 border border-gray-200 rounded-xl text-sm bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Email Address *</label>
                <input
                  required
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="jane@firmcare.com.ng"
                  className="w-full h-10 px-3 border border-gray-200 rounded-xl text-sm bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Role *</label>
                <select
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value as "ADMIN" | "SUPERADMIN")}
                  className="w-full h-10 px-3 border border-gray-200 rounded-xl text-sm bg-white"
                >
                  <option value="ADMIN">Admin</option>
                  <option value="SUPERADMIN">Super Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  Password <span className="text-gray-400 font-normal">(auto-generated if blank)</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    placeholder="Leave blank to auto-generate"
                    className="w-full h-10 px-3 pr-9 border border-gray-200 rounded-xl text-sm bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <p className="text-xs text-gray-400">
              If the email already belongs to an existing user, their role will be upgraded instead of creating a new account.
              Auto-generated passwords are shown once in the toast notification — copy them immediately.
            </p>

            <div className="flex items-center gap-3 pt-1">
              <button
                type="submit"
                disabled={creating}
                className="flex items-center gap-2 px-5 py-2 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-50"
              >
                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                {creating ? "Creating…" : "Create Admin"}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-5 py-2 text-sm font-semibold text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      {/* ── Reset password result banner ── */}
      {resetPwdResult && (
        <div className="flex items-center justify-between gap-4 p-4 bg-blue-50 border border-blue-200 rounded-2xl">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-blue-800 mb-1">
              Temporary Password for {resetPwdResult.name} — copy and share securely
            </p>
            <p className="font-mono text-sm font-bold text-blue-900 tracking-wider break-all">{resetPwdResult.tempPassword}</p>
            <p className="text-xs text-blue-600 mt-1">This is shown once. The admin should change it after next login.</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => copyPassword(resetPwdResult.tempPassword)}
              className="flex items-center gap-1.5 px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-800 text-xs font-semibold rounded-xl transition-colors"
            >
              {copiedPwd ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedPwd ? "Copied!" : "Copy"}
            </button>
            <button
              onClick={() => setResetPwdResult(null)}
              className="p-2 hover:bg-blue-100 text-blue-600 rounded-xl transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── Temp password banner ── */}
      {createdTempPwd && (
        <div className="flex items-center justify-between gap-4 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-amber-800 mb-1">Temporary Password — copy and share securely</p>
            <p className="font-mono text-sm font-bold text-amber-900 tracking-wider break-all">{createdTempPwd}</p>
            <p className="text-xs text-amber-600 mt-1">This is shown once. The admin should change it after first login.</p>
          </div>
          <button
            onClick={() => copyPassword(createdTempPwd)}
            className="shrink-0 flex items-center gap-1.5 px-3 py-2 bg-amber-100 hover:bg-amber-200 text-amber-800 text-xs font-semibold rounded-xl transition-colors"
          >
            {copiedPwd ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copiedPwd ? "Copied!" : "Copy"}
          </button>
        </div>
      )}

      {/* ── Admins table ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/60">
          <p className="text-sm font-bold text-gray-900">
            Admin Accounts
            <span className="ml-2 text-xs font-semibold text-gray-400">({admins.length})</span>
          </p>
          <p className="text-xs text-gray-400 mt-0.5">All users with ADMIN or SUPERADMIN access</p>
        </div>

        {admins.length === 0 ? (
          <p className="text-center text-sm text-gray-400 italic py-10">No admin accounts found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Admin</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Joined</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {admins.map((admin) => {
                  const isSelf = admin.id === currentUserId;
                  const isActioning = actioning === admin.id;
                  return (
                    <tr key={admin.id} className={`hover:bg-gray-50/60 transition-colors ${!admin.isActive ? "opacity-60" : ""}`}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <span className="text-xs font-bold text-primary">
                              {(admin.name ?? admin.email ?? "A").charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-gray-900 truncate">
                                {admin.name ?? "—"}
                                {isSelf && <span className="ml-1.5 text-xs font-medium text-gray-400">(you)</span>}
                              </p>
                              {!admin.isActive && (
                                <span className="px-1.5 py-0.5 bg-red-100 text-red-600 text-xs font-semibold rounded shrink-0">Deactivated</span>
                              )}
                            </div>
                            <div className="flex items-center gap-1 text-xs text-gray-400">
                              <Mail className="w-3 h-3 shrink-0" />
                              <span className="truncate">{admin.email}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${ROLE_BADGE[admin.role.name] ?? "bg-gray-100 text-gray-600"}`}>
                          <Shield className="w-3 h-3" />
                          {admin.role.name === "SUPERADMIN" ? "Super Admin" : "Admin"}
                        </span>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell">
                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                          <Calendar className="w-3.5 h-3.5 text-gray-300" />
                          {fmt(admin.createdAt)}
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        {isSelf ? (
                          <span className="text-xs text-gray-300 italic">—</span>
                        ) : admin.isActive ? (
                          <div className="flex items-center gap-2 justify-end">
                            <button
                              disabled={isActioning}
                              onClick={() => handleResetPassword(admin)}
                              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-40"
                              title="Reset password"
                            >
                              {isActioning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <KeyRound className="w-3.5 h-3.5" />}
                              Reset Pwd
                            </button>
                            <button
                              disabled={isActioning}
                              onClick={() => setConfirmPromote({
                                user: admin,
                                toRole: admin.role.name === "ADMIN" ? "SUPERADMIN" : "ADMIN",
                              })}
                              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-40"
                            >
                              {isActioning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                              {admin.role.name === "ADMIN" ? "Promote" : "Demote"}
                            </button>
                            <button
                              disabled={isActioning}
                              onClick={() => setConfirmRevoke(admin)}
                              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-40"
                            >
                              <UserMinus className="w-3.5 h-3.5" />
                              Deactivate
                            </button>
                          </div>
                        ) : (
                          <button
                            disabled={isActioning}
                            onClick={() => handleReactivate(admin)}
                            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-green-700 border border-green-200 rounded-lg hover:bg-green-50 transition-colors disabled:opacity-40"
                          >
                            {isActioning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                            Reactivate
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Confirm promote/demote ── */}
      {confirmPromote && (
        <ConfirmModal
          open
          title={confirmPromote.toRole === "SUPERADMIN" ? "Promote to Super Admin?" : "Demote to Admin?"}
          description={
            confirmPromote.toRole === "SUPERADMIN"
              ? `${confirmPromote.user.name ?? confirmPromote.user.email} will gain full Super Admin access, including the ability to manage other admins and all settings.`
              : `${confirmPromote.user.name ?? confirmPromote.user.email} will lose Super Admin privileges and become a regular Admin.`
          }
          confirmLabel={confirmPromote.toRole === "SUPERADMIN" ? "Yes, Promote" : "Yes, Demote"}
          variant="warning"
          onConfirm={() => handleRoleChange(confirmPromote.user, confirmPromote.toRole)}
          onCancel={() => setConfirmPromote(null)}
        />
      )}

      {/* ── Confirm revoke ── */}
      {confirmRevoke && (
        <ConfirmModal
          open
          title="Revoke admin access?"
          description={`${confirmRevoke.name ?? confirmRevoke.email}'s admin account will be deactivated. Their account and bookings remain, but they will be blocked from accessing the admin panel until reactivated.`}
          confirmLabel="Yes, Deactivate"
          variant="danger"
          onConfirm={() => handleRevoke(confirmRevoke)}
          onCancel={() => setConfirmRevoke(null)}
        />
      )}
    </div>
  );
}
