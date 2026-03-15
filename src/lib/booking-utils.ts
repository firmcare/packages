import { prisma } from "./prisma";

export interface CartItem {
  id: string;
  title: string;
  price: string;
  includes?: string[];
  customItems?: { name: string; price: number }[];
}

export interface ResolvedItem {
  item: CartItem;
  packageId: string;
  notes: string | null;
  unitAmount: number; // amount this single booking line should carry
}

/** Ensure the shared custom-package placeholder exists and return its ID. */
async function getCustomPackageId(): Promise<string> {
  const slug = "custom-tailored-package";
  const existing = await prisma.package.findUnique({ where: { slug } });
  if (existing) return existing.id;

  let category = await prisma.category.findFirst({ where: { name: "Custom" } });
  if (!category) {
    category = await prisma.category.create({
      data: { name: "Custom", slug: "custom", description: "User-assembled custom packages" },
    });
  }
  const pkg = await prisma.package.create({
    data: {
      title: "Custom Tailored Package",
      slug,
      description: "A user-assembled selection of diagnostic tests.",
      price: 0,
      categoryId: category.id,
      isActive: true,
    },
  });
  return pkg.id;
}

/**
 * Resolve an array of cart items to real DB package IDs.
 * Priority: exact ID → title lookup → custom placeholder for temp/custom IDs.
 * `totalPaid` is split evenly across items (used as the per-booking `totalAmount`).
 */
export async function resolveCartItems(
  cartItems: CartItem[],
  totalPaid: number
): Promise<ResolvedItem[]> {
  const perItem = cartItems.length > 0 ? totalPaid / cartItems.length : totalPaid;

  return Promise.all(
    cartItems.map(async (item) => {
      const isCustom = item.id.startsWith("custom-") || item.id.startsWith("temp-");

      if (!isCustom) {
        let pkg = await prisma.package.findUnique({ where: { id: item.id } });
        if (!pkg) {
          pkg = await prisma.package.findFirst({
            where: { title: { equals: item.title, mode: "insensitive" } },
          });
        }
        if (pkg) {
          return { item, packageId: pkg.id, notes: null, unitAmount: perItem };
        }
      }

      // Custom / temp → shared placeholder; store selected tests in notes
      const customPkgId = await getCustomPackageId();
      const notes = item.includes?.length
        ? `Selected tests: ${item.includes.join(", ")}`
        : item.title;
      return { item, packageId: customPkgId, notes, unitAmount: perItem };
    })
  );
}
