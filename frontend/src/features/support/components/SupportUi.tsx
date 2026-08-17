import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  LoaderCircle,
  SearchX,
} from 'lucide-react';
import type { ReactNode } from 'react';

import type { SupportPriority, SupportStatus } from '../api/supportApi';
import { supportLabel } from '../lib/supportUtils';

export function SupportStatusBadge({ status }: { status: SupportStatus }) {
  const styles: Record<SupportStatus, string> = {
    OPEN: 'bg-cyan-100 text-cyan-900',
    IN_PROGRESS: 'bg-blue-100 text-blue-900',
    WAITING_FOR_USER: 'bg-amber-100 text-amber-900',
    RESOLVED: 'bg-emerald-100 text-emerald-900',
    CLOSED: 'bg-slate-200 text-slate-700',
    REJECTED: 'bg-rose-100 text-rose-900',
    SPAM: 'bg-rose-100 text-rose-900',
  };
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-black ${styles[status]}`}
    >
      {supportLabel(status)}
    </span>
  );
}

export function SupportPriorityBadge({
  priority,
}: {
  priority: SupportPriority;
}) {
  const styles: Record<SupportPriority, string> = {
    LOW: 'bg-slate-100 text-slate-700',
    MEDIUM: 'bg-violet-100 text-violet-800',
    HIGH: 'bg-amber-100 text-amber-900',
    URGENT: 'bg-rose-100 text-rose-900',
  };
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-black ${styles[priority]}`}
    >
      {supportLabel(priority)} priority
    </span>
  );
}

export function SupportLoading({ label }: { label: string }) {
  return (
    <div className="grid min-h-[52vh] place-items-center" role="status">
      <div className="text-center">
        <LoaderCircle className="mx-auto h-9 w-9 animate-spin text-cyan-700" />
        <p className="mt-3 text-sm font-semibold text-[#68707d]">{label}</p>
      </div>
    </div>
  );
}

export function SupportError({
  title,
  message,
  onRetry,
}: {
  title: string;
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="grid min-h-[52vh] place-items-center">
      <section className="w-full max-w-md rounded-2xl border border-rose-200 bg-white p-7 text-center shadow-sm">
        <AlertCircle className="mx-auto h-9 w-9 text-rose-600" />
        <h1 className="mt-4 text-xl font-black text-[#031635]">{title}</h1>
        <p className="mt-2 text-sm leading-6 text-[#68707d]">{message}</p>
        <button
          className="mt-5 rounded-xl bg-[#031635] px-5 py-3 text-sm font-bold text-white"
          onClick={onRetry}
          type="button"
        >
          Try again
        </button>
      </section>
    </div>
  );
}

export function SupportEmpty({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="px-6 py-16 text-center">
      <SearchX className="mx-auto h-9 w-9 text-[#a7b0bd]" />
      <h2 className="mt-4 text-lg font-black text-[#031635]">{title}</h2>
      <p className="mx-auto mt-1 max-w-lg text-sm leading-6 text-[#68707d]">
        {description}
      </p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function SupportNotice({
  tone,
  children,
}: {
  tone: 'success' | 'warning' | 'error';
  children: ReactNode;
}) {
  const style = {
    success: 'border-emerald-200 bg-emerald-50 text-emerald-900',
    warning: 'border-amber-200 bg-amber-50 text-amber-900',
    error: 'border-rose-200 bg-rose-50 text-rose-900',
  }[tone];
  const Icon =
    tone === 'success'
      ? CheckCircle2
      : tone === 'warning'
        ? Clock3
        : AlertCircle;
  return (
    <div
      className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm leading-6 ${style}`}
      role={tone === 'error' ? 'alert' : 'status'}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{children}</span>
    </div>
  );
}
