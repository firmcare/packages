import { requireAdmin } from '@/lib/auth-utils';
import TeamManager from '@/components/admin/TeamManager';

export default async function TeamPage() {
  await requireAdmin();
  return <TeamManager />;
}
