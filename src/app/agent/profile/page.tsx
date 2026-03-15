import { requireAgent } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import AgentProfileForm from "@/components/agent/AgentProfileForm";

export default async function AgentProfilePage() {
  const session = await requireAgent();

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, phone: true, address: true, referralCode: true, createdAt: true },
  });

  if (!user) return null;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
        <p className="text-gray-500 mt-1 text-sm">Update your contact information. Your referral code cannot be changed.</p>
      </div>
      <AgentProfileForm user={user} />
    </div>
  );
}
