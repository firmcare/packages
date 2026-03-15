"use client";

import { useState } from "react";
import { Plus, Copy, Check, RefreshCw, UserMinus, UserPlus, Loader2, X } from "lucide-react";
import { useToast } from "@/context/ToastContext";
import { useRouter } from "next/navigation";

interface Agent {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  referralCode: string;
  createdAt: Date;
  totalReferrals: number;
  totalEarned: number;
  pendingAmount: number;
}

interface NewAgentForm {
  name: string;
  email: string;
  phone: string;
}

export default function AgentsManager({ initialAgents }: { initialAgents: Agent[] }) {
  const toast = useToast();
  const router = useRouter();
  const [agents, setAgents] = useState<Agent[]>(initialAgents);
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
        const err = await res.text();
        toast.error(`Failed to create agent: ${err}`);
        return;
      }
      const { agent, tempPassword } = await res.json();
      setAgents((prev) => [{ ...agent, totalReferrals: 0, totalEarned: 0, pendingAmount: 0 }, ...prev]);
      setTempCredentials({ name: agent.name, email: agent.email, password: tempPassword });
      setForm({ name: "", email: "", phone: "" });
      setShowForm(false);
    } catch {
      toast.error("An error occurred.");
    } finally {
      setCreating(false);
    }
  };

  const doAction = async (id: string, action: "deactivate" | "reactivate" | "reset_password") => {
    setActionId(id);
    try {
      const res = await fetch(`/api/admin/agents/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) { toast.error("Action failed."); return; }

      if (action === "reset_password") {
        const { tempPassword } = await res.json();
        const agent = agents.find((a) => a.id === id);
        setTempCredentials({ name: agent?.name ?? "", email: agent?.email ?? "", password: tempPassword });
        toast.success("Password reset successfully.");
      } else if (action === "deactivate") {
        toast.success("Agent deactivated.");
        setAgents((prev) => prev.filter((a) => a.id !== id));
      } else {
        toast.success("Agent reactivated.");
        router.refresh();
      }
    } catch {
      toast.error("An error occurred.");
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Temp credentials modal */}
      {tempCredentials && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
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
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{agents.length} agent{agents.length !== 1 ? "s" : ""}</p>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-dark transition-colors"
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
                required
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Email *</label>
              <input
                required
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Phone</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              />
            </div>
          </div>
          <p className="text-xs text-gray-400">A temporary password will be generated. The agent logs in at <span className="font-medium">/auth/login</span> and will be redirected to their portal.</p>
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={creating}
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
                  <th className="px-5 py-3">Referrals</th>
                  <th className="px-5 py-3">Pending</th>
                  <th className="px-5 py-3">Earned</th>
                  <th className="px-5 py-3">Joined</th>
                  <th className="px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {agents.map((agent) => (
                  <tr key={agent.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-gray-900">{agent.name ?? "—"}</p>
                      <p className="text-xs text-gray-400">{agent.email}</p>
                      {agent.phone && <p className="text-xs text-gray-400">{agent.phone}</p>}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-primary text-sm">{agent.referralCode}</span>
                        <button onClick={() => copyText(agent.referralCode, agent.id + "-code")} className="p-1 hover:bg-gray-100 rounded">
                          {copied === agent.id + "-code" ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5 text-gray-400" />}
                        </button>
                      </div>
                    </td>
                    <td className="px-5 py-4 font-medium text-gray-700">{agent.totalReferrals}</td>
                    <td className="px-5 py-4 text-yellow-700 font-medium">₦{agent.pendingAmount.toLocaleString()}</td>
                    <td className="px-5 py-4 font-bold text-green-700">₦{agent.totalEarned.toLocaleString()}</td>
                    <td className="px-5 py-4 text-xs text-gray-500 whitespace-nowrap">
                      {new Date(agent.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => doAction(agent.id, "reset_password")}
                          disabled={actionId === agent.id}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg disabled:opacity-50"
                          title="Reset password"
                        >
                          {actionId === agent.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => doAction(agent.id, "deactivate")}
                          disabled={actionId === agent.id}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg disabled:opacity-50"
                          title="Deactivate agent"
                        >
                          <UserMinus className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
