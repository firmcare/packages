import Image from 'next/image';
import Link from 'next/link';

const SERVICES = [
  {
    key: 'individuals',
    title: 'Individuals',
    description:
      'Our custom screening programmes provide proactive screening and early identification for a number of chronic conditions to support wellness initiatives and provide better understanding of members current health and future risks.',
    href: '/packages',
    image: '/hero/slide1.webp',
    dark: true,
  },
  {
    key: 'companies',
    title: 'Companies',
    description:
      'We are a leading provider of programs aimed at conducting health checks on clients and staff, promoting wellness and the prevention of disease.',
    href: '/our-services',
    image: '/hero/slide2.webp',
    dark: false,
  },
  {
    key: 'physicians',
    title: 'Physicians',
    description:
      'We offer a Laboratory Support Service called "The Firmcare Advantage" to hospitals and other healthcare systems. This programme avails our partners the opportunity to order from simple to advanced tests, irrespective of laboratory size.',
    href: '/our-services',
    image: '/hero/slide3.webp',
    dark: false,
  },
];

export default function ServicesSection() {
  return (
    <section className="py-16 sm:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12">
        {/* Header */}
        <div className="mb-10 sm:mb-14 max-w-2xl">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Our services</h2>
          <p className="text-gray-500 text-sm sm:text-base leading-relaxed mb-6">
            We are a top diagnostic centre in Nigeria that provides world-class medical
            investigations. Our service offerings include medical laboratory, ultrasound and
            endoscopy services. We provide a broad menu of over 3200 routine and specialized
            laboratory tests that help predict, diagnose, and monitor diseases.
          </p>
          <Link
            href="/packages"
            className="inline-block border-2 border-primary text-primary text-xs font-bold uppercase tracking-widest px-8 py-3 hover:bg-primary hover:text-white transition-colors duration-200"
          >
            Book a Test
          </Link>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-0 md:gap-0 overflow-hidden rounded-none">
          {SERVICES.map((service) => (
            <div
              key={service.key}
              className={`relative overflow-hidden flex flex-col min-h-[480px] sm:min-h-[560px] ${
                service.dark ? 'bg-[#3b1249]' : 'bg-[#f5d6ee]'
              }`}
            >
              {/* Decorative arch */}
              <div
                className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-[160%] aspect-square rounded-full ${
                  service.dark ? 'bg-[#5a1f6e]' : 'bg-[#e8a8d8]'
                } opacity-40`}
                style={{ bottom: '-30%' }}
              />

              {/* Text content */}
              <div className="relative z-10 p-8 flex-1 flex flex-col">
                <h3
                  className={`text-xl font-bold mb-3 ${
                    service.dark ? 'text-white' : 'text-gray-800'
                  }`}
                >
                  {service.title}
                </h3>
                <p
                  className={`text-sm leading-relaxed mb-6 flex-1 ${
                    service.dark ? 'text-white/80' : 'text-gray-600'
                  }`}
                >
                  {service.description}
                </p>
                <Link
                  href={service.href}
                  className={`inline-block border text-xs font-semibold uppercase tracking-wider px-6 py-2.5 self-start transition-colors duration-200 ${
                    service.dark
                      ? 'border-white/50 text-white hover:bg-white/10'
                      : 'border-gray-600/50 text-gray-700 hover:bg-white/40'
                  }`}
                >
                  Learn more
                </Link>
              </div>

              {/* Person image */}
              <div className="relative z-10 h-52 sm:h-64 mt-auto overflow-hidden">
                <Image
                  src={service.image}
                  alt={service.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover object-top"
                  style={{
                    maskImage: 'linear-gradient(to bottom, transparent 0%, black 30%)',
                    WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 30%)',
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
