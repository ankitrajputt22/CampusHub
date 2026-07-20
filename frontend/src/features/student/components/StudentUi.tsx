import type { LucideIcon } from 'lucide-react';
import { ArrowRight } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <header className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow && (
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-700">
            {eyebrow}
          </p>
        )}
        <h1 className="mt-1 text-2xl font-bold text-slate-950 sm:text-3xl">
          {title}
        </h1>
        {description && (
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            {description}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </header>
  );
}

export function StatCard({
  label,
  value,
  detail,
  icon: Icon,
  tone = 'cyan',
}: {
  label: string;
  value: string;
  detail: string;
  icon: LucideIcon;
  tone?: 'cyan' | 'amber' | 'green' | 'blue';
}) {
  const toneClass = {
    cyan: 'bg-cyan-50 text-cyan-700',
    amber: 'bg-amber-50 text-amber-700',
    green: 'bg-emerald-50 text-emerald-700',
    blue: 'bg-blue-50 text-blue-700',
  }[tone];

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-bold text-slate-950">{value}</p>
          <p className="mt-1 text-xs text-slate-500">{detail}</p>
        </div>
        <span
          className={`flex h-10 w-10 items-center justify-center rounded-lg ${toneClass}`}
        >
          <Icon aria-hidden="true" className="h-5 w-5" />
        </span>
      </div>
    </article>
  );
}

export function SectionHeading({
  title,
  description,
  link,
}: {
  title: string;
  description?: string;
  link?: { label: string; to: string };
}) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <h2 className="text-lg font-bold text-slate-950">{title}</h2>
        {description && (
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        )}
      </div>
      {link && (
        <Link
          className="flex shrink-0 items-center gap-1 text-sm font-semibold text-cyan-800 hover:text-cyan-600"
          to={link.to}
        >
          {link.label}
          <ArrowRight aria-hidden="true" className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}

export function StatusBadge({ label }: { label: string }) {
  const normalized = label.toLowerCase();
  const color =
    normalized.includes('complete') ||
    normalized.includes('active') ||
    normalized.includes('paid')
      ? 'bg-emerald-50 text-emerald-700'
      : normalized.includes('pending') ||
          normalized.includes('ready') ||
          normalized.includes('review')
        ? 'bg-amber-50 text-amber-700'
        : normalized.includes('cancel') ||
            normalized.includes('blocked') ||
            normalized.includes('flag')
          ? 'bg-red-50 text-red-700'
          : 'bg-slate-100 text-slate-700';

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${color}`}
    >
      {label.replace(/_/g, ' ')}
    </span>
  );
}
