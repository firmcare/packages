
'use client';

import React, { useState, useEffect } from 'react';
import { Star, ChevronLeft, ChevronRight, Quote } from 'lucide-react';
import { TESTIMONIALS } from '@/lib/constants';
import AnimatedSection from '@/components/ui/AnimatedSection';

const ITEMS_PER_PAGE = 3;
const totalSlides = Math.ceil(TESTIMONIALS.length / ITEMS_PER_PAGE);

const StarRating = ({ rating }: { rating: number }) => (
  <div className="flex gap-0.5">
    {[...Array(5)].map((_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200 fill-gray-200'}`}
      />
    ))}
  </div>
);

const Testimonials: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % totalSlides);
    }, 5000);
    return () => clearInterval(interval);
  }, [isPaused]);

  const goTo = (index: number) => setCurrentIndex(index);
  const prev = () => setCurrentIndex((p) => (p - 1 + totalSlides) % totalSlides);
  const next = () => setCurrentIndex((p) => (p + 1) % totalSlides);

  const visible = TESTIMONIALS.slice(
    currentIndex * ITEMS_PER_PAGE,
    currentIndex * ITEMS_PER_PAGE + ITEMS_PER_PAGE,
  );

  return (
    <section className="py-16 sm:py-20 bg-linear-to-b from-white to-[#fdf6fb]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12">

        {/* Section header */}
        <AnimatedSection animation="fadeIn">
          <div className="text-center mb-12 sm:mb-16">
            <p className="text-xs sm:text-sm font-semibold text-primary uppercase tracking-widest mb-2">Patient Stories</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-3">What Our Patients Say</h2>
            <p className="text-gray-500 max-w-xl mx-auto text-sm sm:text-base">
              Real experiences from people who have trusted FirmCare with their health journey.
            </p>
          </div>
        </AnimatedSection>

        {/* Carousel */}
        <div
          className="relative"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {visible.map((t, idx) => {
              const initials = t.author
                .split(' ')
                .map((n: string) => n[0])
                .join('')
                .slice(0, 2)
                .toUpperCase();

              return (
                <AnimatedSection key={`${t.id}-${currentIndex}-${idx}`} animation="fadeIn" delay={idx * 100}>
                  <div className="group bg-white rounded-3xl p-7 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 hover:-translate-y-1.5 flex flex-col h-full relative overflow-hidden">

                    {/* Decorative quote */}
                    <Quote className="absolute top-5 right-6 w-10 h-10 text-primary/10 fill-primary/10" />

                    {/* Stars */}
                    <StarRating rating={t.rating} />

                    {/* Quote text */}
                    <p className="text-gray-600 text-sm leading-relaxed mt-4 mb-6 grow">
                      &ldquo;{t.text}&rdquo;
                    </p>

                    {/* Author */}
                    <div className="flex items-center gap-3 mt-auto pt-4 border-t border-gray-100">
                      <div className="w-10 h-10 rounded-full bg-linear-to-br from-primary to-primary-light flex items-center justify-center shrink-0">
                        <span className="text-white text-xs font-bold">{initials}</span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{t.author}</p>
                        <p className="text-xs text-gray-400">Verified Patient</p>
                      </div>
                    </div>
                  </div>
                </AnimatedSection>
              );
            })}
          </div>

          {/* Navigation */}
          {totalSlides > 1 && (
            <div className="flex items-center justify-center gap-4 mt-10">
              <button
                onClick={prev}
                className="p-2.5 rounded-full border-2 border-primary/30 text-primary hover:bg-primary hover:text-white hover:border-primary transition-all duration-200"
                aria-label="Previous"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex gap-2">
                {Array.from({ length: totalSlides }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => goTo(i)}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      i === currentIndex ? 'bg-primary w-8' : 'bg-gray-300 w-2 hover:bg-gray-400'
                    }`}
                    aria-label={`Slide ${i + 1}`}
                  />
                ))}
              </div>

              <button
                onClick={next}
                className="p-2.5 rounded-full border-2 border-primary/30 text-primary hover:bg-primary hover:text-white hover:border-primary transition-all duration-200"
                aria-label="Next"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
