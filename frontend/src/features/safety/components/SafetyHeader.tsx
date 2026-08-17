import { ShieldCheck } from 'lucide-react';

import { SAFETY_LAST_UPDATED } from '../constants/safetyGuidelinesContent';

export function SafetyHeader() {
  return (
    <section className="border-b border-slate-200 bg-[#071b33] px-4 py-12 text-white sm:px-6 sm:py-16">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-cyan-300">
          <ShieldCheck aria-hidden="true" className="h-4 w-4" />
          Safer campus trading
        </div>
        <h1 className="mt-4 max-w-4xl text-3xl font-black tracking-[-0.04em] sm:text-5xl">
          Safety Guidelines
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-slate-300 sm:text-lg">
          Learn how to buy, sell, pay, meet, and report safely on Campus Hub.
        </p>
        <p className="mt-5 text-sm font-bold text-cyan-100">
          Last updated: {SAFETY_LAST_UPDATED}
        </p>
      </div>
    </section>
  );
}
