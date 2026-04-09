import Image from 'next/image';
import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Our Services | FirmCare Diagnostics',
  description:
    'Explore FirmCare\'s full range of laboratory, ultrasound, and healthcare screening services in Abuja, Nigeria.',
};

const DEPARTMENTS = [
  'Haematology',
  'Serology',
  'Endocrinology',
  'Immunology',
  'Histology & Cytology',
  'Clinical Chemistry',
  'Molecular Biology',
  'Microbiology & Parasitology',
  'Therapeutic Drug Monitoring (TDM)',
];

export default function OurServicesPage() {
  return (
    <main>
      {/* ── Hero ── */}
      <section className="relative min-h-[420px] md:min-h-[500px] flex items-center">
        <Image
          src="/services-hero.webp"
          alt="FirmCare laboratory services"
          fill
          priority
          className="object-cover object-center"
          sizes="100vw"
        />
        {/* Purple overlay */}
        <div className="absolute inset-0 bg-primary/60" />

        <div className="relative z-10 w-full max-w-6xl mx-auto px-6 py-20">
          <p className="text-sm font-semibold text-white/80 uppercase tracking-widest mb-4">
            Our services
          </p>
          <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight mb-5 max-w-xl">
            Laboratory Services
          </h1>
          <p className="text-white/90 max-w-md leading-relaxed mb-8 text-sm md:text-base">
            Firmcare&apos;s range of laboratory services covers a wide field of clinical laboratory investigations.
          </p>
          <Link
            href="/packages"
            className="inline-block border border-white text-white text-sm font-semibold px-6 py-3 hover:bg-white hover:text-primary transition-colors"
          >
            Book an appointment
          </Link>
        </div>
      </section>

      {/* ── Pathology Departments ── */}
      <section className="max-w-6xl mx-auto px-6 py-16 md:py-20">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-10">
          Our Pathology Departments
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {DEPARTMENTS.map((dept) => (
            <div
              key={dept}
              className="bg-primary-50 border border-primary/10 flex items-center justify-center text-center px-6 py-10 rounded-sm"
            >
              <span className="text-xs font-bold tracking-widest text-gray-700 uppercase">
                {dept}
              </span>
            </div>
          ))}
        </div>

        {/* Available services strip */}
        <div className="mt-12 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <p className="text-gray-600 text-sm max-w-sm leading-relaxed">
            Available Services Include: DNA Paternity testing, Toxicology / Drug Abuse Tests, oncology testing,
            Nutritional studies, Viral Load Monitoring for HBV, HCV &amp; HIV
          </p>
          <Link
            href="/packages"
            className="shrink-0 bg-primary text-white text-sm font-bold px-8 py-4 hover:bg-primary-dark transition-colors"
          >
            Book a Test
          </Link>
        </div>
      </section>

      {/* ── Ultrasound Scans ── */}
      <section className="grid grid-cols-1 md:grid-cols-2 min-h-[420px]">
        {/* Text panel */}
        <div className="bg-primary flex items-center px-10 py-14 md:py-20 order-2 md:order-1">
          <div className="max-w-md">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-5">
              Ultrasound Scans
            </h2>
            <p className="text-white/85 text-sm leading-relaxed mb-8">
              Our state of the art ultrasound facility performs all types of ultrasound scans that
              range from simple scans to advanced and specialised Doppler scans. Our facility is
              family friendly and our 4D ultrasound studio provides world class baby pictures and
              video for your baby album. We offer all types of scans including Obstetrics,
              Trans-vaginal, Follicular tracking, Prostate, Regional doppler etc. 3D scans show
              still pictures of your baby in three dimensions. 4D scans show moving 3D images of
              your baby.
            </p>
            <Link
              href="/packages"
              className="inline-block border border-white text-white text-sm font-semibold px-6 py-3 hover:bg-white hover:text-primary transition-colors"
            >
              Book a Scan
            </Link>
          </div>
        </div>
        {/* Image panel */}
        <div className="relative min-h-[320px] order-1 md:order-2">
          <Image
            src="/ultrasound.webp"
            alt="Ultrasound scan procedure"
            fill
            className="object-cover object-center"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        </div>
      </section>

      {/* ── Healthcare Screening Packages ── */}
      <section className="grid grid-cols-1 md:grid-cols-2 min-h-[420px]">
        {/* Image panel */}
        <div className="relative min-h-[320px]">
          <Image
            src="/screening.webp"
            alt="Healthcare screening"
            fill
            className="object-cover object-center"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        </div>
        {/* Text panel */}
        <div className="bg-primary flex items-center px-10 py-14 md:py-20">
          <div className="max-w-md">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-5">
              Healthcare Screening Packages
            </h2>
            <p className="text-white/85 text-sm leading-relaxed mb-4">
              When you are sick, you feel terrible, you have no choice but to think of your health,
              you adhere strictly to the physician&apos;s advice just so you get better. What if you
              can reduce your chances of falling sick in the first place? What if that chronic
              disease was detected early enough?
            </p>
            <p className="text-white/85 text-sm leading-relaxed mb-4">
              Regular screenings &amp; health checks against most illnesses can help you lead a
              long, healthy and happy life.
            </p>
            <p className="text-white/85 text-sm leading-relaxed mb-8">
              At Firmcare Diagnostics, we advocate preventive healthcare measures. This is why our
              team of medical doctors and scientists have carefully selected a series of tests to
              help you access your health status. Health checks if done regularly, can help to find
              disease early, even before the symptoms set in. This increases your chances for
              treatment and better cure.
            </p>
            <Link
              href="/packages"
              className="inline-block border border-white text-white text-sm font-semibold px-6 py-3 hover:bg-white hover:text-primary transition-colors"
            >
              Explore Healthcare Packages
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
