import { Check, MapPin, ShieldCheck } from 'lucide-react';
import { Outlet } from 'react-router-dom';

import { LegalFooter } from '../components/LegalFooter';
import { LegalHeader } from '../components/LegalHeader';

export function PublicShell() {
  return (
    <div className="min-h-screen bg-[#f7f9fb] text-slate-900">
      <LegalHeader />
      <main>
        <Outlet />
      </main>
      <LegalFooter />
    </div>
  );
}

export function AboutPage() {
  return (
    <div>
      <section className="border-b border-slate-200 bg-[#071b33] px-4 py-16 text-white sm:px-6">
        <div className="mx-auto max-w-5xl">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-300">
            About Campus Hub
          </p>
          <h1 className="mt-3 max-w-3xl text-3xl font-black sm:text-4xl">
            A verified marketplace built around college communities.
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-slate-300">
            Campus Hub helps students discover useful items, sell what they no
            longer need, and arrange safer campus handovers with identity and
            trust signals.
          </p>
        </div>
      </section>
      <section className="mx-auto grid max-w-5xl gap-5 px-4 py-12 sm:px-6 md:grid-cols-3">
        <AboutCard
          icon={ShieldCheck}
          title="Verified membership"
          text="College email and phone verification establish a student-only starting point."
        />
        <AboutCard
          icon={MapPin}
          title="Campus first"
          text="The default marketplace stays connected to the student’s verified college."
        />
        <AboutCard
          icon={Check}
          title="Trust through action"
          text="Completed orders, honest reviews, and safe behavior build marketplace reputation."
        />
      </section>
    </div>
  );
}

function AboutCard({
  icon: Icon,
  title,
  text,
}: {
  icon: typeof ShieldCheck;
  title: string;
  text: string;
}) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-50 text-cyan-800">
        <Icon aria-hidden="true" className="h-5 w-5" />
      </span>
      <h2 className="mt-4 font-bold text-slate-950">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
    </article>
  );
}
