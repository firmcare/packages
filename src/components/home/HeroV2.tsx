'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState, useCallback, useRef } from 'react';
import { STATS } from '@/lib/constants';

const SLIDES = [
  {
    src: '/landing/1.jpg',
    label: "Men's Health",
    title: "Men's Health",
    subtitle:
      'A healthcare solution created to help screen for cancer and other health conditions that commonly affect men.',
    href: '/packages',
  },
  {
    src: '/landing/womens-health-slider-home.jpg',
    label: "Women's Health",
    title: "Women's Health",
    subtitle:
      'Comprehensive laboratory tests tailored to women — helping you understand your health and detect risks early.',
    href: '/packages',
  },
  {
    src: '/landing/DNA-slider-home.jpg',
    label: 'DNA & Genomics',
    title: 'DNA & Genomics',
    subtitle:
      'Advanced genomic screening to give you deep insights into your genetic health profile and future risks.',
    href: '/packages',
  },
  {
    src: '/landing/personal-health-assistance-slider-home.jpg',
    label: 'Personal Health',
    title: 'Personal Health Assistance',
    subtitle:
      'Personalised health monitoring and assistance programmes to keep you and your family in optimal health.',
    href: '/packages',
  },
  {
    src: '/landing/Ultasound-slider-home.jpg',
    label: 'Ultrasound',
    title: '4D Ultrasound Services',
    subtitle:
      'State-of-the-art ultrasound imaging to help detect and monitor a wide range of medical conditions.',
    href: '/packages',
  },
  {
    src: '/landing/Domestic-staff-screening-slider-home.jpg',
    label: 'Staff Screening',
    title: 'Domestic Staff Screening',
    subtitle:
      'Reliable and thorough health screening packages designed specifically for domestic and corporate staff.',
    href: '/packages',
  },
];

const INTERVAL = 5500;

type Phase = 'idle' | 'exit' | 'enter';

export default function HeroV2() {
  const [active, setActive] = useState(0);
  const [displayed, setDisplayed] = useState(0);
  const [phase, setPhase] = useState<Phase>('idle');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Ref tracks displayed without triggering the transition effect again
  const displayedRef = useRef(0);

  const goTo = useCallback(
    (idx: number) => {
      if (idx === active) return;
      setActive(idx);
    },
    [active],
  );

  // Restart auto-play timer whenever active changes (including manual clicks)
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setActive((prev) => (prev + 1) % SLIDES.length);
    }, INTERVAL);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [active]);

  // Text slide transition: exit → swap content → enter
  // Only depends on `active` — using a ref for "last displayed" so that
  // updating displayed state doesn't re-trigger this effect and cancel timers.
  useEffect(() => {
    if (active === displayedRef.current) return;

    setPhase('exit');

    const swapTimer = setTimeout(() => {
      displayedRef.current = active;
      setDisplayed(active);
      setPhase('enter');
    }, 360);

    const settleTimer = setTimeout(() => {
      setPhase('idle');
    }, 720);

    return () => {
      clearTimeout(swapTimer);
      clearTimeout(settleTimer);
    };
  }, [active]);

  const textStyle: React.CSSProperties = {
    transition: 'opacity 350ms ease, transform 380ms cubic-bezier(0.22, 1, 0.36, 1)',
    opacity: phase === 'idle' ? 1 : 0,
    transform:
      phase === 'exit'
        ? 'translateY(-28px)'
        : phase === 'enter'
        ? 'translateY(32px)'
        : 'translateY(0)',
  };

  const slide = SLIDES[displayed];

  return (
    <section className="relative w-full h-[calc(100dvh-64px)] md:h-[calc(100dvh-72px)] overflow-hidden flex flex-col">
      {/* Background slides */}
      {SLIDES.map((s, idx) => (
        <div
          key={idx}
          className="absolute inset-0 transition-opacity duration-700 ease-in-out"
          style={{ opacity: idx === active ? 1 : 0, zIndex: idx === active ? 1 : 0 }}
          aria-hidden={idx !== active}
        >
          <Image
            src={s.src}
            alt={s.label}
            fill
            priority={idx === 0}
            sizes="100vw"
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-linear-to-r from-black/75 via-black/40 to-transparent" />
        </div>
      ))}

      {/* Content */}
      <div className="relative z-10 flex-1 min-h-0 flex items-center">
        <div className="w-full max-w-7xl mx-auto px-6 md:px-12 flex items-center justify-between">

          {/* Left: animated text */}
          <div className="max-w-lg w-full" style={textStyle}>
            {/* Label pill */}
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white/90 text-xs font-semibold px-4 py-1.5 rounded-full mb-5 uppercase tracking-widest">
              <span className="w-1.5 h-1.5 bg-primary rounded-full" />
              {slide.label}
            </div>

            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight mb-4 uppercase tracking-wide">
              {slide.title}
            </h1>

            <p className="text-white/80 text-sm md:text-base leading-relaxed mb-8 max-w-sm">
              {slide.subtitle}
            </p>

            {/* CTA buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href={slide.href}
                className="group inline-flex items-center justify-center gap-2.5 bg-primary text-white font-bold text-sm px-7 py-3.5 rounded-full hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300 hover:scale-[1.03]"
              >
                View Package
                <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white/30 transition-colors">
                  <svg className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 7h10M8 3l4 4-4 4" />
                  </svg>
                </span>
              </Link>

              <Link
                href="/custom-package"
                className="inline-flex items-center justify-center gap-2 border-2 border-white/50 text-white font-semibold text-sm px-7 py-3.5 rounded-full hover:bg-white/10 hover:border-white transition-all duration-300 backdrop-blur-sm"
              >
                Build Custom Package
              </Link>
            </div>
          </div>

          {/* Right: numbered navigation */}
          <div className="hidden md:flex flex-col gap-4 items-end shrink-0 pl-8">
            {SLIDES.map((_, idx) => {
              const num = String(idx + 1).padStart(2, '0');
              const isActive = idx === active;
              return (
                <button
                  key={idx}
                  onClick={() => goTo(idx)}
                  aria-label={`Go to slide ${num}`}
                  className={`flex items-center gap-2 transition-all duration-300 ${
                    isActive ? 'opacity-100' : 'opacity-35 hover:opacity-60'
                  }`}
                >
                  {isActive && (
                    <span className="w-5 h-px bg-white block" />
                  )}
                  <span
                    className={`font-mono text-white leading-none transition-all duration-300 ${
                      isActive ? 'text-sm font-bold' : 'text-xs font-normal'
                    }`}
                  >
                    {num}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Stats bar — in-flow at the bottom, always visible within the hero */}
      <div className="relative z-20 w-full bg-black/40 backdrop-blur-md border-t border-white/10 py-5 shrink-0">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 flex justify-center gap-0">
          {STATS.map((stat, idx) => (
            <div
              key={idx}
              className={`flex flex-col items-center flex-1 ${idx > 0 ? 'border-l border-white/20' : ''}`}
            >
              <span className="text-2xl sm:text-3xl font-extrabold text-white">{stat.value}</span>
              <span className="text-[10px] sm:text-xs font-medium text-purple-200 uppercase tracking-wider mt-0.5 text-center px-2">
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Mobile dot indicators */}
      <div className="absolute bottom-22 left-6 flex gap-2 z-20 md:hidden">
        {SLIDES.map((_, idx) => (
          <button
            key={idx}
            onClick={() => goTo(idx)}
            aria-label={`Slide ${idx + 1}`}
            className={`rounded-full transition-all duration-500 ${
              idx === active ? 'w-6 h-2 bg-white' : 'w-2 h-2 bg-white/40'
            }`}
          />
        ))}
      </div>
    </section>
  );
}
