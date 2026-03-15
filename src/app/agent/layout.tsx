import { requireAgent } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import AgentShell from "@/components/agent/AgentShell";

export default async function AgentLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAgent();

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true, referralCode: true },
  });

  return (
    <AgentShell user={{ name: user?.name, email: user?.email, referralCode: user?.referralCode }}>
      {children}
    </AgentShell>
  );
}
