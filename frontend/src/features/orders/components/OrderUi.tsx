import { ShieldCheck } from 'lucide-react';
import type { ReactNode } from 'react';

import type { OrderStatus, PaymentStatus } from '../api/ordersApi';

const orderTone: Record<OrderStatus, string> = {
  PENDING_PAYMENT: 'border-amber-200 bg-amber-50 text-amber-800',
  PAID: 'border-blue-200 bg-blue-50 text-blue-800',
  READY_FOR_PICKUP: 'border-violet-200 bg-violet-50 text-violet-800',
  COMPLETED: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  CANCELLED: 'border-slate-200 bg-slate-100 text-slate-600',
  REFUNDED: 'border-indigo-200 bg-indigo-50 text-indigo-800',
  PAYMENT_FAILED: 'border-rose-200 bg-rose-50 text-rose-800',
  EXPIRED: 'border-slate-200 bg-slate-100 text-slate-600',
  PENDING: 'border-amber-200 bg-amber-50 text-amber-800',
  CONFIRMED: 'border-blue-200 bg-blue-50 text-blue-800',
};

const paymentTone: Record<PaymentStatus, string> = {
  PENDING: 'bg-amber-100 text-amber-800',
  SUCCESS: 'bg-emerald-100 text-emerald-800',
  FAILED: 'bg-rose-100 text-rose-800',
  REFUNDED: 'bg-indigo-100 text-indigo-800',
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.06em] ${orderTone[status]}`}
    >
      {humanize(status)}
    </span>
  );
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.06em] ${paymentTone[status]}`}
    >
      <ShieldCheck aria-hidden="true" className="h-3 w-3" />
      Payment {humanize(status)}
    </span>
  );
}

export function ProductThumb({
  title,
  imageUrl,
}: {
  title: string;
  imageUrl: string | null;
}) {
  return (
    <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#dbe2ec] bg-gradient-to-br from-[#e9f8fb] to-[#e7edf7]">
      {imageUrl ? (
        <img
          alt={title}
          className="h-full w-full object-cover"
          src={imageUrl}
        />
      ) : (
        <span className="px-2 text-center text-xs font-black text-[#52708c]">
          {title}
        </span>
      )}
    </div>
  );
}

export function ConfirmActionModal({
  title,
  description,
  confirmLabel,
  busy,
  danger = false,
  onCancel,
  onConfirm,
}: {
  title: string;
  description: ReactNode;
  confirmLabel: string;
  busy: boolean;
  danger?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#071b33]/60 p-4 backdrop-blur-sm"
      role="dialog"
    >
      <section className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <h2 className="text-xl font-black text-[#071b33]">{title}</h2>
        <div className="mt-3 text-sm leading-6 text-[#5f6e81]">
          {description}
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button
            className="h-10 rounded-xl border border-[#cfd8e5] px-4 text-sm font-bold text-[#344960] disabled:opacity-50"
            disabled={busy}
            onClick={onCancel}
            type="button"
          >
            Go back
          </button>
          <button
            className={`h-10 rounded-xl px-4 text-sm font-black text-white disabled:opacity-50 ${
              danger
                ? 'bg-rose-700 hover:bg-rose-800'
                : 'bg-[#071b33] hover:bg-[#0c2a4c]'
            }`}
            disabled={busy}
            onClick={onConfirm}
            type="button"
          >
            {busy ? 'Updating...' : confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}

function humanize(value: string) {
  return value
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter: string) => letter.toUpperCase());
}
