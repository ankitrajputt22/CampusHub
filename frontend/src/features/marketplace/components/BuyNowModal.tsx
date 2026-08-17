import {
  CheckCircle2,
  CreditCard,
  ShieldCheck,
  ShoppingBag,
  X,
} from 'lucide-react';
import { Link } from 'react-router-dom';

import type { OrderInitiation, ProductDetails } from '../api/marketplaceApi';
import { formatPrice } from '../lib/marketplaceFormatters';

export function BuyNowModal({
  product,
  open,
  submitting,
  order,
  error,
  submittingLabel,
  onClose,
  onConfirm,
}: {
  product: ProductDetails;
  open: boolean;
  submitting: boolean;
  order: OrderInitiation | null;
  error: string | null;
  submittingLabel: string;
  onClose: () => void;
  onConfirm: () => void;
}) {
  if (!open) return null;

  return (
    <div
      aria-labelledby="buy-now-title"
      aria-modal="true"
      className="fixed inset-0 z-[90] flex items-center justify-center bg-[#031635]/65 p-4"
      role="dialog"
    >
      <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.13em] text-[#007b95]">
              <ShoppingBag aria-hidden="true" className="h-4 w-4" />
              Secure campus purchase
            </p>
            <h2
              className="mt-2 text-xl font-black text-[#071b33]"
              id="buy-now-title"
            >
              {order ? 'Order ready for payment' : 'Confirm your order'}
            </h2>
          </div>
          <button
            aria-label="Close order dialog"
            className="rounded-lg p-2 text-[#667386] hover:bg-[#eff4ff]"
            disabled={submitting}
            onClick={onClose}
            type="button"
          >
            <X aria-hidden="true" className="h-5 w-5" />
          </button>
        </div>

        {order ? (
          <div className="py-5 text-center">
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <CheckCircle2 aria-hidden="true" className="h-8 w-8" />
            </span>
            <p className="mt-4 font-black text-[#10233d]">
              {order.order.orderNumber}
            </p>
            <p className="mt-2 text-sm leading-6 text-[#667386]">
              Your Campus Hub order is safely pending. Only backend signature
              verification can mark it paid.
            </p>
            <div className="mt-5 rounded-xl bg-[#f3f7fd] px-4 py-3 text-left">
              <p className="line-clamp-1 text-sm font-bold text-[#21344c]">
                {order.order.listingTitle}
              </p>
              <p className="mt-1 text-lg font-black text-[#031635]">
                {formatPrice(order.order.amount)}
              </p>
            </div>
            <Link
              className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#031635] px-4 text-sm font-bold text-white hover:bg-[#153557]"
              to={`/student/payments?orderId=${order.order.id}`}
            >
              <CreditCard aria-hidden="true" className="h-4 w-4" />
              Continue to payments
            </Link>
            {error && (
              <p
                className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 text-left text-sm text-amber-900"
                role="alert"
              >
                {error}
              </p>
            )}
          </div>
        ) : (
          <>
            <div className="mt-5 rounded-xl border border-[#dce2eb] bg-[#f8faff] p-4">
              <p className="line-clamp-2 font-black text-[#10233d]">
                {product.title}
              </p>
              <div className="mt-3 flex items-end justify-between gap-3">
                <span className="text-sm text-[#667386]">Order total</span>
                <strong className="text-2xl font-black text-[#031635]">
                  {formatPrice(product.price)}
                </strong>
              </div>
            </div>
            <div className="mt-4 flex items-start gap-3 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-3 text-sm leading-6 text-emerald-900">
              <ShieldCheck
                aria-hidden="true"
                className="mt-0.5 h-5 w-5 shrink-0"
              />
              Availability, college access, account status, and seller identity
              will be checked again before the order is created.
            </div>
            <p className="mt-3 text-center text-xs leading-5 text-[#667386]">
              Never share passwords, OTPs, card details, or a UPI PIN.{' '}
              <Link
                className="font-black text-[#007b95]"
                to="/safety-guidelines"
              >
                Read the Safety Guidelines
              </Link>
              .
            </p>
            {error && (
              <p
                className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-3 text-sm text-rose-800"
                role="alert"
              >
                {error}
              </p>
            )}
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button
                className="h-11 rounded-xl border border-[#c3ccd8] text-sm font-bold text-[#263a52]"
                disabled={submitting}
                onClick={onClose}
                type="button"
              >
                Cancel
              </button>
              <button
                className="h-11 rounded-xl bg-[#031635] text-sm font-bold text-white hover:bg-[#153557] disabled:cursor-wait disabled:opacity-60"
                disabled={submitting}
                onClick={onConfirm}
                type="button"
              >
                {submitting ? submittingLabel : 'Create order and pay securely'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
