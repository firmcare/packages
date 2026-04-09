import Image from 'next/image';

const TRUST_POINTS = [
  'We are known for fast turnaround time',
  'Adopt latest technologies to deliver reliable and trusted results',
  'Skilled and experienced medical professionals',
  'Calm and professional environment with a promise of satisfaction from every interaction',
];

export default function WhyTrustUs() {
  return (
    <section className="bg-white">
      <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[480px]">
        {/* Left: text content */}
        <div className="flex flex-col justify-center px-8 sm:px-12 md:px-16 py-16 sm:py-20">
          <div className="flex items-center gap-3 mb-4">
            <span className="w-8 h-px bg-gray-800 block" />
            <span className="text-gray-500 text-sm font-medium">Why</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
            Trust us
          </h2>
          <p className="text-gray-500 text-sm sm:text-base leading-relaxed mb-8 max-w-md">
            We are passionate about our services and we conduct numerous medical investigations
            each day with the much-needed attention required to support quality outcomes.
          </p>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
            {TRUST_POINTS.map((point) => (
              <li key={point} className="flex items-start gap-3">
                <span className="mt-0.5 shrink-0 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                  <svg
                    className="w-3 h-3 text-white"
                    viewBox="0 0 12 12"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M2 6l3 3 5-5" />
                  </svg>
                </span>
                <span className="text-sm text-gray-600 leading-snug">{point}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Right: image */}
        <div className="relative min-h-[320px] lg:min-h-0">
          <Image
            src="/about.webp"
            alt="FirmCare Diagnostics facility"
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover object-center"
          />
          {/* subtle overlay */}
          <div className="absolute inset-0 bg-primary/10" />
        </div>
      </div>
    </section>
  );
}
