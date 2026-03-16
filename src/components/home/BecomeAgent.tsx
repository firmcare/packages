"use client";

import { useState } from "react";
import { TrendingUp, Share2, Wallet, Users, CheckCircle, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { useToast } from "@/context/ToastContext";

function buildPerks(percent: number) {
  return [
    {
      icon: <TrendingUp className="w-6 h-6 text-primary" />,
      title: "Earn Commission",
      desc: `Get ${percent}% on every successful booking made through your referral link.`,
    },
    {
      icon: <Share2 className="w-6 h-6 text-primary" />,
      title: "Simple to Share",
      desc: "Your dashboard gives you a unique link for every package — share anywhere.",
    },
    {
      icon: <Wallet className="w-6 h-6 text-primary" />,
      title: "Fast Payouts",
      desc: "Withdraw your confirmed earnings directly to your bank account via Paystack.",
    },
    {
      icon: <Users className="w-6 h-6 text-primary" />,
      title: "Grow Together",
      desc: "Help people access quality healthcare while building a sustainable income.",
    },
  ];
}

function buildFaq(percent: number) {
  return [
    {
      q: "How much can I earn?",
      a: `You earn ${percent}% of every booking made through your referral link. There's no cap — the more you share, the more you earn.`,
    },
    {
      q: "When do I get paid?",
      a: "Rewards are confirmed once the referred customer's booking is completed. You can then request a withdrawal at any time from your agent dashboard.",
    },
    {
      q: "Do I need any qualifications?",
      a: "No formal qualifications are required. You just need enthusiasm for healthcare and a willingness to help people access better diagnostics.",
    },
    {
      q: "How long does approval take?",
      a: "Our team typically reviews applications within 2–3 business days. You'll receive an email with your login credentials once approved.",
    },
  ];
}

export default function BecomeAgent({ agentPercent = 10 }: { agentPercent?: number }) {
  const toast = useToast();
  const [form, setForm] = useState({ name: "", email: "", phone: "", city: "", motivation: "" });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const PERKS = buildPerks(agentPercent);
  const FAQ = buildFaq(agentPercent);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.motivation.trim() || form.motivation.trim().length < 30) {
      toast.warning("Please tell us a bit more about your motivation (at least 30 characters).");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/agent/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Something went wrong. Please try again.");
        return;
      }
      setSubmitted(true);
    } catch {
      toast.error("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="become-agent" className="py-20 bg-gradient-to-b from-white to-purple-50/40">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Heading */}
        <div className="text-center mb-14">
          <span className="inline-block px-4 py-1.5 bg-primary/10 text-primary text-xs font-bold rounded-full uppercase tracking-widest mb-4">
            Partner Program
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4 leading-tight">
            Become a FirmCare Agent
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto text-base leading-relaxed">
            Join our network of marketing agents and earn commission by connecting people with quality health screenings.
            Apply below — our team will review and activate your account.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Left: perks + FAQ */}
          <div className="space-y-8">
            <div className="grid sm:grid-cols-2 gap-4">
              {PERKS.map((p) => (
                <div key={p.title} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex gap-4">
                  <div className="shrink-0 w-11 h-11 bg-primary/10 rounded-xl flex items-center justify-center">
                    {p.icon}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-sm mb-1">{p.title}</p>
                    <p className="text-gray-500 text-xs leading-relaxed">{p.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* FAQ */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h3 className="font-bold text-gray-900 text-sm">Frequently Asked Questions</h3>
              </div>
              <div className="divide-y divide-gray-100">
                {FAQ.map((item, i) => (
                  <div key={i}>
                    <button
                      className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50 transition-colors"
                      onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    >
                      <span className="text-sm font-semibold text-gray-800 pr-4">{item.q}</span>
                      {openFaq === i ? (
                        <ChevronUp className="w-4 h-4 text-primary shrink-0" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
                      )}
                    </button>
                    {openFaq === i && (
                      <div className="px-6 pb-4">
                        <p className="text-sm text-gray-500 leading-relaxed">{item.a}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: application form */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            {submitted ? (
              <div className="text-center py-8 space-y-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Application Received!</h3>
                <p className="text-gray-500 text-sm leading-relaxed max-w-xs mx-auto">
                  Thank you for applying. Our team will review your application and reach out within <strong>2–3 business days</strong>.
                  You'll receive an email with your login credentials once approved.
                </p>
              </div>
            ) : (
              <>
                <h3 className="text-lg font-bold text-gray-900 mb-1">Apply to Join</h3>
                <p className="text-gray-400 text-sm mb-6">Fill in your details and we'll be in touch.</p>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Full Name *</label>
                    <input
                      name="name"
                      required
                      value={form.name}
                      onChange={handleChange}
                      placeholder="John Doe"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Email Address *</label>
                    <input
                      name="email"
                      type="email"
                      required
                      value={form.email}
                      onChange={handleChange}
                      placeholder="john@example.com"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">Phone Number</label>
                      <input
                        name="phone"
                        type="tel"
                        value={form.phone}
                        onChange={handleChange}
                        placeholder="+234 800 000 0000"
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">City</label>
                      <input
                        name="city"
                        value={form.city}
                        onChange={handleChange}
                        placeholder="Abuja"
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                      Why do you want to become an agent? *
                    </label>
                    <textarea
                      name="motivation"
                      required
                      rows={4}
                      value={form.motivation}
                      onChange={handleChange}
                      placeholder="Tell us a bit about yourself, how you plan to promote FirmCare, and why you'd be a great fit…"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition resize-none"
                    />
                    <p className="text-xs text-gray-400 mt-1">{form.motivation.length} / 30 min. characters</p>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-primary text-white font-bold rounded-xl hover:bg-[#8a3a7a] disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                  >
                    {loading ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</>
                    ) : (
                      "Submit Application"
                    )}
                  </button>

                  <p className="text-center text-xs text-gray-400">
                    Already an agent?{" "}
                    <a href="/auth/login" className="text-primary font-semibold hover:underline">
                      Sign in here
                    </a>
                  </p>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
