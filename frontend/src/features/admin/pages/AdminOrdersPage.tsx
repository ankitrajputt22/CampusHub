import { ArrowLeft, Search, ShoppingBag } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { getApiErrorMessage } from '../../auth/api/authApi';
import {
  getAdminOrder,
  getAdminOrders,
  type AdminOrder,
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

export function AdminOrdersPage() {
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [page, setPage] = useState(0);
  const [data, setData] = useState<PageResponse<AdminOrder>>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  const load = useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true);
      setError('');
      try {
        setData(
          await getAdminOrders(
            {
              search: search || undefined,
              status: status || undefined,
              paymentStatus: paymentStatus || undefined,
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
    [page, paymentStatus, search, status],
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
    return <AdminLoadingState label="Loading orders…" />;
  }
  if (error && !data) {
    return (
      <AdminErrorState
        message={error}
        onRetry={() => setReloadKey((value) => value + 1)}
        title="Unable to load orders"
      />
    );
  }
  if (!data) return null;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        description="Monitor buyer–seller order progress without overriding verified marketplace or payment lifecycle events."
        eyebrow="Commerce monitoring"
        title="Orders"
      />

      <section className="overflow-hidden rounded-2xl border border-[#d6d9e2] bg-white shadow-sm">
        <div className="grid gap-3 border-b border-[#e6e8ee] p-4 lg:grid-cols-[minmax(260px,1fr)_210px_200px]">
          <form className="relative" onSubmit={submitSearch}>
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#68707d]" />
            <input
              aria-label="Search orders"
              className="h-11 w-full rounded-xl border border-[#cbd3de] pl-10 pr-3 text-sm outline-none focus:border-cyan-700"
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Order number, buyer, seller, or listing"
              value={searchInput}
            />
          </form>
          <Select
            label="Order status"
            onChange={(value) => {
              setStatus(value);
              setPage(0);
            }}
            options={[
              'PENDING_PAYMENT',
              'PAID',
              'READY_FOR_PICKUP',
              'COMPLETED',
              'CANCELLED',
              'REFUNDED',
              'PAYMENT_FAILED',
              'EXPIRED',
            ]}
            value={status}
          />
          <Select
            label="Payment status"
            onChange={(value) => {
              setPaymentStatus(value);
              setPage(0);
            }}
            options={['PENDING', 'SUCCESS', 'FAILED', 'REFUNDED']}
            value={paymentStatus}
          />
        </div>

        {error && (
          <div className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {error}
          </div>
        )}

        {loading ? (
          <AdminLoadingState label="Loading orders…" />
        ) : data.items.length ? (
          <div className="overflow-x-auto">
            <table className="min-w-[1100px] w-full text-left">
              <thead className="bg-[#f7f9fc] text-[11px] uppercase tracking-[0.08em] text-[#68707d]">
                <tr>
                  <th className="px-4 py-3">Order</th>
                  <th className="px-4 py-3">Listing</th>
                  <th className="px-4 py-3">Buyer</th>
                  <th className="px-4 py-3">Seller</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Order status</th>
                  <th className="px-4 py-3">Payment</th>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#edf0f4]">
                {data.items.map((order) => (
                  <tr className="hover:bg-[#fbfcfe]" key={order.id}>
                    <td className="px-4 py-4">
                      <p className="font-bold text-[#031635]">
                        {order.orderNumber}
                      </p>
                      <p className="mt-1 text-xs text-[#68707d]">#{order.id}</p>
                    </td>
                    <td className="max-w-64 px-4 py-4">
                      <Link
                        className="block truncate text-sm font-bold text-[#334155] hover:text-cyan-800"
                        to={`/admin/listings/${order.listingId}`}
                      >
                        {order.listingTitle}
                      </Link>
                      <p className="mt-1 truncate text-xs text-[#68707d]">
                        {order.collegeName}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <Link
                        className="text-sm font-semibold text-[#334155] hover:text-cyan-800"
                        to={`/admin/users/${order.buyerId}`}
                      >
                        {order.buyerName}
                      </Link>
                    </td>
                    <td className="px-4 py-4">
                      <Link
                        className="text-sm font-semibold text-[#334155] hover:text-cyan-800"
                        to={`/admin/users/${order.sellerId}`}
                      >
                        {order.sellerName}
                      </Link>
                    </td>
                    <td className="px-4 py-4 font-black text-[#031635]">
                      {formatAdminCurrency(order.amount)}
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge value={order.orderStatus} />
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge value={order.paymentStatus} />
                    </td>
                    <td className="px-4 py-4 text-xs text-[#68707d]">
                      {formatAdminDate(order.createdAt)}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <Link
                        className="rounded-lg border border-[#cbd3de] px-3 py-2 text-xs font-bold text-[#334155]"
                        to={`/admin/orders/${order.id}`}
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
            description="Try changing the order or payment filters."
            title="No orders found"
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

export function AdminOrderDetailsPage() {
  const { orderId } = useParams();
  const parsedId = Number(orderId);
  const [data, setData] = useState<AdminOrder>();
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    if (Number.isInteger(parsedId) && parsedId > 0) {
      getAdminOrder(parsedId, controller.signal)
        .then(setData)
        .catch((caught) => {
          if (!controller.signal.aborted) {
            setError(getApiErrorMessage(caught));
          }
        });
    } else {
      setError('Invalid order ID.');
    }
    return () => controller.abort();
  }, [parsedId, reloadKey]);

  if (!data && !error) {
    return <AdminLoadingState label="Loading order details…" />;
  }
  if (!data) {
    return (
      <AdminErrorState
        message={error}
        onRetry={() => setReloadKey((value) => value + 1)}
        title="Unable to load order"
      />
    );
  }

  return (
    <div className="space-y-6">
      <Link
        className="inline-flex items-center gap-2 text-sm font-bold text-cyan-800"
        to="/admin/orders"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to orders
      </Link>
      <section className="rounded-2xl border border-[#d6d9e2] bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-800">
                <ShoppingBag className="h-5 w-5" />
              </span>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.12em] text-cyan-700">
                  Order #{data.id}
                </p>
                <h1 className="font-display text-2xl font-black text-[#031635]">
                  {data.orderNumber}
                </h1>
              </div>
            </div>
            <p className="mt-3 text-sm text-[#68707d]">
              Created {formatAdminDate(data.createdAt)}
            </p>
          </div>
          <p className="text-3xl font-black text-[#031635]">
            {formatAdminCurrency(data.amount)}
          </p>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Detail
            label="Order status"
            value={<StatusBadge value={data.orderStatus} />}
          />
          <Detail
            label="Payment status"
            value={<StatusBadge value={data.paymentStatus} />}
          />
          <Detail label="Paid at" value={formatAdminDate(data.paidAt)} />
          <Detail
            label="Completed at"
            value={formatAdminDate(data.completedAt)}
          />
        </div>
      </section>
      <section className="grid gap-4 lg:grid-cols-3">
        <InfoCard
          link={`/admin/listings/${data.listingId}`}
          label="Listing"
          primary={data.listingTitle}
          secondary={data.collegeName}
        />
        <InfoCard
          link={`/admin/users/${data.buyerId}`}
          label="Buyer"
          primary={data.buyerName}
          secondary="View buyer profile"
        />
        <InfoCard
          link={`/admin/users/${data.sellerId}`}
          label="Seller"
          primary={data.sellerName}
          secondary="View seller profile"
        />
      </section>
      <section className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
        <p className="font-bold text-blue-900">Monitoring-only workspace</p>
        <p className="mt-1 text-sm leading-6 text-blue-800">
          Admins cannot manually complete orders or mark payments successful.
          Those states remain controlled by the verified marketplace and payment
          flows.
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

function InfoCard({
  label,
  primary,
  secondary,
  link,
}: {
  label: string;
  primary: string;
  secondary: string;
  link: string;
}) {
  return (
    <Link
      className="rounded-2xl border border-[#d6d9e2] bg-white p-5 shadow-sm hover:border-cyan-600"
      to={link}
    >
      <p className="text-xs font-black uppercase tracking-[0.12em] text-cyan-700">
        {label}
      </p>
      <p className="mt-2 font-bold text-[#031635]">{primary}</p>
      <p className="mt-1 text-xs text-[#68707d]">{secondary}</p>
    </Link>
  );
}
