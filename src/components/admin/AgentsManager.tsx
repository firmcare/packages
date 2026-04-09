"use client";

import { useState, useEffect } from "react";
import { useScrollLock, ScrollLock } from "@/hooks/useScrollLock";
import { Plus, Copy, Check, RefreshCw, UserMinus, UserPlus, Loader2, X, Phone, Mail, Calendar, Tag, TrendingUp, Clock, Wallet, ChevronRight } from "lucide-react";
import { useToast } from "@/context/ToastContext";
import Pagination, { PageSizeSelector } from "@/components/ui/Pagination";
import { usePagination } from "@/hooks/usePagination";

interface Agent {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  referralCode: string;
  createdAt: string;
  isActive: boolean;
  totalReferrals: number;
  pendingAmount: number;
  availableAmount: number;
  paidOutAmount: number;
  totalEarned: number;
}

interface NewAgentForm {
  name: string;
  email: string;
  phone: string;
}

const fmt = (n: number) => "₦" + n.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" });

function AgentModal({
  agent,
  onClose,
  onAction,
  actionId,
  onCopy,
  copied,
}: {
  agent: Agent;
  onClose: () => void;
  onAction: (id: string, action: "deactivate" | "reactivate") => void;
  actionId: string | null;
  onCopy: (text: string, id: string) => void;
  copied: string | null;
}) {
  useScrollLock();
  const busy = actionId === agent.id;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-primary font-bold text-sm">
                {(agent.name ?? agent.email).slice(0, 2).toUpperCase()}
              </span>
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">{agent.name ?? "—"}</h2>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${agent.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                {agent.isActive ? "Active" : "Deactivated"}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Contact info */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-3 text-sm text-gray-700">
              <Mail className="w-4 h-4 text-gray-400 shrink-0" />
              {agent.email}
            </div>
            {agent.phone && (
              <div className="flex items-center gap-3 text-sm text-gray-700">
                <Phone className="w-4 h-4 text-gray-400 shrink-0" />
                {agent.phone}
              </div>
            )}
            <div className="flex items-center gap-3 text-sm text-gray-700">
              <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
              Joined {fmtDate(agent.createdAt)}
            </div>
            <div className="flex items-center gap-3">
              <Tag className="w-4 h-4 text-gray-400 shrink-0" />
              <span className="font-mono font-bold text-primary text-sm">{agent.referralCode}</span>
              <button
                onClick={() => onCopy(agent.referralCode, agent.id + "-modal-code")}
                className="p-1 hover:bg-gray-100 rounded"
              >
                {copied === agent.id + "-modal-code"
                  ? <Check className="w-3.5 h-3.5 text-green-600" />
                  : <Copy className="w-3.5 h-3.5 text-gray-400" />}
              </button>
            </div>
          </div>

          {/* Earnings breakdown */}
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Earnings Breakdown</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-xl p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Clock className="w-3.5 h-3.5 text-yellow-500" />
                  <p className="text-xs text-gray-500">Pending</p>
                </div>
                <p className="font-bold text-gray-900 text-sm">{fmt(agent.pendingAmount)}</p>
                <p className="text-xs text-gray-400 mt-0.5">Awaiting completion</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Wallet className="w-3.5 h-3.5 text-blue-500" />
                  <p className="text-xs text-gray-500">Available</p>
                </div>
                <p className="font-bold text-gray-900 text-sm">{fmt(agent.availableAmount)}</p>
                <p className="text-xs text-gray-400 mt-0.5">Ready to withdraw</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Check className="w-3.5 h-3.5 text-green-500" />
                  <p className="text-xs text-gray-500">Paid Out</p>
                </div>
                <p className="font-bold text-gray-900 text-sm">{fmt(agent.paidOutAmount)}</p>
                <p className="text-xs text-gray-400 mt-0.5">Withdrawn to bank</p>
              </div>
              <div className="bg-primary/5 rounded-xl p-3 border border-primary/10">
                <div className="flex items-center gap-1.5 mb-1">
                  <TrendingUp className="w-3.5 h-3.5 text-primary" />
                  <p className="text-xs text-primary font-semibold">Total Earned</p>
                </div>
                <p className="font-bold text-primary text-sm">{fmt(agent.totalEarned)}</p>
                <p className="text-xs text-primary/60 mt-0.5">{agent.totalReferrals} referral{agent.totalReferrals !== 1 ? "s" : ""}</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-2 pt-1">
            {agent.isActive ? (
              <button
                disabled={busy}
                onClick={() => onAction(agent.id, "deactivate")}
                className="w-full py-2.5 bg-red-50 text-red-600 text-sm font-bold rounded-xl hover:bg-red-100 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserMinus className="w-4 h-4" />}
                Deactivate Agent
              </button>
            ) : (
              <button
                disabled={busy}
                onClick={() => onAction(agent.id, "reactivate")}
                className="w-full py-2.5 bg-green-50 text-green-700 text-sm font-bold rounded-xl hover:bg-green-100 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                Reactivate Agent
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AgentsManager({ initialAgents }: { initialAgents: Agent[] }) {
  const toast = useToast();
  const [agents, setAgents] = useState<Agent[]>(initialAgents);
  useEffect(() => { setAgents(initialAgents); }, [initialAgents]);
  const { page, setPage, totalPages, paged: pagedAgents, totalItems, pageSize, setPageSize } = usePagination(agents, 20);
  const [selected, setSelected] = useState<Agent | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [form, setForm] = useState<NewAgentForm>({ name: "", email: "", phone: "" });
  const [tempCredentials, setTempCredentials] = useState<{ name: string; email: string; password: string } | null>(null);

  const copyText = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(id);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopied(null), 2000);
  };

  const createAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch("/api/admin/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        toast.error(`Failed to create agent: ${await res.text()}`);
        return;
      }
      const { agent, tempPassword } = await res.json();
      const newAgent: Agent = { ...agent, totalReferrals: 0, pendingAmount: 0, availableAmount: 0, paidOutAmount: 0, totalEarned: 0 };
      setAgents((prev) => [newAgent, ...prev]);
      setTempCredentials({ name: agent.name, email: agent.email, password: tempPassword });
      setForm({ name: "", email: "", phone: "" });
      setShowForm(false);
    } catch {
      toast.error("An error occurred.");
    } finally {
      setCreating(false);
    }
  };

  const doAction = async (id: string, action: "deactivate" | "reactivate") => {
    setActionId(id);
    try {
      const res = await fetch(`/api/admin/agents/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) { toast.error("Action failed."); return; }

      if (action === "deactivate") {
        toast.success("Agent deactivated.");
        setAgents((prev) => prev.map((a) => a.id === id ? { ...a, isActive: false } : a));
        setSelected((prev) => prev?.id === id ? { ...prev, isActive: false } : prev);
      } else {
        toast.success("Agent reactivated.");
        setAgents((prev) => prev.map((a) => a.id === id ? { ...a, isActive: true } : a));
        setSelected((prev) => prev?.id === id ? { ...prev, isActive: true } : prev);
      }
    } catch {
      toast.error("An error occurred.");
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Agent detail modal */}
      {selected && (
        <AgentModal
          agent={selected}
          onClose={() => setSelected(null)}
          onAction={doAction}
          actionId={actionId}
          onCopy={copyText}
          copied={copied}
        />
      )}

      {/* Temp credentials modal */}
      {tempCredentials && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <ScrollLock />
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900 text-lg">Agent Credentials</h3>
              <button onClick={() => setTempCredentials(null)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Share these credentials with <strong>{tempCredentials.name}</strong>. The password is temporary — ask them to change it after first login.
            </p>
            {[
              { label: "Email",    value: tempCredentials.email,    id: "cred-email"    },
              { label: "Password", value: tempCredentials.password, id: "cred-password" },
            ].map((row) => (
              <div key={row.label} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl mb-3">
                <div className="flex-1">
                  <p className="text-xs text-gray-400">{row.label}</p>
                  <p className="font-mono font-bold text-gray-900">{row.value}</p>
                </div>
                <button onClick={() => copyText(row.value, row.id)} className="p-2 hover:bg-gray-200 rounded-lg">
                  {copied === row.id ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-gray-500" />}
                </button>
              </div>
            ))}
            <button
              onClick={() => setTempCredentials(null)}
              className="w-full mt-2 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-dark transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Header + Add button */}
      <div className="flex flex-wrap-reverse gap-3 items-center justify-between">
        <p className="text-sm text-gray-500">{agents.filter(a => a.isActive).length} active · {agents.length} total</p>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 p-3 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-dark transition-colors"
        >
          <Plus className="w-4 h-4" />
          Onboard Agent
        </button>
      </div>

      {/* Onboarding form */}
      {showForm && (
        <form onSubmit={createAgent} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <h3 className="font-bold text-gray-900">New Marketing Agent</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Full Name *</label>
              <input
                required type="text" value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Email *</label>
              <input
                required type="email" value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Phone</label>
              <input
                type="tel" value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              />
            </div>
          </div>
          <p className="text-xs text-gray-400">A temporary password will be generated. The agent logs in at <span className="font-medium">/auth/login</span>.</p>
          <div className="flex items-center gap-3">
            <button
              type="submit" disabled={creating}
              className="flex items-center gap-2 px-5 py-2 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-dark disabled:opacity-50 transition-colors"
            >
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              {creating ? "Creating…" : "Create Agent"}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border border-gray-200 text-sm rounded-xl hover:bg-gray-50">
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Agents table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        {agents.length > 0 && (
          <div className="p-4 border-b border-gray-100 flex justify-end">
            <PageSizeSelector pageSize={pageSize} onPageSizeChange={setPageSize} />
          </div>
        )}
        {agents.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-sm">No agents yet.</p>
            <p className="text-xs mt-1">Click "Onboard Agent" to add your first marketing officer.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                <th className="px-5 py-3">Agent</th>
                <th className="px-5 py-3">Referral Code</th>
                <th className="px-5 py-3 hidden sm:table-cell">Referrals</th>
                <th className="px-5 py-3 hidden md:table-cell">Pending</th>
                <th className="px-5 py-3 hidden md:table-cell">Available</th>
                <th className="px-5 py-3">Total Earned</th>
                <th className="px-5 py-3 hidden lg:table-cell">Joined</th>
                <th className="px-3 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {pagedAgents.map((agent) => (
                <tr
                  key={agent.id}
                  onClick={() => setSelected(agent)}
                  className={`hover:bg-gray-50 transition-colors cursor-pointer ${!agent.isActive ? "opacity-60" : ""}`}
                >
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-900">{agent.name ?? "—"}</p>
                      {!agent.isActive && (
                        <span className="px-1.5 py-0.5 bg-red-100 text-red-600 text-xs font-semibold rounded">Deactivated</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400">{agent.email}</p>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-primary text-sm">{agent.referralCode}</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); copyText(agent.referralCode, agent.id + "-code"); }}
                        className="p-1 hover:bg-gray-100 rounded"
                      >
                        {copied === agent.id + "-code" ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5 text-gray-400" />}
                      </button>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 font-medium text-gray-700 hidden sm:table-cell">{agent.totalReferrals}</td>
                  <td className="px-5 py-3.5 text-yellow-700 font-medium hidden md:table-cell">{fmt(agent.pendingAmount)}</td>
                  <td className="px-5 py-3.5 text-blue-700 font-medium hidden md:table-cell">{fmt(agent.availableAmount)}</td>
                  <td className="px-5 py-3.5 font-bold text-green-700">{fmt(agent.totalEarned)}</td>
                  <td className="px-5 py-3.5 text-xs text-gray-500 whitespace-nowrap hidden lg:table-cell">
                    {new Date(agent.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
                  </td>
                  <td className="px-3 py-3.5">
                    <ChevronRight className="w-4 h-4 text-gray-300" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
        {agents.length > 0 && (
          <div className="px-5 pb-4 pt-2">
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} totalItems={totalItems} pageSize={pageSize} />
          </div>
        )}
      </div>
    </div>
  );
}
