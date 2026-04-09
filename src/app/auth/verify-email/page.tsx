"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, CheckCircle, XCircle, Mail } from "lucide-react";

type State = "loading" | "success" | "error" | "no-token";

function VerifyEmailInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const callbackUrl = searchParams.get("callbackUrl") || '';
  const loginHref = `/auth/login${callbackUrl ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ''}`;

  const [state, setState] = useState<State>(token ? "loading" : "no-token");
  const [message, setMessage] = useState("");
  const [resendEmail, setResendEmail] = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSent, setResendSent] = useState(false);

  useEffect(() => {
    if (!token) return;

    fetch("/api/auth/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setState("success");
        } else {
          setState("error");
          setMessage(data.message || "Verification failed.");
        }
      })
      .catch(() => {
        setState("error");
        setMessage("Something went wrong. Please try again.");
      });
  }, [token]);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    setResendLoading(true);
    try {
      await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resendEmail }),
      });
      setResendSent(true);
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-10 text-center space-y-5">
        {state === "loading" && (
          <>
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
            <h2 className="text-xl font-bold text-gray-900">Verifying your email…</h2>
            <p className="text-gray-500 text-sm">Please wait a moment.</p>
          </>
        )}

        {state === "success" && (
          <>
            <CheckCircle className="w-14 h-14 text-green-500 mx-auto" />
            <h2 className="text-2xl font-bold text-gray-900">Email verified!</h2>
            <p className="text-gray-500">Your account is now active. A welcome email has been sent to you.</p>
            <button
              onClick={() => router.push(loginHref)}
              className="mt-2 w-full py-3 px-4 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition-colors"
            >
              Sign In to Your Account
            </button>
          </>
        )}

        {state === "error" && (
          <>
            <XCircle className="w-14 h-14 text-red-400 mx-auto" />
            <h2 className="text-2xl font-bold text-gray-900">Verification failed</h2>
            <p className="text-gray-500">{message}</p>
            <div className="pt-4 border-t border-gray-100">
              <p className="text-sm text-gray-500 mb-3">Need a new verification link?</p>
              {resendSent ? (
                <p className="text-green-600 font-medium text-sm">New link sent! Check your inbox.</p>
              ) : (
                <form onSubmit={handleResend} className="flex gap-2">
                  <input
                    type="email"
                    required
                    placeholder="your@email.com"
                    value={resendEmail}
                    onChange={(e) => setResendEmail(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                  <button
                    type="submit"
                    disabled={resendLoading}
                    className="px-4 py-2 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-[#8a3a7a] disabled:opacity-50 transition-colors"
                  >
                    {resendLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Resend"}
                  </button>
                </form>
              )}
            </div>
            <Link href={loginHref} className="block text-sm text-gray-400 hover:text-gray-600">
              Back to sign in
            </Link>
          </>
        )}

        {state === "no-token" && (
          <>
            <Mail className="w-14 h-14 text-primary mx-auto" />
            <h2 className="text-2xl font-bold text-gray-900">Check your email</h2>
            <p className="text-gray-500">
              We sent a verification link to your email address. Click the link to activate your account.
            </p>
            <div className="pt-4 border-t border-gray-100">
              <p className="text-sm text-gray-500 mb-3">Didn&apos;t receive it? Resend the link:</p>
              {resendSent ? (
                <p className="text-green-600 font-medium text-sm">New link sent! Check your inbox.</p>
              ) : (
                <form onSubmit={handleResend} className="flex gap-2">
                  <input
                    type="email"
                    required
                    placeholder="your@email.com"
                    value={resendEmail}
                    onChange={(e) => setResendEmail(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                  <button
                    type="submit"
                    disabled={resendLoading}
                    className="px-4 py-2 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-[#8a3a7a] disabled:opacity-50 transition-colors"
                  >
                    {resendLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Resend"}
                  </button>
                </form>
              )}
            </div>
            <Link href={loginHref} className="block text-sm text-gray-400 hover:text-gray-600">
              Back to sign in
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailInner />
    </Suspense>
  );
}
