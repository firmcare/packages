import PackageDetailView from '@/components/pages/PackageDetailView';
import { getPackageBySlug, getSimilarPackages } from '@/app/actions';
import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const pkg = await getPackageBySlug(slug);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://firmcare.com.ng";

  if (!pkg) {
    return {
      title: 'Package Not Found - FirmCare Diagnostics',
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const price = new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(Number(pkg.price));

  return {
    title: `${pkg.title} - FirmCare Diagnostics`,
    description: pkg.description,
    keywords: [pkg.title, pkg.category.name, "diagnostic screening", "medical tests", "Abuja", "Nigeria"],
    openGraph: {
      title: `${pkg.title} - FirmCare Diagnostics`,
      description: pkg.description,
      url: `${siteUrl}/package/${slug}`,
      type: "website",
      images: [
        {
          url: pkg.imageUrl || `${siteUrl}/og-image.jpg`,
          width: 1200,
          height: 630,
          alt: pkg.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${pkg.title} - FirmCare Diagnostics`,
      description: pkg.description,
      images: [pkg.imageUrl || `${siteUrl}/og-image.jpg`],
    },
    alternates: {
      canonical: `${siteUrl}/package/${slug}`,
    },
  };
}

export default async function Page({ params }: Props) {
  const { slug } = await params;

  // Custom package has its own dedicated builder flow
  if (slug === 'custom-tailored-package') {
    redirect('/custom-package');
  }

  const pkg = await getPackageBySlug(slug);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://firmcare.com.ng";

  if (!pkg) {
    notFound();
  }

  const similarPackages = await getSimilarPackages(pkg.id, pkg.categoryId);

  // JSON-LD structured data for the package
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "MedicalTest",
    "name": pkg.title,
    "description": pkg.description,
    "image": pkg.imageUrl || `${siteUrl}/og-image.jpg`,
    "url": `${siteUrl}/package/${slug}`,
    "provider": {
      "@type": "MedicalBusiness",
      "name": "FirmCare Diagnostics & Medical Services Ltd",
      "url": siteUrl,
    },
    "offers": {
      "@type": "Offer",
      "price": Number(pkg.price),
      "priceCurrency": "NGN",
      "availability": "https://schema.org/InStock",
      "url": `${siteUrl}/package/${slug}`,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PackageDetailView packageData={pkg} similarPackages={similarPackages} />
    </>
  );
}

