import Image from 'next/image';
import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Firmcare Advantage | FirmCare Diagnostics',
  description:
    'The Firmcare Advantage is a Laboratory Support Service aimed at adding value to your practice — advanced testing, increased efficiency, patient convenience, and improved practice.',
};

const BENEFITS = [
  {
    title: 'Advanced Testing',
    body: 'Due to the highly specialized nature of these tests, the Firmcare team is available to help build capacity that would enable excellent collection, storage and shipping of samples. With Firmcare you are able to do MORE.',
  },
  {
    title: 'Increased Efficiency',
    body: 'The Firmcare Advantage reduces additional costs and overheads on a field that isn\'t your core. Physicians are able to do more for patients and the good news of exceptional service availability at your facility will increase patient flow thereby increasing efficiency for your facility.',
  },
  {
    title: 'Patient Convenience',
    body: 'We understand that patients are the center of your universe. That is why our processes ensure more convenience for you and your patients. With the Firmcare Advantage you don\'t have to send your patients out to laboratories to run tests, all you have to do is take the samples and call us to pick them and results are sent to you via our technology platforms.',
  },
  {
    title: 'Improved practice',
    body: 'When you design a practice around collaborations, you can step off the productivity treadmill and focus on excellent patient care. With the Firmcare Advantage, healthcare providers are able to offer much more tests in their facilities within acceptable turnaround time.',
  },
];

const STEPS = [
  { number: '1', label: 'Fill the request forms properly and' },
  { number: '2', label: 'Collect samples in the right bottles' },
  { number: '3', label: 'Call the FIRMCARE sample pick-up lines to notify us about a pick up' },
];

const DESIGNED_FOR = [
  'Physicians',
  'Hospitals & Clinics',
  'Public and Private Medical Centres',
  'Referring Clinical Laboratory',
  'Medical Non-Governmental Organizations etc.',
];

export default function FirmcareAdvantagePage() {
  return (
    <main>
      {/* ── Hero ── */}
      <section className="relative min-h-[380px] md:min-h-[440px] flex items-center">
        <Image
          src="/firmcare-advantage-hero.webp"
          alt="Firmcare Advantage delivery rider"
          fill
          priority
          className="object-cover object-center"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-primary/55" />

        <div className="relative z-10 w-full max-w-6xl mx-auto px-6 py-20">
          <h1 className="text-3xl md:text-5xl font-bold text-white leading-tight mb-5 max-w-xl">
            Firmcare Advantage
          </h1>
          <p className="text-white/90 max-w-lg leading-relaxed mb-8 text-sm md:text-base">
            The Firmcare Advantage is a Laboratory Support Service aimed at adding value to your
            practice. This programme avails our partners the opportunity to order from simple to
            advanced tests which can be done irrespective of your laboratory capacity.
          </p>
          <Link
            href="/become-an-agent"
            className="inline-block border border-white text-white text-sm font-semibold px-7 py-3 hover:bg-white hover:text-primary transition-colors"
          >
            Register now
          </Link>
        </div>
      </section>

      {/* ── Intro paragraph ── */}
      <section className="max-w-3xl mx-auto px-6 py-14 md:py-18 text-center">
        <p className="text-gray-600 leading-relaxed text-sm md:text-base">
          The Firmcare team helps to build capacity that enhances excellent collection, storage and
          shipping of samples. This is very important due to the highly specialized nature of the
          tests. The Firmcare Advantage adopts a four pronged approach aimed at providing solutions
          to the challenges of laboratory services in healthcare delivery. They include Advance
          testing, Improved Capacity, Patient convenience, increased earnings.
        </p>
      </section>

      {/* ── Benefits grid ── */}
      <section className="max-w-6xl mx-auto px-6 pb-16 md:pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {BENEFITS.map(({ title, body }) => (
            <div
              key={title}
              className="bg-primary-50 border border-primary/10 px-8 py-10 flex flex-col gap-3"
            >
              <h3 className="text-base font-bold text-gray-900">{title}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="max-w-6xl mx-auto px-6 pb-16 md:pb-20">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">How It Works</h2>
        <p className="text-gray-500 text-sm mb-8">This is as simple as ABC after registration</p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {STEPS.map(({ number, label }, i) => (
            <div
              key={number}
              className={`px-8 py-10 flex flex-col gap-4 ${
                i % 2 === 1 ? 'bg-primary' : 'bg-primary/80'
              }`}
            >
              <span className="text-6xl font-bold text-white/80 leading-none">{number}</span>
              <p className="text-white text-sm leading-relaxed">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Who Is It Designed For? ── */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
          Who Is It Designed For?
        </h2>
        <p className="text-gray-500 text-sm mb-6">This service is designed for:</p>

        <ul className="flex flex-wrap gap-x-8 gap-y-2 mb-10">
          {DESIGNED_FOR.map((item) => (
            <li key={item} className="flex items-center gap-2 text-gray-700 text-sm">
              <span className="w-4 h-px bg-gray-400 shrink-0" />
              {item}
            </li>
          ))}
        </ul>

        <Link
          href="/become-an-agent"
          className="inline-block bg-primary text-white text-sm font-bold px-8 py-4 hover:bg-primary-dark transition-colors"
        >
          Register now
        </Link>
      </section>
    </main>
  );
}
