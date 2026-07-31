import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
  RefreshCw,
  SearchX,
  X,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';

import type { Pagination } from '../api/adminApi';
import { formatAdminLabel } from '../lib/adminFormat';

export function AdminPageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-700">
          {eyebrow}
        </p>
        <h1 className="mt-1 font-display text-3xl font-black text-[#031635]">
          {title}
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-[#68707d]">
          {description}
        </p>
      </div>
      {actions}
    </header>
  );
}

export function AdminLoadingState({ label }: { label: string }) {
  return (
    <div aria-live="polite" className="grid min-h-[58vh] place-items-center">
      <div className="text-center">
        <LoaderCircle className="mx-auto h-9 w-9 animate-spin text-cyan-700" />
        <p className="mt-3 text-sm font-semibold text-[#68707d]">{label}</p>
      </div>
    </div>
  );
}

export function AdminErrorState({
  title,
  message,
  onRetry,
}: {
  title: string;
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="grid min-h-[58vh] place-items-center">
      <section className="w-full max-w-md rounded-2xl border border-rose-200 bg-white p-7 text-center shadow-sm">
        <RefreshCw className="mx-auto h-8 w-8 text-rose-600" />
        <h1 className="mt-4 text-xl font-black text-[#031635]">{title}</h1>
        <p className="mt-2 text-sm text-[#68707d]">{message}</p>
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

export function AdminEmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="px-6 py-16 text-center">
      <SearchX className="mx-auto h-9 w-9 text-[#a7b0bd]" />
      <h2 className="mt-4 text-lg font-black text-[#031635]">{title}</h2>
      <p className="mt-1 text-sm text-[#68707d]">{description}</p>
    </div>
  );
}

export function StatusBadge({ value }: { value: string }) {
  const normalized = value.toUpperCase();
  const style =
    {
      ACTIVE: 'bg-emerald-100 text-emerald-800',
      SUCCESS: 'bg-emerald-100 text-emerald-800',
      COMPLETED: 'bg-emerald-100 text-emerald-800',
      VISIBLE: 'bg-emerald-100 text-emerald-800',
      PENDING: 'bg-amber-100 text-amber-800',
      PENDING_PAYMENT: 'bg-amber-100 text-amber-800',
      PENDING_VERIFICATION: 'bg-amber-100 text-amber-800',
      UNDER_REVIEW: 'bg-blue-100 text-blue-800',
      PAID: 'bg-blue-100 text-blue-800',
      READY_FOR_PICKUP: 'bg-blue-100 text-blue-800',
      BLOCKED: 'bg-rose-100 text-rose-800',
      SUSPENDED: 'bg-rose-100 text-rose-800',
      HIDDEN: 'bg-rose-100 text-rose-800',
      FAILED: 'bg-rose-100 text-rose-800',
      PAYMENT_FAILED: 'bg-rose-100 text-rose-800',
      DELETED: 'bg-slate-200 text-slate-700',
      CLOSED: 'bg-slate-200 text-slate-700',
      SOLD: 'bg-violet-100 text-violet-800',
    }[normalized] ?? 'bg-slate-100 text-slate-700';
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-black ${style}`}
    >
      {formatAdminLabel(value)}
    </span>
  );
}

export function PaginationControls({
  pagination,
  disabled,
  onPageChange,
}: {
  pagination: Pagination;
  disabled?: boolean;
  onPageChange: (page: number) => void;
}) {
  if (pagination.totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between border-t border-[#e6e8ee] px-4 py-4">
      <button
        className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#cbd3de] px-3 text-sm font-bold disabled:opacity-40"
        disabled={pagination.page === 0 || disabled}
        onClick={() => onPageChange(Math.max(0, pagination.page - 1))}
        type="button"
      >
        <ChevronLeft className="h-4 w-4" />
        Previous
      </button>
      <span className="text-xs font-semibold text-[#68707d]">
        Page {pagination.page + 1} of {pagination.totalPages}
      </span>
      <button
        className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#cbd3de] px-3 text-sm font-bold disabled:opacity-40"
        disabled={!pagination.hasMore || disabled}
        onClick={() => onPageChange(pagination.page + 1)}
        type="button"
      >
        Next
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}

export type ConfirmAction = {
  title: string;
  description: string;
  confirmLabel: string;
  tone?: 'danger' | 'warning' | 'primary';
  noteLabel?: string;
  notePlaceholder?: string;
  noteRequired?: boolean;
  onConfirm: (note: string) => Promise<void>;
};

export function ConfirmActionDialog({
  action,
  onClose,
}: {
  action?: ConfirmAction;
  onClose: () => void;
}) {
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setNote('');
    setError('');
    setSubmitting(false);
  }, [action]);

  if (!action) return null;

  async function submit() {
    if (!action) return;
    if (action.noteRequired && !note.trim()) {
      setError('Please add a clear moderation reason.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await action.onConfirm(note.trim());
      onClose();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Action failed.');
    } finally {
      setSubmitting(false);
    }
  }

  const buttonStyle = {
    danger: 'bg-rose-700 hover:bg-rose-800',
    warning: 'bg-amber-600 hover:bg-amber-700',
    primary: 'bg-[#031635] hover:bg-[#102d55]',
  }[action.tone ?? 'primary'];

  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-[80] grid place-items-center bg-[#031635]/55 p-4"
      role="dialog"
    >
      <section className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
            <AlertTriangle className="h-5 w-5" />
          </span>
          <button
            aria-label="Close confirmation"
            className="rounded-lg p-2 text-[#68707d] hover:bg-slate-100"
            disabled={submitting}
            onClick={onClose}
            type="button"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <h2 className="mt-4 text-xl font-black text-[#031635]">
          {action.title}
        </h2>
        <p className="mt-2 text-sm leading-6 text-[#68707d]">
          {action.description}
        </p>
        <label className="mt-5 block">
          <span className="text-xs font-black uppercase tracking-[0.1em] text-[#526075]">
            {action.noteLabel ?? 'Moderation note'}
          </span>
          <textarea
            className="mt-2 min-h-28 w-full resize-y rounded-xl border border-[#cbd3de] px-3 py-3 text-sm outline-none focus:border-cyan-700"
            maxLength={500}
            onChange={(event) => setNote(event.target.value)}
            placeholder={
              action.notePlaceholder ??
              'Explain the reason for this action (visible in the audit log).'
            }
            value={note}
          />
        </label>
        {error && (
          <p className="mt-2 text-sm font-semibold text-rose-700">{error}</p>
        )}
        <div className="mt-5 flex justify-end gap-3">
          <button
            className="rounded-xl border border-[#cbd3de] px-4 py-2.5 text-sm font-bold text-[#334155]"
            disabled={submitting}
            onClick={onClose}
            type="button"
          >
            Cancel
          </button>
          <button
            className={`rounded-xl px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50 ${buttonStyle}`}
            disabled={submitting}
            onClick={() => void submit()}
            type="button"
          >
            {submitting ? 'Taking action…' : action.confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}
