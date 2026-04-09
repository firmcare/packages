import type { Metadata } from 'next';
import ContactForm from './ContactForm';
import { MapPin, Phone, Mail, Clock } from 'lucide-react';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://firmcare.com.ng';

export const metadata: Metadata = {
  title: 'Contact Us — FirmCare Diagnostics',
  description: 'Get in touch with FirmCare Health Diagnostics. Visit us at Wuse 2, Abuja or call 09-291-6883. Send us a message and we\'ll respond within one business day.',
  keywords: ['contact FirmCare', 'FirmCare Abuja', 'diagnostic centre contact', 'Wuse 2 laboratory', 'book a test Abuja', 'health diagnostics phone number'],
  openGraph: {
    title: 'Contact Us — FirmCare Diagnostics',
    description: 'Visit us in Wuse 2, Abuja or send a message. We respond within one business day.',
    url: `${siteUrl}/contact-us`,
    type: 'website',
    images: [{ url: `${siteUrl}/og-image.jpg`, width: 1200, height: 630, alt: 'Contact FirmCare Diagnostics' }],
  },
  twitter: { card: 'summary_large_image', title: 'Contact Us — FirmCare Diagnostics', description: 'Visit us in Wuse 2, Abuja or send a message online.', images: [`${siteUrl}/og-image.jpg`] },
  alternates: { canonical: `${siteUrl}/contact-us` },
};

const contactDetails = [
  {
    icon: MapPin,
    label: 'Address',
    lines: [
      'No 3, Bouar Close, by Jevenik Restaurant,',
      'Beside St. Francois Hospital, off Bangui Street,',
      'off Adetokunbo Crescent, Wuse 2, Abuja',
    ],
  },
  {
    icon: Phone,
    label: 'Phone',
    lines: ['09-291-6883', '0808-874-3272'],
    hrefs: ['tel:092916883', 'tel:08088743272'],
  },
  {
    icon: Mail,
    label: 'Email',
    lines: ['info@firmcare.com.ng'],
    hrefs: ['mailto:info@firmcare.com.ng'],
  },
  {
    icon: Clock,
    label: 'Working Hours',
    lines: ['Monday – Friday: 7:00 am – 6:00 pm', 'Saturday: 8:00 am – 4:00 pm', 'Sunday: Closed'],
  },
];

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  name: 'FirmCare Diagnostics',
  url: siteUrl,
  telephone: ['+234-9-2916883', '+234-808-874-3272'],
  email: 'info@firmcare.com.ng',
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'No 3, Bouar Close, off Adetokunbo Crescent',
    addressLocality: 'Wuse 2',
    addressRegion: 'Abuja',
    addressCountry: 'NG',
  },
  openingHoursSpecification: [
    { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Monday','Tuesday','Wednesday','Thursday','Friday'], opens: '07:00', closes: '18:00' },
    { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Saturday'], opens: '08:00', closes: '16:00' },
  ],
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'customer service',
    telephone: '+234-808-874-3272',
    email: 'info@firmcare.com.ng',
    availableLanguage: 'English',
  },
};

export default function ContactPage() {
  return (
    <div className="bg-gray-50 min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {/* Hero */}
      <div className="bg-linear-to-r from-[#7b2d72] via-[#9d4496] to-[#c45fad] py-14 px-4 text-center text-white">
        <h1 className="text-4xl sm:text-5xl font-extrabold mb-3">Contact Us</h1>
        <p className="text-white/80 text-base max-w-xl mx-auto">
          Have a question or want to book a test? We&apos;d love to hear from you.
        </p>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid lg:grid-cols-2 gap-10 items-start">

          {/* Left — info + map */}
          <div className="space-y-8">
            {/* Contact cards */}
            <div className="grid sm:grid-cols-2 gap-4">
              {contactDetails.map(({ icon: Icon, label, lines, hrefs }) => (
                <div key={label} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4 text-primary" />
                    </div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">{label}</p>
                  </div>
                  <div className="space-y-0.5">
                    {lines.map((line, i) => (
                      hrefs?.[i] ? (
                        <a
                          key={i}
                          href={hrefs[i]}
                          className="block text-sm text-gray-700 hover:text-primary transition-colors"
                        >
                          {line}
                        </a>
                      ) : (
                        <p key={i} className="text-sm text-gray-700">{line}</p>
                      )
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Map — OpenStreetMap (no API key required) */}
            <div className="rounded-2xl overflow-hidden border border-gray-100 shadow-sm h-72 sm:h-96">
              <iframe
                title="FirmCare Location"
                src="https://www.openstreetmap.org/export/embed.html?bbox=7.480%2C9.055%2C7.510%2C9.080&layer=mapnik&marker=9.065%2C7.490"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
              />
            </div>
            <p className="text-xs text-gray-400 text-right -mt-4">
              <a href="https://www.openstreetmap.org/?mlat=9.065&mlon=7.490#map=15/9.065/7.490" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                View larger map ↗
              </a>
            </p>
          </div>

          {/* Right — form */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-1">Send us a message</h2>
            <p className="text-sm text-gray-500 mb-6">We typically respond within one business day.</p>
            <ContactForm />
          </div>
        </div>
      </div>
    </div>
  );
}
