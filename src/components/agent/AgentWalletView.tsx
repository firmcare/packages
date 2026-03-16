"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Wallet, CreditCard, Clock, CheckCircle2, XCircle,
  ChevronDown, ChevronUp, AlertCircle, Loader2, Building2,
} from "lucide-react";
import { useToast } from "@/context/ToastContext";

interface Reward {
  id: string;
  amount: number;
  status: string;
  referralType: string;
  packageTitle: string;
  createdAt: string;
  withdrawalId: string | null;
}

interface WithdrawalRecord {
  id: string;
  amount: number;
  status: string;
  paystackReference: string | null;
  failureReason: string | null;
  processedAt: string | null;
  createdAt: string;
}

interface BankAccount {
  bankName: string;
  accountNumber: string;
  accountName: string;
}

interface Props {
  confirmedBalance: number;
  pendingBalance: number;
  totalPaid: number;
  rewards: Reward[];
  withdrawals: WithdrawalRecord[];
  bankAccount: BankAccount | null;
}

const STATUS_BADGE: Record<string, string> = {
  PENDING:    "bg-yellow-100 text-yellow-700",
  CONFIRMED:  "bg-blue-100 text-blue-700",
  PAID:       "bg-green-100 text-green-700",
  CANCELLED:  "bg-red-100 text-red-700",
};

const W_STATUS_BADGE: Record<string, string> = {
  PENDING:    "bg-yellow-100 text-yellow-700",
  APPROVED:   "bg-blue-100 text-blue-700",
  PROCESSING: "bg-purple-100 text-purple-700",
  COMPLETED:  "bg-green-100 text-green-700",
  FAILED:     "bg-red-100 text-red-700",
  REJECTED:   "bg-red-100 text-red-700",
};

export default function AgentWalletView({
  confirmedBalance, pendingBalance, totalPaid,
  rewards, withdrawals, bankAccount,
}: Props) {
  const router = useRouter();
  const toast = useToast();
  const [tab, setTab] = useState<"rewards" | "withdrawals">("rewards");
  const [showBankForm, setShowBankForm] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);

  // Bank account form state
  const [banks, setBanks] = useState<{ code: string; name: string }[]>([]);
  const [banksLoaded, setBanksLoaded] = useState(false);
  const [bankCode, setBankCode] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [saving, setSaving] = useState(false);

  const fmt = (n: number) =>
    "₦" + n.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });

  async function loadBanks() {
    if (banksLoaded) return;
    const res = await fetch("/api/agent/banks");
    if (res.ok) {
      const data: { code: string; name: string }[] = await res.json();
      // Deduplicate by code, keeping first occurrence
      const seen = new Set<string>();
      const unique = data.filter((b) => {
        if (seen.has(b.code)) return false;
        seen.add(b.code);
        return true;
      });
      setBanks(unique);
      setBanksLoaded(true);
    }
  }

  async function verifyAccount() {
    if (!accountNumber || !bankCode) return;
    setVerifying(true);
    setAccountName("");
    try {
      const res = await fetch("/api/agent/bank-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountNumber, bankCode }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Could not verify account");
      } else {
        setAccountName(data.accountName);
        toast.success(`Account verified: ${data.accountName}`);
      }
    } finally {
      setVerifying(false);
    }
  }

  async function saveBankAccount() {
    if (!accountName) { toast.error("Verify your account number first"); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/agent/bank-account", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountNumber, bankCode, bankName, accountName }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Failed to save bank account");
      } else {
        toast.success("Bank account saved");
        setShowBankForm(false);
        router.refresh();
      }
    } finally {
      setSaving(false);
    }
  }

  async function requestWithdrawal() {
    setWithdrawing(true);
    try {
      const res = await fetch("/api/agent/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Withdrawal request failed");
      } else {
        toast.success("Withdrawal request submitted! Admin will process it shortly.");
        router.refresh();
      }
    } finally {
      setWithdrawing(false);
    }
  }

  const hasOpenWithdrawal = withdrawals.some(
    (w) => w.status === "PENDING" || w.status === "APPROVED" || w.status === "PROCESSING"
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Wallet</h1>

      {/* Balance cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
              <Wallet className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-sm font-medium text-gray-500">Available to Withdraw</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{fmt(confirmedBalance)}</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-yellow-50 rounded-xl flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <p className="text-sm font-medium text-gray-500">Pending (in-progress bookings)</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{fmt(pendingBalance)}</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-sm font-medium text-gray-500">Total Paid Out</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{fmt(totalPaid)}</p>
        </div>
      </div>

      {/* Bank account + withdraw */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Building2 className="w-5 h-5 text-gray-500" />
            <div>
              <p className="text-sm font-semibold text-gray-900">
                {bankAccount ? "Bank Account" : "No bank account added"}
              </p>
              {bankAccount && (
                <p className="text-xs text-gray-500">
                  {bankAccount.bankName} — {bankAccount.accountNumber} ({bankAccount.accountName})
                </p>
              )}
            </div>
          </div>
          <button
            onClick={() => { setShowBankForm(!showBankForm); loadBanks(); }}
            className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
          >
            {bankAccount ? "Update" : "Add Account"}
            {showBankForm ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Bank account form */}
        {showBankForm && (
          <div className="border-t border-gray-100 pt-4 space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Bank</label>
              <select
                value={bankCode}
                onChange={(e) => {
                  setBankCode(e.target.value);
                  setBankName(banks.find((b) => b.code === e.target.value)?.name ?? "");
                  setAccountName("");
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                <option value="">Select bank…</option>
                {banks.map((b, i) => (
                  <option key={`${i}-${b.code}`} value={b.code}>{b.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Account Number</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  maxLength={10}
                  value={accountNumber}
                  onChange={(e) => { setAccountNumber(e.target.value); setAccountName(""); }}
                  placeholder="0123456789"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
                <button
                  onClick={verifyAccount}
                  disabled={verifying || accountNumber.length !== 10 || !bankCode}
                  className="px-3 py-2 bg-gray-100 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors"
                >
                  {verifying ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verify"}
                </button>
              </div>
            </div>
            {accountName && (
              <div className="flex items-center gap-2 px-3 py-2 bg-green-50 rounded-lg">
                <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                <p className="text-sm font-semibold text-green-700">{accountName}</p>
              </div>
            )}
            <button
              onClick={saveBankAccount}
              disabled={saving || !accountName}
              className="w-full py-2.5 bg-primary text-white text-sm font-bold rounded-xl hover:bg-[#8a3a7a] disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Save Bank Account
            </button>
          </div>
        )}

        {/* Withdraw button */}
        <div className="border-t border-gray-100 pt-4">
          {hasOpenWithdrawal && (
            <div className="flex items-center gap-2 mb-3 px-3 py-2 bg-yellow-50 rounded-lg">
              <AlertCircle className="w-4 h-4 text-yellow-600 shrink-0" />
              <p className="text-xs text-yellow-700">You have a withdrawal in progress.</p>
            </div>
          )}
          <button
            onClick={requestWithdrawal}
            disabled={
              withdrawing ||
              hasOpenWithdrawal ||
              !bankAccount ||
              confirmedBalance < 500
            }
            className="w-full py-3 bg-primary text-white font-bold rounded-xl hover:bg-[#8a3a7a] disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {withdrawing ? <Loader2 className="w-5 h-5 animate-spin" /> : <CreditCard className="w-5 h-5" />}
            Withdraw {confirmedBalance >= 500 ? fmt(confirmedBalance) : "(min ₦500)"}
          </button>
          {!bankAccount && (
            <p className="text-xs text-center text-gray-400 mt-2">Add a bank account to enable withdrawals.</p>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex border-b border-gray-100">
          {(["rewards", "withdrawals"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-3.5 text-sm font-semibold capitalize transition-colors ${
                tab === t ? "border-b-2 border-primary text-primary" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {t === "rewards" ? "Earnings History" : "Withdrawal History"}
            </button>
          ))}
        </div>

        {/* Rewards tab */}
        {tab === "rewards" && (
          <div className="divide-y divide-gray-50">
            {rewards.length === 0 ? (
              <p className="text-center text-gray-400 text-sm py-10">No earnings yet.</p>
            ) : (
              rewards.map((r) => (
                <div key={r.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{r.packageTitle}</p>
                    <p className="text-xs text-gray-400">{fmtDate(r.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_BADGE[r.status] ?? "bg-gray-100 text-gray-600"}`}>
                      {r.status}
                    </span>
                    <p className="text-sm font-bold text-gray-900">{fmt(r.amount)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Withdrawals tab */}
        {tab === "withdrawals" && (
          <div className="divide-y divide-gray-50">
            {withdrawals.length === 0 ? (
              <p className="text-center text-gray-400 text-sm py-10">No withdrawals yet.</p>
            ) : (
              withdrawals.map((w) => (
                <div key={w.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Withdrawal {w.paystackReference ? `· ${w.paystackReference}` : ""}
                    </p>
                    <p className="text-xs text-gray-400">{fmtDate(w.createdAt)}</p>
                    {w.failureReason && (
                      <p className="text-xs text-red-500 mt-0.5">{w.failureReason}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${W_STATUS_BADGE[w.status] ?? "bg-gray-100 text-gray-600"}`}>
                      {w.status}
                    </span>
                    <p className="text-sm font-bold text-gray-900">{fmt(w.amount)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
