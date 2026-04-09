import { requireAdmin } from '@/lib/auth-utils';
import BlogManager from '@/components/admin/BlogManager';

export const metadata = { title: 'Blog — FirmCare Admin' };

export default async function AdminBlogPage() {
  await requireAdmin();
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <BlogManager />
    </div>
  );
}
