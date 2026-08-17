import { Flag, Headphones } from 'lucide-react';
import { Link } from 'react-router-dom';

export function SafetyCTA() {
  return (
    <aside className="mt-12 rounded-2xl bg-[#071b33] p-6 text-white sm:p-8">
      <p className="text-xs font-black uppercase tracking-[0.15em] text-cyan-300">
        Report and get help
      </p>
      <h2 className="mt-2 text-2xl font-black">
        Need help or noticed suspicious activity?
      </h2>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
        Use your secure support workspace when you are logged in. If you cannot
        access your account, send a public support request.
      </p>
      <div className="mt-5 flex flex-wrap gap-3">
        <Link
          className="inline-flex items-center gap-2 rounded-lg bg-cyan-400 px-4 py-2.5 text-sm font-black text-[#003846]"
          to="/student/support/new"
        >
          <Flag aria-hidden="true" className="h-4 w-4" />
          Report a Problem
        </Link>
        <Link
          className="inline-flex items-center gap-2 rounded-lg border border-slate-500 px-4 py-2.5 text-sm font-black text-white"
          to="/contact-support"
        >
          <Headphones aria-hidden="true" className="h-4 w-4" />
          Contact Support
        </Link>
      </div>
    </aside>
  );
}
