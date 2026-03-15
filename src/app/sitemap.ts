
import { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://firmcare.com.ng';

  // Static routes
  const routes = [
    '',
    '/checkout',
    '/custom-package',
    '/category/all',
    '/auth/login',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: route === '' ? 1 : 0.8,
  }));

  // Fetch packages from database
  let packageRoutes: MetadataRoute.Sitemap = [];
  try {
    const packages = await prisma.package.findMany({
      select: { slug: true, updatedAt: true },
    });
    packageRoutes = packages.map((pkg) => ({
      url: `${baseUrl}/package/${pkg.slug}`,
      lastModified: pkg.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    }));
  } catch (error) {
    console.error('Error fetching packages for sitemap:', error);
  }

  // Fetch categories from database
  let categoryRoutes: MetadataRoute.Sitemap = [];
  try {
    const categories = await prisma.category.findMany({
      select: { slug: true, updatedAt: true },
    });
    categoryRoutes = categories.map((cat) => ({
      url: `${baseUrl}/category/${cat.slug}`,
      lastModified: cat.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));
  } catch (error) {
    console.error('Error fetching categories for sitemap:', error);
  }

  return [...routes, ...packageRoutes, ...categoryRoutes];
}
