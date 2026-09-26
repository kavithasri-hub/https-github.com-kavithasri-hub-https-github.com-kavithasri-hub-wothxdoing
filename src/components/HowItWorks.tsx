import React from 'react';
import { Search, Handshake, RefreshCw } from 'lucide-react';

export const HowItWorks: React.FC = () => {
  const steps = [
    {
      step: '01',
      icon: Search,
      title: 'Find',
      desc: 'Discover reusable materials.',
      accent: 'emerald',
    },
    {
      step: '02',
      icon: Handshake,
      title: 'Connect',
      desc: 'Buy, sell, or request materials.',
      accent: 'teal',
    },
    {
      step: '03',
      icon: RefreshCw,
      title: 'Reuse',
      desc: 'Give resources a new value.',
      accent: 'green',
    },
  ];

  return (
    <section id="how-it-works" className="py-14 sm:py-20 bg-white border-b border-slate-200/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 border border-emerald-200/70 px-3 py-1 rounded-full">
            Simple 3-Step Process
          </span>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-950 tracking-tight mt-3">
            How It Works
          </h2>
          <p className="text-sm sm:text-base text-slate-500 mt-2 max-w-md mx-auto">
            A frictionless, transparent workflow for circular resource valorization.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {/* Subtle line connector for desktop */}
          <div className="hidden md:block absolute top-1/2 left-1/6 right-1/6 h-0.5 bg-gradient-to-r from-emerald-200 via-emerald-300 to-emerald-200 -translate-y-8 -z-0" />

          {steps.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="relative z-10 bg-[#FBFBFA] rounded-2xl p-6 sm:p-8 border border-slate-200 hover:border-emerald-300 transition-all text-center shadow-2xs hover:shadow-xs group"
              >
                {/* Step badge */}
                <span className="absolute top-4 right-4 text-xs font-black text-slate-300 group-hover:text-emerald-700 transition-colors">
                  {item.step}
                </span>

                {/* Icon */}
                <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-emerald-800 group-hover:bg-emerald-900 group-hover:text-white group-hover:border-emerald-900 transition-all mx-auto mb-5 shadow-xs">
                  <Icon className="w-7 h-7" />
                </div>

                {/* Step Title & Minimal Text exactly matching spec */}
                <h3 className="text-xl font-extrabold text-slate-900 mb-2">
                  {item.title}
                </h3>
                <p className="text-sm text-slate-600 font-medium">
                  {item.desc}
                </p>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
