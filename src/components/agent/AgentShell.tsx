"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import AgentSidebar from "./AgentSidebar";
import AgentHeader from "./AgentHeader";

interface AgentShellProps {
  children: React.ReactNode;
  user: { name?: string | null; email?: string | null; referralCode?: string | null };
}

export default function AgentShell({ children, user }: AgentShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  // Poll the session every 30 s; redirect immediately if role is no longer AGENT
  const { data: session, update } = useSession();

  useEffect(() => {
    const id = setInterval(() => update(), 30_000);
    return () => clearInterval(id);
  }, [update]);

  useEffect(() => {
    if (!session) return;
    const user = session.user as { role?: string; isActive?: boolean };
    // Redirect if deactivated agent — role stays AGENT but isActive flips to false
    if (user.role === "AGENT" && user.isActive === false) {
      router.replace("/auth/login?error=account_deactivated");
    }
  }, [session, router]);

  useEffect(() => { setSidebarOpen(false); }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [sidebarOpen]);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <AgentSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col ml-0 lg:ml-64 min-w-0">
        <AgentHeader user={user} onMenuOpen={() => setSidebarOpen(true)} />
        <main className="flex-1 p-4 lg:p-8 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
