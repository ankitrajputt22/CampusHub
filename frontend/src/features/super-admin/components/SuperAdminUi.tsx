import type { ReactNode } from 'react';

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.16em] text-rose-700">
          {eyebrow}
        </p>
        <h1 className="mt-2 font-display text-3xl font-black text-[#09172d]">
          {title}
        </h1>
        <p className="mt-2 max-w-3xl text-sm font-medium text-[#607089]">
          {description}
        </p>
      </div>
      {action}
    </div>
  );
}

export function StatCard({
  label,
  value,
  tone = 'default',
}: {
  label: string;
  value: string | number;
  tone?: 'default' | 'warning' | 'success';
}) {
  const tones = {
    default: 'border-[#d9e2ef] bg-white',
    warning: 'border-amber-200 bg-amber-50',
    success: 'border-emerald-200 bg-emerald-50',
  };
  return (
    <div className={`rounded-xl border p-5 shadow-sm ${tones[tone]}`}>
      <p className="text-xs font-black uppercase tracking-[0.12em] text-[#64748b]">
        {label}
      </p>
      <p className="mt-2 text-3xl font-black text-[#09172d]">{value}</p>
    </div>
  );
}

export function Panel({
  title,
  children,
  action,
}: {
  title: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-[#d9e2ef] bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="font-display text-lg font-black text-[#09172d]">
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export function StatusPill({ value }: { value: string }) {
  const normalized = value.toUpperCase();
  const className = normalized.includes('ACTIVE') || normalized === 'UP'
    ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
    : normalized.includes('PENDING') || normalized.includes('OPEN')
      ? 'bg-amber-50 text-amber-700 ring-amber-200'
      : 'bg-rose-50 text-rose-700 ring-rose-200';
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-black ring-1 ${className}`}>
      {value.replace(/_/g, ' ')}
    </span>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-[#cfd9e8] bg-[#f8fafc] p-8 text-center text-sm font-bold text-[#66758a]">
      {children}
    </div>
  );
}

export function LoadingState({ label }: { label: string }) {
  return (
    <div className="rounded-xl border border-[#d9e2ef] bg-white p-10 text-center text-sm font-black text-[#607089] shadow-sm">
      {label}
    </div>
  );
}

export function ErrorState({
  title,
  onRetry,
}: {
  title: string;
  onRetry: () => void;
}) {
  return (
    <div className="rounded-xl border border-rose-200 bg-white p-10 text-center shadow-sm">
      <p className="font-display text-xl font-black text-[#09172d]">{title}</p>
      <button
        className="mt-5 rounded-xl bg-[#111827] px-5 py-3 text-sm font-black text-white"
        onClick={onRetry}
        type="button"
      >
        Try again
      </button>
    </div>
  );
}
