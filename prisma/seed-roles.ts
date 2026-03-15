import { PrismaClient } from '../generated/prisma';

const prisma = new PrismaClient();

async function seedRolesAndPermissions() {
  console.log('Seeding roles and permissions...');

  // Create system roles
  const userRole = await prisma.customRole.upsert({
    where: { name: 'USER' },
    update: {},
    create: { name: 'USER', description: 'General user', isSystem: true },
  });

  const adminRole = await prisma.customRole.upsert({
    where: { name: 'ADMIN' },
    update: {},
    create: { name: 'ADMIN', description: 'Administrator', isSystem: true },
  });

  const superAdminRole = await prisma.customRole.upsert({
    where: { name: 'SUPERADMIN' },
    update: {},
    create: { name: 'SUPERADMIN', description: 'Super Administrator', isSystem: true },
  });

  // Create permissions
  const resources = ['bookings', 'users', 'packages', 'categories', 'tests', 'promos', 'transactions', 'roles', 'permissions'];
  const actions = ['create', 'read', 'update', 'delete'];

  const permissions = [];
  for (const resource of resources) {
    for (const action of actions) {
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
      permissions.push(permission);
    }
  }

  // Assign permissions to USER
  const userPermissions = permissions.filter(p => 
    (p.resource === 'bookings' && ['create', 'read'].includes(p.action)) ||
    (['packages', 'categories', 'tests', 'promos'].includes(p.resource) && p.action === 'read')
  );

  for (const perm of userPermissions) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: userRole.id, permissionId: perm.id } },
      update: {},
      create: { roleId: userRole.id, permissionId: perm.id },
    });
  }

  // Assign permissions to ADMIN (all except users and roles management)
  const adminPermissions = permissions.filter(p => 
    !['users', 'roles', 'permissions'].includes(p.resource)
  );

  for (const perm of adminPermissions) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: adminRole.id, permissionId: perm.id } },
      update: {},
      create: { roleId: adminRole.id, permissionId: perm.id },
    });
  }

  // Assign all permissions to SUPERADMIN
  for (const perm of permissions) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: superAdminRole.id, permissionId: perm.id } },
      update: {},
      create: { roleId: superAdminRole.id, permissionId: perm.id },
    });
  }

  console.log('Roles and permissions seeded successfully!');
}

seedRolesAndPermissions()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
