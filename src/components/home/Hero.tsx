import { STATS } from '@/lib/constants';
import Link from 'next/link';
import HeroCarousel from './HeroCarousel';

const Hero: React.FC = () => {
  return (
    <section
      className="relative overflow-hidden flex flex-col h-[calc(100dvh-64px)] md:h-[calc(100dvh-72px)]"
      style={{ background: 'linear-gradient(135deg, #3b1249 0%, #7b2e74 40%, #A44692 70%, #c96cb0 100%)' }}
    >
      {/* Floating decorative orbs */}
      <div className="absolute top-10 left-10 w-72 h-72 bg-white/5 rounded-full blur-3xl animate-float pointer-events-none" />
      <div className="absolute top-32 right-20 w-48 h-48 bg-pink-300/10 rounded-full blur-2xl animate-floatSlow pointer-events-none" />
      <div className="absolute bottom-20 left-1/3 w-96 h-40 bg-purple-300/10 rounded-full blur-3xl animate-float pointer-events-none" style={{ animationDelay: '2s' }} />

      {/* Subtle grid pattern overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)',
          backgroundSize: '36px 36px',
        }}
      />

      {/* Main content — flex-1 so it fills all space above the stats bar */}
      <div className="relative z-10 flex-1 min-h-0 max-w-7xl w-full mx-auto px-4 sm:px-6 md:px-12 pt-8 sm:pt-12 md:pt-16 pb-6 flex flex-col md:flex-row items-center gap-6 md:gap-12">

        {/* Left — Content */}
        <div className="w-full md:w-1/2 text-center md:text-left shrink-0">

          {/* Pill badge */}
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white/90 text-xs font-semibold px-4 py-1.5 rounded-full mb-4 animate-fadeIn">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
            Trusted by 5,000+ patients across Abuja
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-5xl lg:text-6xl font-extrabold leading-[1.08] tracking-tight text-white mb-4 animate-slideInLeft">
            Precision Diagnostics<br />
            <span className="text-pink-200">for Preventive Care</span>
          </h1>

          <p className="text-sm sm:text-lg text-purple-100/90 mb-6 max-w-xl mx-auto md:mx-0 leading-relaxed animate-slideInLeft">
            Comprehensive laboratory screening packages designed to detect health risks early and empower you with actionable insights — all from one trusted provider.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start animate-slideInLeft">
            <Link
              href="/category/all"
              className="bg-white whitespace-nowrap text-primary font-bold py-3.5 px-8 rounded-full hover:bg-gray-50 transition-all duration-300 hover:scale-105 hover:shadow-2xl text-sm sm:text-base shadow-lg"
            >
              Explore Packages
            </Link>
            <Link
              href="#find-a-test"
              className="border-2 whitespace-nowrap border-white/40 text-white font-semibold py-3.5 px-8 rounded-full hover:bg-white/10 transition-all duration-300 text-sm sm:text-base backdrop-blur-sm"
            >
              Find a Test ↓
            </Link>
          </div>
        </div>

        {/* Right — Image Carousel */}
        <HeroCarousel />
      </div>

      {/* Stats bar — in-flow at the bottom, never overlaps content */}
      <div className="relative z-20 w-full bg-black/20 backdrop-blur-md border-t border-white/10 py-5 animate-slideInUp shrink-0">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 flex justify-center gap-0">
          {STATS.map((stat, idx) => (
            <div
              key={idx}
              className={`flex flex-col items-center flex-1 transition-transform duration-300 hover:scale-105 ${
                idx > 0 ? 'border-l border-white/20' : ''
              }`}
            >
              <span className="text-2xl sm:text-3xl font-extrabold text-white">{stat.value}</span>
              <span className="text-[10px] sm:text-xs font-medium text-purple-200 uppercase tracking-wider mt-0.5 text-center px-2">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Wave divider — sits just above the stats bar */}
      <div className="absolute bottom-[72px] left-0 w-full overflow-hidden leading-none z-10 pointer-events-none">
        <svg viewBox="0 0 1440 60" preserveAspectRatio="none" className="w-full h-16 opacity-10" aria-hidden>
          <path d="M0,30 C360,60 1080,0 1440,30 L1440,60 L0,60 Z" fill="white" />
        </svg>
      </div>
    </section>
  );
};

export default Hero;
