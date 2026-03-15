import bcrypt from 'bcryptjs';
import { prisma } from '../src/lib/prisma';
import { generateReferralCode } from '../src/lib/referral';

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

async function main() {
  console.log('Starting seed...');

  // 1. Create Roles
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

  console.log('Roles created');

  // 2. Create Permissions
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

  console.log('Permissions created');

  // 3. Assign Permissions to Roles
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

  for (const perm of permissions) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: superAdminRole.id, permissionId: perm.id } },
      update: {},
      create: { roleId: superAdminRole.id, permissionId: perm.id },
    });
  }

  console.log('Permissions assigned to roles');

  // 4. Create Admin User
  const adminEmail = 'admin@firmcare.com.ng';
  const adminPassword = await bcrypt.hash('Admin@123', 10);
  const adminReferralCode = await generateReferralCode(adminEmail, 'Super Admin');

  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });

  if (!existingAdmin) {
    await prisma.user.create({
      data: {
        email: adminEmail,
        password: adminPassword,
        name: 'Super Admin',
        roleId: superAdminRole.id,
        referralCode: adminReferralCode,
        emailVerified: true,
      },
    });
    console.log('Admin user created');
  } else {
    // Ensure existing admin has emailVerified set
    if (!existingAdmin.emailVerified) {
      await prisma.user.update({
        where: { email: adminEmail },
        data: { emailVerified: true },
      });
      console.log('Admin emailVerified fixed');
    } else {
      console.log('Admin user already exists');
    }
  }

  // 5. Seed Categories
  const categories = [
    "Male Wellness",
    "Female Wellness",
    "Custom Package",
    "Fertility",
    "Elderly Wellness",
    "Cancer Screening",
    "Premarital Screening",
    "Cardiac Health",
    "Diabetes Screening",
    "Thyroid Function",
    "Kidney Function",
    "Liver Function",
    "Hormonal Balance",
    "Infectious Diseases",
    "Allergy Testing",
    "Vitamin Deficiency",
    "Sexual Health",
    "Genomic Testing"
  ];

  for (const catName of categories) {
    await prisma.category.upsert({
      where: { slug: catName.toLowerCase().replace(/ /g, '-') },
      update: {},
      create: {
        name: catName,
        slug: catName.toLowerCase().replace(/ /g, '-'),
        description: `${catName} related packages`,
      },
    });
  }
  console.log('Categories seeded');

  // 6. Seed Tests & Packages
  const parsePrice = (priceStr: string) => {
    return parseFloat(priceStr.replace(/[^0-9.]/g, ''));
  };

  const packagesData = [
    {
      title: "Female Wellness Screening",
      description: "Proactive laboratory tests tailored to women—helping you understand your health, detect risks early, and take informed action.",
      price: "NGN1,000,000",
      imageUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=800",
      categoryName: "Female Wellness",
      includes: [
        "Consultation",
        "Liver Function Test (ALT,AST,GGT, Bilirubin, ALP,Total Proteins, Albumin, Globulin)",
        "Detailed medical exam including weight, height, BMI",
        "Chest X-Ray",
        "Urinalysis",
        "Virology",
        "Renal function Tests (Electrolytes, Urea, Creatinine)",
        "PCV"
      ]
    },
    {
      title: "Male Wellness Screening",
      description: "Comprehensive health check-up designed for men to monitor vital organ functions and detect early signs of health issues.",
      price: "NGN1,000,000",
      imageUrl: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=800",
      categoryName: "Male Wellness",
      includes: [
        "Consultation",
        "Liver Function Test",
        "Full Blood Count",
        "Prostate Specific Antigen (PSA)",
        "Kidney Function Test",
        "Chest X-Ray",
        "Urinalysis",
        "ECG"
      ]
    },
    {
      title: "Premarital Screening",
      description: "Essential tests for couples planning to get married, ensuring a healthy start to your new life together.",
      price: "NGN500,000",
      imageUrl: "https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&q=80&w=800",
      categoryName: "Premarital Screening",
      includes: [
        "Genotype",
        "Blood Group",
        "HIV Screening",
        "Hepatitis B & C",
        "Syphilis Screening",
        "Fertility Profile"
      ]
    },
    {
      title: "Cancer Screening (Basic)",
      description: "Screening tests to detect early signs of common cancers, enabling timely intervention and better outcomes.",
      price: "NGN1,200,000",
      imageUrl: "https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&q=80&w=800",
      categoryName: "Cancer Screening",
      includes: [
        "Tumor Markers (CEA, CA-125)",
        "Mammogram (Females)",
        "PSA (Males)",
        "Occult Blood",
        "Full Blood Count",
        "Consultation"
      ]
    },
    {
      title: "Elderly Care Package",
      description: "Tailored for seniors, this package monitors age-related health concerns to maintain quality of life.",
      price: "NGN850,000",
      imageUrl: "https://images.unsplash.com/photo-1581579186913-45ac3e6e3dd2?auto=format&fit=crop&q=80&w=800",
      categoryName: "Elderly Wellness",
      includes: [
        "Bone Mineral Density",
        "Lipid Profile",
        "Blood Sugar (Fasting & PP)",
        "Kidney Function Test",
        "Liver Function Test",
        "ECG"
      ]
    },
    {
      title: "Full Body Checkup",
      description: "A complete assessment of your overall health status, covering all major systems and vital organs.",
      price: "NGN1,500,000",
      imageUrl: "https://images.unsplash.com/photo-1530497610245-94d3c16cda28?auto=format&fit=crop&q=80&w=800",
      categoryName: "Custom Package",
      includes: [
        "Full Blood Count",
        "Lipid Profile",
        "Liver Function Test",
        "Kidney Function Test",
        "Thyroid Function Test",
        "Urine Analysis",
        "Chest X-Ray",
        "ECG"
      ]
    }
  ];

  for (const pkg of packagesData) {
    const testIds = [];
    for (const testName of pkg.includes) {
      let test = await prisma.test.findFirst({ where: { name: testName } });
      if (!test) {
        test = await prisma.test.create({
          data: {
            name: testName,
            price: 0,
            description: "Included in package"
          }
        });
      }
      testIds.push({ id: test.id });
    }

    const category = await prisma.category.findUnique({
      where: { slug: pkg.categoryName.toLowerCase().replace(/ /g, '-') }
    });

    if (category) {
      const existingPkg = await prisma.package.findFirst({
        where: { title: pkg.title }
      });

      if (!existingPkg) {
        await prisma.package.create({
          data: {
            title: pkg.title,
            slug: generateSlug(pkg.title),
            description: pkg.description,
            price: parsePrice(pkg.price),
            imageUrl: pkg.imageUrl,
            categoryId: category.id,
            tests: {
              connect: testIds
            }
          }
        });
        console.log(`Created package: ${pkg.title}`);
      } else {
        console.log(`Package already exists: ${pkg.title}`);
      }
    } else {
      console.warn(`Category not found for package: ${pkg.title}`);
    }
  }

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
