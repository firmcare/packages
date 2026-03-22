'use client';

import Image from 'next/image';
import { useEffect, useState, useCallback } from 'react';

const SLIDES = [
  { src: '/hero/slide1.png', alt: 'FirmCare diagnostics and wellness' },
  { src: '/hero/slide2.png', alt: 'Family health checkup at FirmCare' },
  { src: '/hero/slide3.png', alt: 'Medical diagnostics at FirmCare' },
  { src: '/hero/slide4.png', alt: 'Wellness screening at FirmCare' },
];

const INTERVAL = 4500;

export default function HeroCarousel() {
  const [active, setActive] = useState(0);
  const [animating, setAnimating] = useState(false);

  const goTo = useCallback((idx: number) => {
    if (animating) return;
    setAnimating(true);
    setActive(idx);
    setTimeout(() => setAnimating(false), 600);
  }, [animating]);

  useEffect(() => {
    const timer = setInterval(() => {
      setActive(prev => (prev + 1) % SLIDES.length);
    }, INTERVAL);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="hidden md:flex relative w-full md:w-1/2 justify-center md:justify-end">
      {/* Glow ring */}
      <div className="absolute inset-0 flex items-center justify-center md:justify-end pointer-events-none">
        <div className="w-[420px] h-[420px] sm:w-[500px] sm:h-[500px] md:w-[580px] md:h-[580px] rounded-full bg-pink-400/20 blur-3xl" />
      </div>

      {/* Image stack */}
      <div className="relative animate-slideInRight z-10 w-[320px] sm:w-[440px] md:w-[520px]">
        {SLIDES.map((slide, idx) => (
          <div
            key={idx}
            className="transition-all duration-700 ease-in-out"
            style={{
              opacity: idx === active ? 1 : 0,
              transform: idx === active ? 'scale(1) translateY(0)' : 'scale(0.97) translateY(8px)',
              pointerEvents: idx === active ? 'auto' : 'none',
              position: idx === 0 ? 'relative' : 'absolute',
              top: 0,
              left: 0,
              right: 0,
            }}
          >
            <Image
              src={slide.src}
              alt={slide.alt}
              width={600}
              height={700}
              className="w-full h-auto object-cover rounded-3xl shadow-2xl ring-4 ring-white/10"
              style={{
                maskImage: 'linear-gradient(to bottom, black 75%, transparent 100%)',
                WebkitMaskImage: 'linear-gradient(to bottom, black 75%, transparent 100%)',
              }}
              priority={idx === 0}
            />
          </div>
        ))}

        {/* Dot indicators */}
        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-20">
          {SLIDES.map((_, idx) => (
            <button
              key={idx}
              onClick={() => goTo(idx)}
              aria-label={`Slide ${idx + 1}`}
              className={`rounded-full transition-all duration-500 ${
                idx === active
                  ? 'w-6 h-2 bg-white shadow-md'
                  : 'w-2 h-2 bg-white/40 hover:bg-white/70'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
