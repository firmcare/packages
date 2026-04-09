import Image from 'next/image';
import Link from 'next/link';

export const metadata = {
  title: 'About Us | FirmCare Diagnostics',
  description:
    'Learn about FirmCare Diagnostics & Medical Services — our story, vision, mission, and the values that drive us.',
};

function PrecisionIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 44 C14 40 10 34 10 28 C10 18 18 10 28 10 C32 10 36 11.5 39 14" />
      <path d="M44 20 C47 23 49 27 49 32 C49 42 41 50 31 50 C27 50 23 48.5 20 46" />
      <path d="M18 26 L26 34 L38 18" />
      <circle cx="46" cy="14" r="4" />
      <path d="M43 17 L36 24" />
      <path d="M46 10 L46 6 M50 14 L54 14 M42 10 L39 7 M50 18 L53 21" />
    </svg>
  );
}

function QualityIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M32 8 L35.5 18 L46 18 L37.5 24.5 L41 35 L32 28.5 L23 35 L26.5 24.5 L18 18 L28.5 18 Z" />
      <path d="M32 38 L32 56" />
      <path d="M24 48 L32 56 L40 48" />
      <path d="M20 52 L14 52" />
      <path d="M44 52 L50 52" />
    </svg>
  );
}

function InnovationIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M32 52 C32 52 20 44 20 30 C20 22 25 14 32 10 C39 14 44 22 44 30 C44 44 32 52 32 52Z" />
      <circle cx="32" cy="30" r="5" />
      <path d="M18 50 L14 54 M46 50 L50 54" />
      <path d="M15 38 L10 40 M49 38 L54 40" />
      <path d="M22 56 L42 56" />
    </svg>
  );
}

function CustomerServiceIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="32" cy="18" r="8" />
      <path d="M16 54 C16 44 23 38 32 38 C41 38 48 44 48 54" />
      <path d="M22 32 C18 34 14 38 14 44 L14 48" />
      <path d="M42 32 C46 34 50 38 50 44 L50 48" />
      <path d="M10 44 C10 41 12 39 14 39 L14 48 C12 48 10 46 10 44Z" />
      <path d="M50 39 C52 39 54 41 54 44 C54 46 52 48 50 48 L50 39Z" />
      <rect x="24" y="46" width="16" height="10" rx="2" />
      <path d="M29 52 L35 52" />
    </svg>
  );
}

const VALUES = [
  { icon: PrecisionIcon,      label: 'Precision & Trust' },
  { icon: QualityIcon,        label: 'Quality' },
  { icon: InnovationIcon,     label: 'Innovation' },
  { icon: CustomerServiceIcon, label: 'Customer Service' },
];

export default function AboutUsPage() {
  return (
    <main>
      {/* ── Hero ── */}
      <section className="relative min-h-150 flex items-center">
        <Image
          src="/about.webp"
          alt="FirmCare medical team"
          fill
          priority
          className="object-cover object-center"
          sizes="100vw"
        />
        {/* Purple overlay */}
        <div className="absolute inset-0 bg-primary/60" />

        <div className="relative z-10 w-full max-w-6xl mx-auto px-6 py-18">
          <div className="flex items-center gap-3 mb-5">
            <span className="w-8 h-0.5 bg-white block" />
            <span className="text-sm font-semibold text-white/80 uppercase tracking-widest">
              About Us
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight mb-6 max-w-xl">
            Welcome to Firm Care Diagnostics
          </h1>
          <p className="text-white/95 max-w-xl leading-relaxed mb-8 text-sm md:text-base">
            Firmcare Diagnostics and Medical services is an integrated medical diagnostic service
            managed by a dedicated team of medical professionals. The idea was developed and
            implemented to up the ante in the diagnostic service industry.
          </p>
          <Link
            href="/our-services"
            className="inline-block border-2 border-white text-white px-10 py-3 text-sm font-semibold hover:bg-white hover:text-primary transition-colors duration-200"
          >
            Our services
          </Link>
        </div>
      </section>

      {/* ── Story + Vision/Mission ── */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Left: story text */}
          <div className="space-y-5 text-gray-600 text-sm md:text-lg leading-relaxed">
            <p>
              We began operations in 2016, back then we were only a pathology laboratory that
              attended to Walk-in Clients and a few Hospitals. Today, in over 5 years of existence,
              we have been able to live up to our vision of becoming a reference point and preferred
              partner in healthcare services by working on over 5000 samples, which has not only
              allowed us to have increased number of clientele but has also expanded our services in
              order to contribute our quota in ensuring reliable outcomes in Healthcare.
            </p>
            <p>
              We carry out various Screening packages for Organizations in Abuja, we have
              successfully done and still doing business with organizations like, TAJ Bank,
              Transcorp, Sheraton Hotel, Jaiz Bank, Development Bank of Nigeria, Nestle, Cowry
              Asset Management, TETFUND, Media Trust, Leadway Assurance Company, Cornerstone,
              Custodian, Salini construction company, Regent Schools, Brickhall Schools, Oaklands,
              to mention a few.
            </p>
            <p>
              As part of our corporate Social responsibility, we also partner with associations like
              ACCA and NGOS to carry out free Trainings and affordable Screenings.
            </p>
          </div>

          {/* Right: Vision + Mission cards */}
          <div className="space-y-4">
            <div className="bg-primary text-white rounded-lg p-20 text-center">
              <h2 className="text-3xl font-bold uppercase tracking-wide mb-4">Our Vision</h2>
              <p className="text-white text-xl leading-relaxed">
                To be the reference point and preferred partner in diagnostics services
              </p>
            </div>
            <div className="bg-gray-100 rounded-lg p-20 text-center">
              <h2 className="text-3xl font-bold uppercase tracking-wide text-gray-800 mb-4">
                Our Mission
              </h2>
              <p className="text-gray-500 text-xl leading-relaxed">
                We aim to deliver excellent and top of the range services by providing
                comprehensive, high quality laboratory testing
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Values ── */}
      <section className="pb-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-800 text-center mb-12">Our values</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {VALUES.map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="group flex flex-col items-center gap-6 text-center border border-gray-200 rounded-sm px-6 py-10 cursor-default transition-colors duration-200 hover:bg-primary"
              >
                <Icon className="w-16 h-16 text-primary group-hover:text-white transition-colors duration-200" />
                <span className="font-semibold text-gray-700 group-hover:text-white transition-colors duration-200">
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
