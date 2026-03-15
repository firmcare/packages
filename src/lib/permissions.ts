import { prisma } from './prisma';

type Action = 'create' | 'read' | 'update' | 'delete';
type Resource = 'bookings' | 'users' | 'packages' | 'categories' | 'tests' | 'promos' | 'transactions' | 'roles' | 'permissions';

const permissionCache = new Map<string, boolean>();

export async function checkPermission(userId: string, resource: Resource, action: Action): Promise<boolean> {
  const key = `${userId}:${resource}:${action}`;
  
  if (permissionCache.has(key)) {
    return permissionCache.get(key)!;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      role: {
        include: {
          permissions: {
            include: { permission: true }
          }
        }
      }
    }
  });

  const hasPermission = user?.role.permissions.some(
    rp => rp.permission.resource === resource && rp.permission.action === action
  ) || false;

  permissionCache.set(key, hasPermission);
  return hasPermission;
}

export function clearPermissionCache() {
  permissionCache.clear();
}
