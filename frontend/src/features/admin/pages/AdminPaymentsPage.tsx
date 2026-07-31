import { ArrowLeft, CreditCard, Search, ShieldCheck } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { getApiErrorMessage } from '../../auth/api/authApi';
import {
  getAdminPayment,
  getAdminPayments,
  type AdminPayment,
  type PageResponse,
} from '../api/adminApi';
import {
  AdminEmptyState,
  AdminErrorState,
  AdminLoadingState,
  AdminPageHeader,
  PaginationControls,
  StatusBadge,
} from '../components/AdminUi';
import { formatAdminCurrency, formatAdminDate } from '../lib/adminFormat';

export function AdminPaymentsPage() {
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [refundStatus, setRefundStatus] = useState('');
  const [page, setPage] = useState(0);
  const [data, setData] = useState<PageResponse<AdminPayment>>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  const load = useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true);
      setError('');
      try {
        setData(
          await getAdminPayments(
            {
              search: search || undefined,
              status: status || undefined,
              refundStatus: refundStatus || undefined,
              page,
              size: 20,
              sortBy: 'newest',
            },
            signal,
          ),
        );
      } catch (caught) {
        if (!signal?.aborted) setError(getApiErrorMessage(caught));
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [page, refundStatus, search, status],
  );

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load, reloadKey]);

  function submitSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSearch(searchInput.trim());
    setPage(0);
  }

  if (loading && !data) {
    return <AdminLoadingState label="Loading payments…" />;
  }
  if (error && !data) {
    return (
      <AdminErrorState
        message={error}
        onRetry={() => setReloadKey((value) => value + 1)}
        title="Unable to load payments"
      />
    );
  }
  if (!data) return null;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        actions={
          <span className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-800">
            <ShieldCheck className="h-4 w-4" />
            Gateway-verified status only
          </span>
        }
        description="Inspect Razorpay-linked payment status and failures without exposing secrets or allowing manual success overrides."
        eyebrow="Financial monitoring"
        title="Payments"
      />

      <section className="overflow-hidden rounded-2xl border border-[#d6d9e2] bg-white shadow-sm">
        <div className="grid gap-3 border-b border-[#e6e8ee] p-4 lg:grid-cols-[minmax(280px,1fr)_200px_210px]">
          <form className="relative" onSubmit={submitSearch}>
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#68707d]" />
            <input
              aria-label="Search payments"
              className="h-11 w-full rounded-xl border border-[#cbd3de] pl-10 pr-3 text-sm outline-none focus:border-cyan-700"
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Order, user, Razorpay order, or payment ID"
              value={searchInput}
            />
          </form>
          <Select
            label="Payment status"
            onChange={(value) => {
              setStatus(value);
              setPage(0);
            }}
            options={['PENDING', 'SUCCESS', 'FAILED', 'REFUNDED']}
            value={status}
          />
          <Select
            label="Refund status"
            onChange={(value) => {
              setRefundStatus(value);
              setPage(0);
            }}
            options={[
              'NOT_REQUIRED',
              'PENDING',
              'PROCESSING',
              'REFUNDED',
              'FAILED',
            ]}
            value={refundStatus}
          />
        </div>

        {error && (
          <div className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {error}
          </div>
        )}

        {loading ? (
          <AdminLoadingState label="Loading payments…" />
        ) : data.items.length ? (
          <div className="overflow-x-auto">
            <table className="min-w-[1180px] w-full text-left">
              <thead className="bg-[#f7f9fc] text-[11px] uppercase tracking-[0.08em] text-[#68707d]">
                <tr>
                  <th className="px-4 py-3">Payment</th>
                  <th className="px-4 py-3">Order</th>
                  <th className="px-4 py-3">Buyer / seller</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Refund</th>
                  <th className="px-4 py-3">Gateway IDs</th>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#edf0f4]">
                {data.items.map((payment) => (
                  <tr className="hover:bg-[#fbfcfe]" key={payment.id}>
                    <td className="px-4 py-4">
                      <p className="font-bold text-[#031635]">
                        Payment #{payment.id}
                      </p>
                      <p className="mt-1 text-xs text-[#68707d]">
                        {payment.paymentMethod ?? 'Method pending'}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <Link
                        className="text-sm font-bold text-[#334155] hover:text-cyan-800"
                        to={`/admin/orders/${payment.orderId}`}
                      >
                        {payment.orderNumber}
                      </Link>
                      <p className="mt-1 text-xs text-[#68707d]">
                        {payment.collegeName}
                      </p>
                    </td>
                    <td className="px-4 py-4 text-sm">
                      <Link
                        className="font-semibold text-[#334155] hover:text-cyan-800"
                        to={`/admin/users/${payment.buyerId}`}
                      >
                        {payment.buyerName}
                      </Link>
                      <p className="mt-1 text-xs text-[#68707d]">
                        Seller: {payment.sellerName}
                      </p>
                    </td>
                    <td className="px-4 py-4 font-black text-[#031635]">
                      {formatAdminCurrency(payment.amount, payment.currency)}
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge value={payment.paymentStatus} />
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge value={payment.refundStatus} />
                    </td>
                    <td className="max-w-64 px-4 py-4 text-xs text-[#526075]">
                      <p className="truncate">{payment.razorpayOrderId}</p>
                      <p className="mt-1 truncate text-[#7b8796]">
                        {payment.razorpayPaymentId ?? 'Payment ID pending'}
                      </p>
                    </td>
                    <td className="px-4 py-4 text-xs text-[#68707d]">
                      {formatAdminDate(payment.createdAt)}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <Link
                        className="rounded-lg border border-[#cbd3de] px-3 py-2 text-xs font-bold text-[#334155]"
                        to={`/admin/payments/${payment.id}`}
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <AdminEmptyState
            description="Try changing the payment or refund filters."
            title="No payments found"
          />
        )}
        <PaginationControls
          disabled={loading}
          onPageChange={setPage}
          pagination={data.pagination}
        />
      </section>
    </div>
  );
}

export function AdminPaymentDetailsPage() {
  const { paymentId } = useParams();
  const parsedId = Number(paymentId);
  const [data, setData] = useState<AdminPayment>();
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    if (Number.isInteger(parsedId) && parsedId > 0) {
      getAdminPayment(parsedId, controller.signal)
        .then(setData)
        .catch((caught) => {
          if (!controller.signal.aborted) {
            setError(getApiErrorMessage(caught));
          }
        });
    } else {
      setError('Invalid payment ID.');
    }
    return () => controller.abort();
  }, [parsedId, reloadKey]);

  if (!data && !error) {
    return <AdminLoadingState label="Loading payment details…" />;
  }
  if (!data) {
    return (
      <AdminErrorState
        message={error}
        onRetry={() => setReloadKey((value) => value + 1)}
        title="Unable to load payment"
      />
    );
  }

  return (
    <div className="space-y-6">
      <Link
        className="inline-flex items-center gap-2 text-sm font-bold text-cyan-800"
        to="/admin/payments"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to payments
      </Link>
      <section className="rounded-2xl border border-[#d6d9e2] bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800">
              <CreditCard className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.12em] text-cyan-700">
                Payment #{data.id}
              </p>
              <h1 className="font-display text-2xl font-black text-[#031635]">
                {data.orderNumber}
              </h1>
            </div>
          </div>
          <p className="text-3xl font-black text-[#031635]">
            {formatAdminCurrency(data.amount, data.currency)}
          </p>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Detail
            label="Payment status"
            value={<StatusBadge value={data.paymentStatus} />}
          />
          <Detail
            label="Refund status"
            value={<StatusBadge value={data.refundStatus} />}
          />
          <Detail label="Paid at" value={formatAdminDate(data.paidAt)} />
          <Detail label="Created" value={formatAdminDate(data.createdAt)} />
        </div>
      </section>
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-[#d6d9e2] bg-white p-5 shadow-sm">
          <h2 className="font-display text-lg font-black text-[#031635]">
            Gateway references
          </h2>
          <div className="mt-4 space-y-4">
            <TextDetail
              label="Razorpay order ID"
              value={data.razorpayOrderId}
            />
            <TextDetail
              label="Razorpay payment ID"
              value={data.razorpayPaymentId ?? 'Pending'}
            />
            <TextDetail
              label="Payment method"
              value={data.paymentMethod ?? 'Pending'}
            />
            <TextDetail
              label="Failure reason"
              value={data.failureReason ?? 'None'}
            />
          </div>
        </section>
        <section className="rounded-2xl border border-[#d6d9e2] bg-white p-5 shadow-sm">
          <h2 className="font-display text-lg font-black text-[#031635]">
            Parties
          </h2>
          <div className="mt-4 space-y-3">
            <LinkRow
              label="Order"
              to={`/admin/orders/${data.orderId}`}
              value={data.orderNumber}
            />
            <LinkRow
              label="Buyer"
              to={`/admin/users/${data.buyerId}`}
              value={data.buyerName}
            />
            <LinkRow
              label="Seller"
              to={`/admin/users/${data.sellerId}`}
              value={data.sellerName}
            />
            <TextDetail label="College" value={data.collegeName} />
          </div>
        </section>
      </div>
      <section className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
        <p className="font-bold text-blue-900">Protected payment state</p>
        <p className="mt-1 text-sm leading-6 text-blue-800">
          This page is read-only. Successful payment status can only come from
          verified Razorpay checkout or webhook verification.
        </p>
      </section>
    </div>
  );
}

function Select({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <select
      aria-label={label}
      className="h-11 rounded-xl border border-[#cbd3de] bg-white px-3 text-sm font-semibold outline-none focus:border-cyan-700"
      onChange={(event) => onChange(event.target.value)}
      value={value}
    >
      <option value="">All {label.toLowerCase()}</option>
      {options.map((option) => (
        <option key={option} value={option}>
          {option
            .toLowerCase()
            .replace(/_/g, ' ')
            .replace(/\b\w/g, (character) => character.toUpperCase())}
        </option>
      ))}
    </select>
  );
}

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-[#f7f9fc] p-4">
      <p className="text-xs font-bold text-[#7b8796]">{label}</p>
      <div className="mt-2 text-sm font-semibold text-[#273b53]">{value}</div>
    </div>
  );
}

function TextDetail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-bold text-[#7b8796]">{label}</p>
      <p className="mt-1 break-all text-sm font-semibold text-[#273b53]">
        {value}
      </p>
    </div>
  );
}

function LinkRow({
  label,
  value,
  to,
}: {
  label: string;
  value: string;
  to: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl bg-[#f7f9fc] px-4 py-3">
      <span className="text-xs font-bold text-[#7b8796]">{label}</span>
      <Link className="text-sm font-bold text-cyan-800" to={to}>
        {value}
      </Link>
    </div>
  );
}
