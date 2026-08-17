import { isAxiosError } from 'axios';
import {
  BadgeIndianRupee,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  CreditCard,
  ReceiptText,
  RotateCcw,
  Search,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import { resolveApiAssetUrl } from '../../../lib/apiClient';
import { ProductThumb } from '../../orders/components/OrderUi';
import {
  formatCurrency,
  formatDate,
  humanize,
} from '../../orders/lib/orderFormat';
import {
  getMyPayments,
  type PaymentStatus,
  type PaymentsPageData,
  type PaymentSummary,
} from '../api/paymentsApi';
import { PaymentCheckoutButton } from '../components/PaymentCheckoutButton';

const initialPayments: PaymentsPageData = {
  stats: {
    totalPayments: 0,
    successfulPayments: 0,
    pendingPayments: 0,
    failedPayments: 0,
    refundedPayments: 0,
    totalSpent: 0,
  },
  payments: [],
  pagination: {
    page: 0,
    size: 12,
    totalElements: 0,
    totalPages: 0,
    hasMore: false,
  },
};

const statusTabs: { label: string; value: '' | PaymentStatus }[] = [
  { label: 'All', value: '' },
  { label: 'Successful', value: 'SUCCESS' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Failed', value: 'FAILED' },
  { label: 'Refunded', value: 'REFUNDED' },
];

type Notice = {
  message: string;
  tone: 'success' | 'error' | 'info';
};

export function PaymentHistoryPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const orderId = positiveInteger(searchParams.get('orderId'));
  const [payments, setPayments] = useState(initialPayments);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'' | PaymentStatus>('');
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(0);
    }, 300);
    return () => window.clearTimeout(timeout);
  }, [searchInput]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    getMyPayments(
      {
        search: search || undefined,
        status: status || undefined,
        page,
        size: 12,
      },
      controller.signal,
    )
      .then(setPayments)
      .catch((requestError: unknown) => {
        if (
          isAxiosError(requestError) &&
          requestError.code === 'ERR_CANCELED'
        ) {
          return;
        }
        setError(apiErrorMessage(requestError));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [page, reloadToken, search, status]);

  function paymentStatusChanged(
    message: string,
    tone: 'success' | 'error' | 'info',
  ) {
    setNotice({ message, tone });
    if (tone !== 'info') {
      setReloadToken((current) => current + 1);
    }
  }

  return (
    <div className="space-y-6 pb-10">
      <header className="flex flex-col gap-4 border-b border-[#dce2eb] pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[#007b95]">
            Secure transactions
          </p>
          <h1 className="mt-2 text-2xl font-black tracking-[-0.035em] text-[#071b33] sm:text-3xl">
            Payments
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#667386]">
            Review Razorpay payment activity, retry incomplete purchases, and
            open the connected Campus Hub order.
          </p>
        </div>
        <Link
          className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-[#cbd6e3] bg-white px-5 text-sm font-black text-[#30445d] hover:border-[#00a7c4]"
          to="/student/orders"
        >
          <ReceiptText aria-hidden="true" className="h-4 w-4" />
          View orders
        </Link>
      </header>

      {orderId && (
        <section className="flex flex-col gap-4 rounded-2xl border border-cyan-200 bg-cyan-50 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#007b95] shadow-sm">
              <ShieldCheck aria-hidden="true" className="h-5 w-5" />
            </span>
            <div>
              <h2 className="font-black text-[#071b33]">
                Complete your secure payment
              </h2>
              <p className="mt-1 text-sm leading-6 text-[#52677c]">
                Campus Hub order #{orderId} is still unpaid. A fresh Razorpay
                order will be created without changing the trusted order amount.
              </p>
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <button
              aria-label="Dismiss payment prompt"
              className="inline-flex h-10 items-center justify-center rounded-xl border border-[#bdd2dc] bg-white px-3 text-sm font-black text-[#4d6277]"
              onClick={() => {
                searchParams.delete('orderId');
                setSearchParams(searchParams, { replace: true });
              }}
              type="button"
            >
              Dismiss
            </button>
            <PaymentCheckoutButton
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#071b33] px-4 text-sm font-black text-white disabled:cursor-wait disabled:opacity-60"
              label="Continue payment"
              onStatus={paymentStatusChanged}
              orderId={orderId}
            />
          </div>
        </section>
      )}

      {notice && (
        <div
          className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-bold ${
            notice.tone === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : notice.tone === 'error'
                ? 'border-rose-200 bg-rose-50 text-rose-800'
                : 'border-blue-200 bg-blue-50 text-blue-800'
          }`}
          role={notice.tone === 'error' ? 'alert' : 'status'}
        >
          <CreditCard aria-hidden="true" className="h-4 w-4 shrink-0" />
          {notice.message}
        </div>
      )}

      {error && !loading && (
        <div
          className="flex flex-col gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 sm:flex-row sm:items-center sm:justify-between"
          role="alert"
        >
          <span className="font-semibold">{error}</span>
          <button
            className="inline-flex items-center gap-1.5 self-start font-black underline underline-offset-2 sm:self-auto"
            onClick={() => setReloadToken((current) => current + 1)}
            type="button"
          >
            <RotateCcw aria-hidden="true" className="h-4 w-4" />
            Try again
          </button>
        </div>
      )}

      <section
        aria-label="Payment summary"
        className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
      >
        <PaymentMetric
          icon={BadgeIndianRupee}
          label="Total spent"
          value={formatCurrency(payments.stats.totalSpent)}
        />
        <PaymentMetric
          icon={CheckCircle2}
          label="Successful"
          tone="green"
          value={payments.stats.successfulPayments.toString()}
        />
        <PaymentMetric
          icon={Clock3}
          label="Pending"
          tone="amber"
          value={payments.stats.pendingPayments.toString()}
        />
        <PaymentMetric
          icon={XCircle}
          label="Failed"
          tone="rose"
          value={payments.stats.failedPayments.toString()}
        />
      </section>

      <section className="overflow-hidden rounded-2xl border border-[#dce2eb] bg-white shadow-[0_4px_18px_rgba(3,22,53,0.045)]">
        <div className="flex gap-2 overflow-x-auto border-b border-[#e4e9f0] p-3">
          {statusTabs.map((tab) => (
            <button
              aria-pressed={status === tab.value}
              className={`shrink-0 rounded-full px-4 py-2 text-xs font-black transition ${
                status === tab.value
                  ? 'bg-[#071b33] text-white'
                  : 'bg-[#f1f4f8] text-[#526277] hover:bg-[#e4eaf1]'
              }`}
              key={tab.value || 'all'}
              onClick={() => {
                setStatus(tab.value);
                setPage(0);
              }}
              type="button"
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="p-4">
          <label className="relative block max-w-xl">
            <span className="sr-only">Search payments</span>
            <Search
              aria-hidden="true"
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#788496]"
            />
            <input
              className="h-10 w-full rounded-xl border border-[#cfd8e5] pl-10 pr-3 text-sm outline-none focus:border-[#00a7c4] focus:ring-2 focus:ring-cyan-100"
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search product, order ID, or payment ID..."
              type="search"
              value={searchInput}
            />
          </label>
        </div>
      </section>

      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-[#667386]">
          <span className="font-black text-[#25384f]">
            {payments.pagination.totalElements}
          </span>{' '}
          payment record
          {payments.pagination.totalElements === 1 ? '' : 's'}
        </p>
        {(search || status) && (
          <button
            className="text-sm font-black text-[#007b95]"
            onClick={() => {
              setSearchInput('');
              setSearch('');
              setStatus('');
              setPage(0);
            }}
            type="button"
          >
            Clear filters
          </button>
        )}
      </div>

      {loading ? (
        <PaymentLoading />
      ) : payments.payments.length === 0 ? (
        <PaymentEmpty filtered={Boolean(search || status)} />
      ) : (
        <div className="space-y-4">
          {payments.payments.map((payment) => (
            <PaymentCard
              key={payment.id}
              onStatus={paymentStatusChanged}
              payment={payment}
            />
          ))}
        </div>
      )}

      {!loading && payments.pagination.totalPages > 1 && (
        <nav
          aria-label="Payment pages"
          className="flex items-center justify-center gap-3"
        >
          <button
            aria-label="Previous page"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#cfd8e5] bg-white disabled:opacity-40"
            disabled={page === 0}
            onClick={() => setPage((current) => Math.max(0, current - 1))}
            type="button"
          >
            <ChevronLeft aria-hidden="true" className="h-4 w-4" />
          </button>
          <span className="text-sm font-bold text-[#506176]">
            Page {payments.pagination.page + 1} of{' '}
            {payments.pagination.totalPages}
          </span>
          <button
            aria-label="Next page"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#cfd8e5] bg-white disabled:opacity-40"
            disabled={!payments.pagination.hasMore}
            onClick={() => setPage((current) => current + 1)}
            type="button"
          >
            <ChevronRight aria-hidden="true" className="h-4 w-4" />
          </button>
        </nav>
      )}

      <div className="flex items-start gap-3 rounded-2xl border border-[#d9e2ec] bg-[#f7f9fc] p-4 text-sm leading-6 text-[#56677c]">
        <ShieldCheck
          aria-hidden="true"
          className="mt-0.5 h-5 w-5 shrink-0 text-[#007b95]"
        />
        <p>
          Campus Hub never stores your card, UPI PIN, or bank credentials.
          Payments are marked successful only after the backend verifies the
          Razorpay signature. Payments and refund requests are subject to our{' '}
          <Link className="font-black text-[#007b95]" to="/refund-policy">
            Refund Policy
          </Link>
          . Never share passwords, OTPs, card details, or a UPI PIN. Read our{' '}
          <Link className="font-black text-[#007b95]" to="/safety-guidelines">
            Safety Guidelines
          </Link>
          .
        </p>
      </div>
    </div>
  );
}

function PaymentCard({
  payment,
  onStatus,
}: {
  payment: PaymentSummary;
  onStatus: (message: string, tone: 'success' | 'error' | 'info') => void;
}) {
  return (
    <article className="overflow-hidden rounded-2xl border border-[#dce2eb] bg-white shadow-[0_4px_18px_rgba(3,22,53,0.045)]">
      <div className="flex flex-col gap-5 p-5 lg:flex-row lg:items-center">
        <ProductThumb
          imageUrl={resolveApiAssetUrl(payment.coverImageUrl)}
          title={payment.productTitle}
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <PaymentStatusPill status={payment.paymentStatus} />
            <span className="rounded-full bg-[#eef2f7] px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.08em] text-[#5d6b7e]">
              {payment.role === 'BUYER' ? 'Purchase' : 'Sale'}
            </span>
            {payment.refundStatus !== 'NOT_REQUIRED' && (
              <span className="rounded-full bg-violet-50 px-2.5 py-1 text-[11px] font-black text-violet-700">
                Refund {humanize(payment.refundStatus)}
              </span>
            )}
          </div>
          <Link
            className="mt-3 block truncate text-lg font-black text-[#071b33] hover:text-[#007b95]"
            to={`/listing/${payment.listingId}`}
          >
            {payment.productTitle}
          </Link>
          <p className="mt-1 text-xs font-bold uppercase tracking-[0.08em] text-[#748195]">
            {payment.orderNumber} · {payment.paymentMethod}
          </p>
          <p className="mt-3 text-sm text-[#5e6d80]">
            {payment.paymentStatus === 'SUCCESS' && payment.paymentDate
              ? `Paid ${formatDate(payment.paymentDate)}`
              : `Created ${formatDate(payment.createdAt)}`}
          </p>
          {payment.razorpayPaymentId && (
            <p className="mt-1 break-all text-xs text-[#7c8898]">
              Payment ID: {payment.razorpayPaymentId}
            </p>
          )}
          {payment.failureReason && (
            <p className="mt-3 rounded-lg border border-rose-100 bg-rose-50 px-3 py-2 text-xs leading-5 text-rose-800">
              {payment.failureReason}
            </p>
          )}
        </div>
        <div className="shrink-0 border-t border-[#e7ebf1] pt-4 lg:w-56 lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0 lg:text-right">
          <p className="text-xs font-bold uppercase tracking-[0.1em] text-[#788496]">
            Amount
          </p>
          <p className="mt-1 text-2xl font-black text-[#071b33]">
            {formatCurrency(payment.amount)}
          </p>
          <p className="mt-1 text-xs font-semibold text-[#748195]">
            Order {humanize(payment.orderStatus)}
          </p>
          <div className="mt-4 flex flex-wrap gap-2 lg:justify-end">
            <Link
              className="inline-flex h-9 items-center justify-center rounded-xl border border-[#cbd6e3] px-3 text-xs font-black text-[#344960] hover:border-[#00a7c4]"
              to={`/student/orders/${payment.orderId}`}
            >
              View order
            </Link>
            {payment.canRetry && (
              <PaymentCheckoutButton
                label={
                  payment.paymentStatus === 'FAILED'
                    ? 'Retry payment'
                    : 'Pay now'
                }
                onStatus={onStatus}
                orderId={payment.orderId}
              />
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

function PaymentMetric({
  icon: Icon,
  label,
  value,
  tone = 'cyan',
}: {
  icon: typeof CreditCard;
  label: string;
  value: string;
  tone?: 'cyan' | 'green' | 'amber' | 'rose';
}) {
  const toneClasses = {
    cyan: 'bg-cyan-50 text-cyan-700',
    green: 'bg-emerald-50 text-emerald-700',
    amber: 'bg-amber-50 text-amber-700',
    rose: 'bg-rose-50 text-rose-700',
  }[tone];
  return (
    <article className="rounded-2xl border border-[#dce2eb] bg-white p-5 shadow-sm">
      <span
        className={`flex h-10 w-10 items-center justify-center rounded-xl ${toneClasses}`}
      >
        <Icon aria-hidden="true" className="h-5 w-5" />
      </span>
      <p className="mt-4 text-sm font-bold text-[#718095]">{label}</p>
      <p className="mt-1 text-2xl font-black text-[#071b33]">{value}</p>
    </article>
  );
}

function PaymentStatusPill({ status }: { status: PaymentStatus }) {
  const tone = {
    SUCCESS: 'bg-emerald-50 text-emerald-700',
    PENDING: 'bg-amber-50 text-amber-700',
    FAILED: 'bg-rose-50 text-rose-700',
    REFUNDED: 'bg-violet-50 text-violet-700',
  }[status];
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.08em] ${tone}`}
    >
      {humanize(status)}
    </span>
  );
}

function PaymentLoading() {
  return (
    <div className="space-y-4" role="status">
      <span className="sr-only">Loading payment history</span>
      {[1, 2, 3].map((item) => (
        <div
          className="h-40 animate-pulse rounded-2xl border border-[#e2e7ee] bg-white"
          key={item}
        />
      ))}
    </div>
  );
}

function PaymentEmpty({ filtered }: { filtered: boolean }) {
  return (
    <section className="rounded-2xl border border-[#dce2eb] bg-white px-6 py-14 text-center shadow-sm">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e8f7fa] text-[#007b95]">
        <CreditCard aria-hidden="true" className="h-7 w-7" />
      </span>
      <h2 className="mt-4 text-xl font-black text-[#071b33]">
        {filtered ? 'No matching payments' : 'No payments yet'}
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#69778a]">
        {filtered
          ? 'Try a different search or payment status.'
          : 'Your secure Campus Hub payment records will appear here after you start a purchase.'}
      </p>
      {!filtered && (
        <Link
          className="mt-5 inline-flex h-10 items-center rounded-xl bg-[#071b33] px-4 text-sm font-black text-white"
          to="/student/marketplace"
        >
          Browse marketplace
        </Link>
      )}
    </section>
  );
}

function positiveInteger(value: string | null) {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function apiErrorMessage(error: unknown) {
  if (isAxiosError<{ message?: string }>(error)) {
    return (
      error.response?.data?.message ??
      'Payment history could not be loaded. Please try again.'
    );
  }
  return 'Payment history could not be loaded. Please try again.';
}
