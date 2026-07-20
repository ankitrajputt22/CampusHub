import { ArrowLeft, ShieldCheck } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

export function AuthUtilityLayout({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f4f7fb] px-4 py-10 text-slate-900">
      <div className="w-full max-w-md">
        <Link
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-cyan-800"
          to="/login"
        >
          <ArrowLeft aria-hidden="true" className="h-4 w-4" />
          Back to login
        </Link>
        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-cyan-100 text-cyan-800">
            <ShieldCheck aria-hidden="true" className="h-5 w-5" />
          </div>
          <p className="mt-5 text-xs font-bold uppercase tracking-[0.15em] text-cyan-700">
            {eyebrow}
          </p>
          <h1 className="mt-2 text-2xl font-black text-[#071b33]">{title}</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
          <div className="mt-6">{children}</div>
        </section>
        <p className="mt-5 text-center text-xs leading-5 text-slate-400">
          Test interface only. Password recovery backend delivery will be
          connected later.
        </p>
      </div>
    </main>
  );
}

export const utilityInputClass =
  'h-11 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100';
