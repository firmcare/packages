"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Eye, EyeOff, Loader2, CheckCircle, XCircle, KeyRound } from "lucide-react";

type State = "form" | "success" | "invalid";

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: "At least 8 characters", ok: password.length >= 8 },
    { label: "Contains a number", ok: /\d/.test(password) },
    { label: "Contains a letter", ok: /[a-zA-Z]/.test(password) },
  ];
  const score = checks.filter((c) => c.ok).length;
  const bar = ["bg-red-400", "bg-yellow-400", "bg-green-500"][score - 1] ?? "bg-gray-200";

  if (!password) return null;

  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-colors ${i < score ? bar : "bg-gray-200"}`}
          />
        ))}
      </div>
      <ul className="space-y-0.5">
        {checks.map((c) => (
          <li key={c.label} className={`flex items-center gap-1.5 text-xs ${c.ok ? "text-green-600" : "text-gray-400"}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${c.ok ? "bg-green-500" : "bg-gray-300"}`} />
            {c.label}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ResetPasswordInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [state, setState] = useState<State>(token ? "form" : "invalid");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [invalidMsg, setInvalidMsg] = useState("No reset token found. Please request a new reset link.");

  // Validate token exists on mount
  useEffect(() => {
    if (!token) {
      setInvalidMsg("No reset token found. Please request a new reset link.");
      setState("invalid");
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (!data.success) {
        setInvalidMsg(data.message || "This reset link is invalid or has expired.");
        setState("invalid");
        return;
      }

      setState("success");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-4">
            <Image src="/logo.png" alt="FirmCare Logo" width={100} height={100} className="object-contain mx-auto" />
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10">

          {/* Invalid / expired */}
          {state === "invalid" && (
            <div className="text-center space-y-4">
              <XCircle className="w-14 h-14 text-red-400 mx-auto" />
              <h2 className="text-2xl font-bold text-gray-900">Link invalid or expired</h2>
              <p className="text-gray-500 text-sm">{invalidMsg}</p>
              <Link
                href="/auth/forgot-password"
                className="inline-block mt-2 py-3 px-6 bg-primary text-white text-sm font-bold rounded-xl hover:bg-[#8a3a7a] transition-colors"
              >
                Request a new link
              </Link>
              <div className="pt-2">
                <Link href="/auth/login" className="text-sm text-gray-400 hover:text-gray-600">
                  Back to sign in
                </Link>
              </div>
            </div>
          )}

          {/* Success */}
          {state === "success" && (
            <div className="text-center space-y-4">
              <CheckCircle className="w-14 h-14 text-green-500 mx-auto" />
              <h2 className="text-2xl font-bold text-gray-900">Password updated!</h2>
              <p className="text-gray-500 text-sm">
                Your password has been changed successfully. You can now sign in with your new password.
              </p>
              <button
                onClick={() => router.push("/auth/login")}
                className="w-full mt-2 py-3 px-4 bg-primary text-white font-bold rounded-xl hover:bg-[#8a3a7a] transition-colors"
              >
                Sign In
              </button>
            </div>
          )}

          {/* Form */}
          {state === "form" && (
            <>
              <div className="text-center mb-8">
                <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <KeyRound className="w-7 h-7 text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Set new password</h2>
                <p className="text-gray-500 text-sm mt-2">Choose a strong password for your account.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* New password */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                    New password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      required
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary transition-colors pr-10"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  <PasswordStrength password={password} />
                </div>

                {/* Confirm password */}
                <div>
                  <label htmlFor="confirm" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Confirm new password
                  </label>
                  <div className="relative">
                    <input
                      id="confirm"
                      type={showConfirm ? "text" : "password"}
                      required
                      autoComplete="new-password"
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      className={`appearance-none block w-full px-4 py-3 border rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary transition-colors pr-10 ${
                        confirm && confirm !== password ? "border-red-300" : "border-gray-300"
                      }`}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((v) => !v)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                    >
                      {showConfirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {confirm && confirm !== password && (
                    <p className="text-xs text-red-500 mt-1">Passwords do not match.</p>
                  )}
                </div>

                {error && (
                  <p className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-xl">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={loading || !password || !confirm}
                  className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-primary hover:bg-[#8a3a7a] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-70 disabled:cursor-not-allowed transition-all"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Update password"}
                </button>

                <Link
                  href="/auth/login"
                  className="block text-center text-sm text-gray-400 hover:text-gray-600 transition-colors"
                >
                  Back to sign in
                </Link>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordInner />
    </Suspense>
  );
}
