import { PrismaClient } from '../generated/prisma/client';

const prisma = new PrismaClient();

const rolePermissions: Record<string, { resource: string; action: string }[]> = {
  USER: [
    { resource: 'bookings', action: 'create' },
    { resource: 'bookings', action: 'read' },
    { resource: 'packages', action: 'read' },
    { resource: 'categories', action: 'read' },
    { resource: 'tests', action: 'read' },
    { resource: 'promos', action: 'read' },
  ],
  ADMIN: [
    { resource: 'bookings', action: 'create' },
    { resource: 'bookings', action: 'read' },
    { resource: 'bookings', action: 'update' },
    { resource: 'bookings', action: 'delete' },
    { resource: 'packages', action: 'create' },
    { resource: 'packages', action: 'read' },
    { resource: 'packages', action: 'update' },
    { resource: 'packages', action: 'delete' },
    { resource: 'categories', action: 'create' },
    { resource: 'categories', action: 'read' },
    { resource: 'categories', action: 'update' },
    { resource: 'categories', action: 'delete' },
    { resource: 'tests', action: 'create' },
    { resource: 'tests', action: 'read' },
    { resource: 'tests', action: 'update' },
    { resource: 'tests', action: 'delete' },
    { resource: 'promos', action: 'create' },
    { resource: 'promos', action: 'read' },
    { resource: 'promos', action: 'update' },
    { resource: 'promos', action: 'delete' },
    { resource: 'transactions', action: 'read' },
  ],
  SUPERADMIN: [
    { resource: 'bookings', action: 'create' },
    { resource: 'bookings', action: 'read' },
    { resource: 'bookings', action: 'update' },
    { resource: 'bookings', action: 'delete' },
    { resource: 'users', action: 'create' },
    { resource: 'users', action: 'read' },
    { resource: 'users', action: 'update' },
    { resource: 'users', action: 'delete' },
    { resource: 'packages', action: 'create' },
    { resource: 'packages', action: 'read' },
    { resource: 'packages', action: 'update' },
    { resource: 'packages', action: 'delete' },
    { resource: 'categories', action: 'create' },
    { resource: 'categories', action: 'read' },
    { resource: 'categories', action: 'update' },
    { resource: 'categories', action: 'delete' },
    { resource: 'tests', action: 'create' },
    { resource: 'tests', action: 'read' },
    { resource: 'tests', action: 'update' },
    { resource: 'tests', action: 'delete' },
    { resource: 'promos', action: 'create' },
    { resource: 'promos', action: 'read' },
    { resource: 'promos', action: 'update' },
    { resource: 'promos', action: 'delete' },
    { resource: 'transactions', action: 'create' },
    { resource: 'transactions', action: 'read' },
    { resource: 'transactions', action: 'update' },
    { resource: 'transactions', action: 'delete' },
    { resource: 'roles', action: 'create' },
    { resource: 'roles', action: 'read' },
    { resource: 'roles', action: 'update' },
    { resource: 'roles', action: 'delete' },
    { resource: 'permissions', action: 'create' },
    { resource: 'permissions', action: 'read' },
    { resource: 'permissions', action: 'update' },
    { resource: 'permissions', action: 'delete' },
  ],
};

async function seedPermissions() {
  console.log('Seeding permissions...');

  for (const [roleName, perms] of Object.entries(rolePermissions)) {
    const role = await prisma.customRole.findUnique({ where: { name: roleName } });
    if (!role) {
      console.warn(`Role "${roleName}" not found — run seed.ts first to create roles.`);
      continue;
    }

    for (const { resource, action } of perms) {
      const permission = await prisma.permission.upsert({
        where: { resource_action: { resource, action } },
        update: {},
        create: {
          name: `${resource}_${action}`,
          resource,
          action,
          description: `${action} ${resource}`,
        },
      });

      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: role.id, permissionId: permission.id } },
        update: {},
        create: { roleId: role.id, permissionId: permission.id },
      });
    }

    console.log(`Permissions seeded for role: ${roleName}`);
  }

  console.log('Permissions seeded successfully!');
}

seedPermissions()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
