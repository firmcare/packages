
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});
import { CartProvider } from "@/context/CartContext";
import { ToastProvider } from "@/context/ToastContext";
import { ProgressBar } from "@/components/ui/ProgressBar";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import PWARegister from "@/components/PWARegister";
import LayoutContent from "./LayoutContent";
import { SessionProvider } from "next-auth/react";
import ReferralTracker from "@/components/ui/ReferralTracker";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://firmcare.com.ng";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "FirmCare Diagnostics - Precision Diagnostics for Preventive Care",
    template: "%s | FirmCare Diagnostics"
  },
  description: "Comprehensive laboratory screening packages designed to detect risks early, guide treatment, and support long-term wellbeing. Expert diagnostic services in Abuja, Nigeria.",
  keywords: [
    "diagnostics",
    "medical screening",
    "laboratory tests",
    "preventive care",
    "health screening",
    "Abuja diagnostics",
    "Nigeria medical services",
    "wellness packages",
    "female wellness",
    "male wellness",
    "fertility testing",
    "cancer screening"
  ],
  authors: [{ name: "FirmCare Diagnostics" }],
  creator: "FirmCare Diagnostics",
  publisher: "FirmCare Diagnostics",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_NG",
    url: siteUrl,
    title: "FirmCare Diagnostics - Precision Diagnostics for Preventive Care",
    description: "Comprehensive laboratory screening packages designed to detect risks early, guide treatment, and support long-term wellbeing.",
    siteName: "FirmCare Diagnostics",
    images: [
      {
        url: `${siteUrl}/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: "FirmCare Diagnostics - Precision Diagnostics for Preventive Care",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "FirmCare Diagnostics - Precision Diagnostics for Preventive Care",
    description: "Comprehensive laboratory screening packages designed to detect risks early, guide treatment, and support long-term wellbeing.",
    images: [`${siteUrl}/og-image.jpg`],
    creator: "@firmcarediag",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: siteUrl,
  },
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'FirmCare',
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "MedicalBusiness",
    "name": "FirmCare Diagnostics & Medical Services Ltd",
    "description": "Comprehensive laboratory screening packages designed to detect risks early, guide treatment, and support long-term wellbeing.",
    "url": siteUrl,
    "logo": `${siteUrl}/logo.png`,
    "image": `${siteUrl}/og-image.jpg`,
    "telephone": "+234-808-874-3272",
    "email": "info@firmcare.com.ng",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "No 3, Bouar Close, by Jevenik Restaurant, Beside St. Francois Hospital, off Bangui Street, off Adetokunbo Crescent",
      "addressLocality": "Wuse 2",
      "addressRegion": "Abuja",
      "addressCountry": "NG"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": "9.0765",
      "longitude": "7.3986"
    },
    "openingHoursSpecification": [
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        "opens": "08:00",
        "closes": "17:00"
      }
    ],
    "sameAs": [
      "https://facebook.com/firmcarediagnostics",
      "https://twitter.com/firmcarediag",
      "https://instagram.com/firmcarediagnostics"
    ],
    "priceRange": "₦₦₦"
  };

  return (
    <html lang="en" className={inter.variable}>
      <head>
        {/* Preconnect for Cloudinary image CDN */}
        <link rel="preconnect" href="https://res.cloudinary.com" />
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={`${inter.className} antialiased bg-gray-50 flex flex-col min-h-screen`}>
        <PWARegister />
        <SessionProvider>
          <ToastProvider>
            <CartProvider>
              <ProgressBar />
              <ReferralTracker />
              <LayoutContent>{children}</LayoutContent>
              <PWAInstallPrompt />
            </CartProvider>
          </ToastProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
