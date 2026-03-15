
'use client';

import React, { useState, useEffect } from 'react';
import { Check, Mail, Phone, Sparkles, FlaskConical, CalendarCheck, ClipboardList, HeartPulse } from 'lucide-react';
import { generateHealthTip } from '@/services/geminiService';
import AnimatedSection from '@/components/ui/AnimatedSection';

const HOW_IT_WORKS = [
  {
    icon: ClipboardList,
    step: '01',
    title: 'Choose a Package',
    desc: 'Browse our curated health packages or build a custom one tailored to your specific needs.',
  },
  {
    icon: CalendarCheck,
    step: '02',
    title: 'Book & Schedule',
    desc: 'Select a convenient date and time. Opt for home sample collection or visit our centre.',
  },
  {
    icon: FlaskConical,
    step: '03',
    title: 'Sample Collection',
    desc: 'Our certified phlebotomists collect your sample safely and send it to our accredited lab.',
  },
  {
    icon: HeartPulse,
    step: '04',
    title: 'Get Your Results',
    desc: 'Receive detailed results digitally. Our team is available to walk you through the findings.',
  },
];

const InfoSection: React.FC = () => {
  const [healthTip, setHealthTip] = useState<string>('');

  useEffect(() => {
    const topics = ['nutrition', 'hydration', 'sleep', 'stress management', 'cardio exercise', 'preventive care'];
    const randomTopic = topics[Math.floor(Math.random() * topics.length)];
    generateHealthTip(randomTopic)
      .then((tip) => setHealthTip(tip))
      .catch(() => setHealthTip('Drink plenty of water and get at least 8 hours of sleep for optimal health.'));
  }, []);

  return (
    <section className="py-16 sm:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12">

        {/* How It Works */}
        <AnimatedSection animation="fadeIn">
          <div className="text-center mb-12 sm:mb-16">
            <p className="text-xs sm:text-sm font-semibold text-primary uppercase tracking-widest mb-2">Simple Process</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-3">How It Works</h2>
            <p className="text-gray-500 max-w-xl mx-auto text-sm sm:text-base">
              Getting a health screening with FirmCare is fast, easy, and stress-free — from booking to results.
            </p>
          </div>
        </AnimatedSection>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
          {HOW_IT_WORKS.map((item, idx) => {
            const Icon = item.icon;
            return (
              <AnimatedSection key={item.step} animation="fadeIn" delay={idx * 100}>
                <div className="relative bg-gray-50 rounded-3xl p-7 border border-gray-100 hover:border-primary/30 hover:shadow-lg transition-all duration-300 group h-full">
                  {/* Step number */}
                  <span className="absolute top-5 right-6 text-5xl font-black text-gray-100 group-hover:text-primary/10 transition-colors leading-none select-none">
                    {item.step}
                  </span>
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-5">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
                </div>
              </AnimatedSection>
            );
          })}
        </div>

        {/* AI Health Tip */}
        {healthTip && (
          <AnimatedSection animation="fadeIn">
            <div className="mb-16 bg-linear-to-r from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-100 flex items-start gap-4 shadow-sm">
              <div className="bg-white p-2 rounded-full shadow-sm shrink-0">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-primary font-bold text-sm mb-1">Daily Health Tip — AI Powered</p>
                <p className="text-gray-700 text-sm leading-relaxed italic">&ldquo;{healthTip}&rdquo;</p>
              </div>
            </div>
          </AnimatedSection>
        )}

        {/* Bottom two-col info */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">

          {/* Need Help */}
          <AnimatedSection animation="fadeIn">
            <div className="bg-linear-to-br from-primary-50 to-white rounded-3xl p-8 border border-primary/10">
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Need Help Choosing?</h3>
              <p className="text-gray-500 text-sm leading-relaxed mb-7">
                Our healthcare advisors are ready to help you find the perfect package for your needs — based on your health requirements and budget.
              </p>
              <div className="space-y-4">
                <a
                  href="mailto:info@firmcare.com.ng"
                  className="flex items-center gap-3 text-sm text-gray-700 hover:text-primary transition-colors group"
                >
                  <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                    <Mail className="w-4 h-4 text-primary" />
                  </div>
                  <span>info@firmcare.com.ng</span>
                </a>
                <a
                  href="tel:+2340808874327"
                  className="flex items-center gap-3 text-sm text-gray-700 hover:text-primary transition-colors group"
                >
                  <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                    <Phone className="w-4 h-4 text-primary" />
                  </div>
                  <span>+234 808-874-3272</span>
                </a>
              </div>
            </div>
          </AnimatedSection>

          {/* Why FirmCare */}
          <AnimatedSection animation="fadeIn" delay={100}>
            <div className="bg-linear-to-br from-primary-50 to-white rounded-3xl p-8 border border-primary/10">
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Why Choose FirmCare?</h3>
              <p className="text-gray-500 text-sm leading-relaxed mb-7">
                We combine world-class diagnostics with compassionate service to make healthcare accessible to everyone.
              </p>
              <ul className="space-y-4">
                {[
                  'Instant access to quality healthcare',
                  'Network of top-tier accredited hospitals',
                  'Affordable and flexible plans',
                  'Home sample collection available',
                  '24/7 customer support',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-gray-700">
                    <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-3 h-3 text-green-600" />
                    </div>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </AnimatedSection>
        </div>
      </div>
    </section>
  );
};

export default InfoSection;
