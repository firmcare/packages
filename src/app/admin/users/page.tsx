import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/auth-utils";
import UserManagement from "@/components/admin/UserManagement";

async function getUsers() {
  return await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      role: {
        select: {
          id: true,
          name: true,
        },
      },
      createdAt: true,
      _count: {
        select: { bookings: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export default async function UsersPage() {
  await requireSuperAdmin();
  const users = await getUsers();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
        <p className="text-gray-600 mt-2">Manage user accounts and roles</p>
      </div>

      <UserManagement users={users} />
    </div>
  );
}

