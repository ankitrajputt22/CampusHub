import { isAxiosError } from 'axios';
import {
  BadgeIndianRupee,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Filter,
  MapPin,
  PackageCheck,
  RotateCcw,
  Search,
  ShoppingBag,
  Store,
  UserRound,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { resolveApiAssetUrl } from '../../../lib/apiClient';
import { PaymentCheckoutButton } from '../../payments/components/PaymentCheckoutButton';
import { useStudentDashboard } from '../../student/dashboard/context/studentDashboardContext';
import {
  cancelOrder,
  confirmOrderPickup,
  getOrders,
  markOrderReady,
  type OrderAction,
  type OrderRole,
  type OrdersPageData,
  type OrdersQuery,
  type OrderStatus,
  type OrderSummary,
  type PaymentStatus,
} from '../api/ordersApi';
import {
  ConfirmActionModal,
  OrderStatusBadge,
  PaymentStatusBadge,
  ProductThumb,
} from '../components/OrderUi';
import { formatCurrency, formatDate, humanize } from '../lib/orderFormat';

const initialOrders: OrdersPageData = {
  stats: {
    totalOrders: 0,
    pendingPayment: 0,
    paidOrders: 0,
    readyForPickup: 0,
    completedOrders: 0,
    cancelledOrders: 0,
  },
  orders: [],
  pagination: {
    page: 0,
    size: 12,
    totalElements: 0,
    totalPages: 0,
    hasMore: false,
  },
};

const categories = [
  'Books',
  'Notes',
  'Electronics',
  'Bicycles',
  'Hostel Essentials',
  'Furniture',
  'Lab Equipment',
  'Stationery',
  'Clothing',
  'Others',
];

const statusOptions: { label: string; value: '' | OrderStatus }[] = [
  { label: 'All', value: '' },
  { label: 'Pending payment', value: 'PENDING_PAYMENT' },
  { label: 'Paid', value: 'PAID' },
  { label: 'Ready for pickup', value: 'READY_FOR_PICKUP' },
  { label: 'Completed', value: 'COMPLETED' },
  { label: 'Cancelled', value: 'CANCELLED' },
];

type PendingAction = {
  action: 'CANCEL_ORDER' | 'CONFIRM_PICKUP' | 'MARK_READY_FOR_PICKUP';
  order: OrderSummary;
};

export function OrdersPage() {
  const { refresh: refreshDashboard } = useStudentDashboard();
  const [role, setRole] = useState<OrderRole>('BUYER');
  const [orders, setOrders] = useState<OrdersPageData>(initialOrders);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'' | OrderStatus>('');
  const [paymentStatus, setPaymentStatus] = useState<'' | PaymentStatus>('');
  const [category, setCategory] = useState('');
  const [dateRange, setDateRange] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sortBy, setSortBy] =
    useState<NonNullable<OrdersQuery['sortBy']>>('recent');
  const [moreFiltersOpen, setMoreFiltersOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(
    null,
  );
  const [actionBusy, setActionBusy] = useState(false);

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
    getOrders(
      role,
      {
        search: search || undefined,
        status: status || undefined,
        paymentStatus: paymentStatus || undefined,
        category: category || undefined,
        dateRange: (dateRange || undefined) as OrdersQuery['dateRange'],
        minPrice: numberOrUndefined(minPrice),
        maxPrice: numberOrUndefined(maxPrice),
        sortBy,
        page,
        size: 12,
      },
      controller.signal,
    )
      .then(setOrders)
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
  }, [
    category,
    dateRange,
    maxPrice,
    minPrice,
    page,
    paymentStatus,
    reloadToken,
    role,
    search,
    sortBy,
    status,
  ]);

  function switchRole(nextRole: OrderRole) {
    setRole(nextRole);
    setPage(0);
    setStatus('');
    setSuccess(null);
  }

  function clearFilters() {
    setSearchInput('');
    setSearch('');
    setStatus('');
    setPaymentStatus('');
    setCategory('');
    setDateRange('');
    setMinPrice('');
    setMaxPrice('');
    setSortBy('recent');
    setPage(0);
  }

  async function confirmAction() {
    if (!pendingAction) return;
    setActionBusy(true);
    setError(null);
    setSuccess(null);
    try {
      const result =
        pendingAction.action === 'CANCEL_ORDER'
          ? await cancelOrder(pendingAction.order.id)
          : pendingAction.action === 'MARK_READY_FOR_PICKUP'
            ? await markOrderReady(pendingAction.order.id)
            : await confirmOrderPickup(pendingAction.order.id);
      setPendingAction(null);
      setSuccess(result.message);
      setReloadToken((current) => current + 1);
      void refreshDashboard();
    } catch (requestError) {
      setError(apiErrorMessage(requestError, true));
    } finally {
      setActionBusy(false);
    }
  }

  const hasFilters = Boolean(
    search ||
    status ||
    paymentStatus ||
    category ||
    dateRange ||
    minPrice ||
    maxPrice ||
    sortBy !== 'recent',
  );

  return (
    <div className="space-y-6 pb-10">
      <header className="flex flex-col gap-4 border-b border-[#dce2eb] pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[#007b95]">
            Campus transactions
          </p>
          <h1 className="mt-2 text-2xl font-black tracking-[-0.035em] text-[#071b33] sm:text-3xl">
            Orders
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#667386]">
            Track payments, coordinate campus pickup, and complete every deal
            safely.
          </p>
        </div>
        <Link
          className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#071b33] px-5 text-sm font-black text-white shadow-sm hover:bg-[#0c2a4c]"
          to="/student/marketplace"
        >
          <ShoppingBag aria-hidden="true" className="h-4 w-4" />
          Browse marketplace
        </Link>
      </header>

      <div
        aria-label="Order role"
        className="inline-flex rounded-xl border border-[#d5dde8] bg-[#edf2f8] p-1"
        role="tablist"
      >
        <RoleTab
          active={role === 'BUYER'}
          icon={ShoppingBag}
          label="My Purchases"
          onClick={() => switchRole('BUYER')}
        />
        <RoleTab
          active={role === 'SELLER'}
          icon={Store}
          label="My Sales"
          onClick={() => switchRole('SELLER')}
        />
      </div>

      {success && (
        <div
          className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800"
          role="status"
        >
          <CheckCircle2 aria-hidden="true" className="h-4 w-4" />
          {success}
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
        aria-label="Order summary"
        className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5"
      >
        <MetricCard
          icon={ShoppingBag}
          label={role === 'BUYER' ? 'Total purchases' : 'Total sales'}
          value={orders.stats.totalOrders}
        />
        <MetricCard
          icon={Clock3}
          label="Pending payment"
          tone="amber"
          value={orders.stats.pendingPayment}
        />
        <MetricCard
          icon={BadgeIndianRupee}
          label="Paid"
          tone="blue"
          value={orders.stats.paidOrders}
        />
        <MetricCard
          icon={PackageCheck}
          label="Ready"
          tone="violet"
          value={orders.stats.readyForPickup}
        />
        <MetricCard
          icon={CheckCircle2}
          label="Completed"
          tone="green"
          value={orders.stats.completedOrders}
        />
      </section>

      <section className="overflow-hidden rounded-2xl border border-[#dce2eb] bg-white shadow-[0_4px_18px_rgba(3,22,53,0.045)]">
        <div className="flex gap-2 overflow-x-auto border-b border-[#e4e9f0] p-3">
          {statusOptions.map((option) => (
            <button
              className={`shrink-0 rounded-full px-4 py-2 text-xs font-black transition ${
                status === option.value
                  ? 'bg-[#071b33] text-white'
                  : 'bg-[#f1f4f8] text-[#526277] hover:bg-[#e4eaf1]'
              }`}
              key={option.value || 'all'}
              onClick={() => {
                setStatus(option.value);
                setPage(0);
              }}
              type="button"
            >
              {option.label}
            </button>
          ))}
        </div>
        <div className="grid gap-3 p-4 lg:grid-cols-[minmax(260px,1fr)_repeat(3,minmax(150px,auto))]">
          <label className="relative">
            <span className="sr-only">Search orders</span>
            <Search
              aria-hidden="true"
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#788496]"
            />
            <input
              className="h-10 w-full rounded-xl border border-[#cfd8e5] pl-10 pr-3 text-sm outline-none focus:border-[#00a7c4] focus:ring-2 focus:ring-cyan-100"
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search item, order ID, or student..."
              type="search"
              value={searchInput}
            />
          </label>
          <FilterSelect
            label="Payment status"
            onChange={(value) => {
              setPaymentStatus(value as '' | PaymentStatus);
              setPage(0);
            }}
            value={paymentStatus}
          >
            <option value="">All payment states</option>
            <option value="PENDING">Payment pending</option>
            <option value="SUCCESS">Payment successful</option>
            <option value="FAILED">Payment failed</option>
            <option value="REFUNDED">Refunded</option>
          </FilterSelect>
          <FilterSelect
            label="Category"
            onChange={(value) => {
              setCategory(value);
              setPage(0);
            }}
            value={category}
          >
            <option value="">All categories</option>
            {categories.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </FilterSelect>
          <FilterSelect
            label="Sort orders"
            onChange={(value) => {
              setSortBy(value as NonNullable<OrdersQuery['sortBy']>);
              setPage(0);
            }}
            value={sortBy}
          >
            <option value="recent">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="priceDesc">Amount: high to low</option>
            <option value="priceAsc">Amount: low to high</option>
          </FilterSelect>
        </div>
        <div className="border-t border-[#e7ebf1] px-4 py-3">
          <button
            aria-expanded={moreFiltersOpen}
            className="inline-flex items-center gap-2 text-sm font-black text-[#31506d] hover:text-[#007b95]"
            onClick={() => setMoreFiltersOpen((open) => !open)}
            type="button"
          >
            <Filter aria-hidden="true" className="h-4 w-4" />
            Date and amount filters
            <ChevronDown
              aria-hidden="true"
              className={`h-4 w-4 transition ${moreFiltersOpen ? 'rotate-180' : ''}`}
            />
          </button>
          {moreFiltersOpen && (
            <div className="mt-3 grid gap-3 border-t border-[#edf0f4] pt-4 sm:grid-cols-3">
              <FilterSelect
                label="Order date"
                onChange={(value) => {
                  setDateRange(value);
                  setPage(0);
                }}
                value={dateRange}
              >
                <option value="">Any time</option>
                <option value="today">Past 24 hours</option>
                <option value="week">Past 7 days</option>
                <option value="month">Past 30 days</option>
              </FilterSelect>
              <NumberInput
                label="Minimum amount"
                onChange={(value) => {
                  setMinPrice(value);
                  setPage(0);
                }}
                placeholder="₹ Min"
                value={minPrice}
              />
              <NumberInput
                label="Maximum amount"
                onChange={(value) => {
                  setMaxPrice(value);
                  setPage(0);
                }}
                placeholder="₹ Max"
                value={maxPrice}
              />
            </div>
          )}
        </div>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-[#667386]">
          <span className="font-black text-[#25384f]">
            {orders.pagination.totalElements}
          </span>{' '}
          {role === 'BUYER' ? 'purchase' : 'sale'}
          {orders.pagination.totalElements === 1 ? '' : 's'}
        </p>
        {hasFilters && (
          <button
            className="text-sm font-black text-[#007b95] hover:text-[#005f73]"
            onClick={clearFilters}
            type="button"
          >
            Clear filters
          </button>
        )}
      </div>

      {loading ? (
        <LoadingOrders />
      ) : orders.orders.length === 0 ? (
        <EmptyOrders filtered={hasFilters} role={role} onClear={clearFilters} />
      ) : (
        <div className="space-y-4">
          {orders.orders.map((order) => (
            <OrderCard
              key={order.id}
              onAction={(action) =>
                setPendingAction({
                  action: action as PendingAction['action'],
                  order,
                })
              }
              onPaymentStatus={(message, tone) => {
                setError(tone === 'error' ? message : null);
                setSuccess(tone === 'error' ? null : message);
                if (tone !== 'info') {
                  setReloadToken((current) => current + 1);
                }
              }}
              order={order}
            />
          ))}
        </div>
      )}

      {!loading && orders.pagination.totalPages > 1 && (
        <nav
          aria-label="Order pages"
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
            Page {orders.pagination.page + 1} of {orders.pagination.totalPages}
          </span>
          <button
            aria-label="Next page"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#cfd8e5] bg-white disabled:opacity-40"
            disabled={!orders.pagination.hasMore}
            onClick={() => setPage((current) => current + 1)}
            type="button"
          >
            <ChevronRight aria-hidden="true" className="h-4 w-4" />
          </button>
        </nav>
      )}

      {pendingAction && (
        <ConfirmActionModal
          busy={actionBusy}
          confirmLabel={actionCopy(pendingAction.action).confirm}
          danger={pendingAction.action === 'CANCEL_ORDER'}
          description={
            actionCopy(pendingAction.action, pendingAction.order.listing.title)
              .description
          }
          onCancel={() => {
            if (!actionBusy) setPendingAction(null);
          }}
          onConfirm={confirmAction}
          title={actionCopy(pendingAction.action).title}
        />
      )}
    </div>
  );
}

function OrderCard({
  order,
  onAction,
  onPaymentStatus,
}: {
  order: OrderSummary;
  onAction: (action: OrderAction) => void;
  onPaymentStatus: (
    message: string,
    tone: 'success' | 'error' | 'info',
  ) => void;
}) {
  const imageUrl = resolveApiAssetUrl(order.listing.coverImageUrl);
  return (
    <article className="overflow-hidden rounded-2xl border border-[#dce2eb] bg-white shadow-[0_4px_18px_rgba(3,22,53,0.045)]">
      <div className="flex flex-col gap-5 p-5 lg:flex-row lg:items-center">
        <ProductThumb imageUrl={imageUrl} title={order.listing.title} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <OrderStatusBadge status={order.status} />
            <PaymentStatusBadge status={order.paymentStatus} />
          </div>
          <Link
            className="mt-3 block truncate text-lg font-black text-[#071b33] hover:text-[#007b95]"
            to={`/listing/${order.listing.id}`}
          >
            {order.listing.title}
          </Link>
          <p className="mt-1 text-xs font-bold uppercase tracking-[0.08em] text-[#748195]">
            {order.orderNumber} · {humanize(order.listing.category)} ·{' '}
            {humanize(order.listing.condition)}
          </p>
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-[#5e6d80]">
            <span className="inline-flex items-center gap-1.5">
              <UserRound aria-hidden="true" className="h-4 w-4" />
              {order.role === 'BUYER' ? 'Seller' : 'Buyer'}:{' '}
              <span className="font-bold text-[#30445d]">
                {order.otherParty.fullName}
              </span>
              <span className="text-xs">
                ({order.otherParty.trustScore} trust)
              </span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MapPin aria-hidden="true" className="h-4 w-4" />
              {order.pickupLocation}
            </span>
          </div>
          <p className="mt-2 text-xs text-[#7b8797]">
            Ordered {formatDate(order.createdAt)}
          </p>
        </div>
        <div className="shrink-0 border-t border-[#e7ebf1] pt-4 lg:w-52 lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0 lg:text-right">
          <p className="text-xs font-bold uppercase tracking-[0.1em] text-[#788496]">
            Order total
          </p>
          <p className="mt-1 text-2xl font-black text-[#071b33]">
            {formatCurrency(order.amount)}
          </p>
          <div className="mt-4 flex flex-wrap gap-2 lg:justify-end">
            <Link
              className="inline-flex h-9 items-center justify-center rounded-xl border border-[#cbd6e3] px-3 text-xs font-black text-[#344960] hover:border-[#00a7c4]"
              to={`/student/orders/${order.id}`}
            >
              View details
            </Link>
            {order.availableActions.includes('PAY_NOW') && (
              <PaymentCheckoutButton
                className="inline-flex h-9 items-center justify-center rounded-xl bg-[#071b33] px-3 text-xs font-black text-white"
                onStatus={onPaymentStatus}
                orderId={order.id}
              />
            )}
            {order.availableActions.includes('CANCEL_ORDER') && (
              <ActionButton
                label="Cancel order"
                onClick={() => onAction('CANCEL_ORDER')}
                tone="danger"
              />
            )}
            {order.availableActions.includes('MARK_READY_FOR_PICKUP') && (
              <ActionButton
                label="Mark ready"
                onClick={() => onAction('MARK_READY_FOR_PICKUP')}
              />
            )}
            {order.availableActions.includes('CONFIRM_PICKUP') && (
              <ActionButton
                label="Confirm pickup"
                onClick={() => onAction('CONFIRM_PICKUP')}
              />
            )}
            {order.availableActions.includes('WRITE_REVIEW') && (
              <Link
                className="inline-flex h-9 items-center justify-center rounded-xl bg-[#071b33] px-3 text-xs font-black text-white"
                to={`/student/reviews?orderId=${order.id}`}
              >
                Write review
              </Link>
            )}
          </div>
        </div>
      </div>
      {order.availableActions.includes('CONFIRM_PICKUP') && (
        <div className="border-t border-amber-200 bg-amber-50 px-5 py-3 text-xs font-semibold text-amber-900">
          Confirm pickup only after you have inspected and received the item.
        </div>
      )}
    </article>
  );
}

function RoleTab({
  active,
  label,
  icon: Icon,
  onClick,
}: {
  active: boolean;
  label: string;
  icon: typeof ShoppingBag;
  onClick: () => void;
}) {
  return (
    <button
      aria-selected={active}
      className={`inline-flex h-10 items-center gap-2 rounded-lg px-4 text-sm font-black transition ${
        active
          ? 'bg-white text-[#071b33] shadow-sm'
          : 'text-[#607086] hover:text-[#071b33]'
      }`}
      onClick={onClick}
      role="tab"
      type="button"
    >
      <Icon aria-hidden="true" className="h-4 w-4" />
      {label}
    </button>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  tone = 'cyan',
}: {
  icon: typeof ShoppingBag;
  label: string;
  value: number;
  tone?: 'cyan' | 'amber' | 'blue' | 'violet' | 'green';
}) {
  const tones = {
    cyan: 'bg-cyan-50 text-cyan-700',
    amber: 'bg-amber-50 text-amber-700',
    blue: 'bg-blue-50 text-blue-700',
    violet: 'bg-violet-50 text-violet-700',
    green: 'bg-emerald-50 text-emerald-700',
  };
  return (
    <article className="rounded-2xl border border-[#dce2eb] bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold text-[#6e7c8f]">{label}</p>
          <p className="mt-1 text-2xl font-black text-[#071b33]">{value}</p>
        </div>
        <span
          className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${tones[tone]}`}
        >
          <Icon aria-hidden="true" className="h-5 w-5" />
        </span>
      </div>
    </article>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <label>
      <span className="sr-only">{label}</span>
      <select
        aria-label={label}
        className="h-10 w-full rounded-xl border border-[#cfd8e5] bg-white px-3 text-sm text-[#30445d] outline-none focus:border-[#00a7c4] focus:ring-2 focus:ring-cyan-100"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {children}
      </select>
    </label>
  );
}

function NumberInput({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
}) {
  return (
    <label>
      <span className="sr-only">{label}</span>
      <input
        aria-label={label}
        className="h-10 w-full rounded-xl border border-[#cfd8e5] px-3 text-sm outline-none focus:border-[#00a7c4] focus:ring-2 focus:ring-cyan-100"
        min="0"
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        type="number"
        value={value}
      />
    </label>
  );
}

function ActionButton({
  label,
  onClick,
  tone = 'primary',
}: {
  label: string;
  onClick: () => void;
  tone?: 'primary' | 'danger';
}) {
  return (
    <button
      className={`h-9 rounded-xl px-3 text-xs font-black ${
        tone === 'danger'
          ? 'border border-rose-200 bg-rose-50 text-rose-700'
          : 'bg-[#071b33] text-white'
      }`}
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  );
}

function LoadingOrders() {
  return (
    <div className="space-y-4" role="status">
      <span className="sr-only">Loading orders</span>
      {[1, 2, 3].map((item) => (
        <div
          className="h-44 animate-pulse rounded-2xl border border-[#e1e6ed] bg-white"
          key={item}
        />
      ))}
    </div>
  );
}

function EmptyOrders({
  role,
  filtered,
  onClear,
}: {
  role: OrderRole;
  filtered: boolean;
  onClear: () => void;
}) {
  return (
    <section className="rounded-2xl border border-dashed border-[#c9d3df] bg-white px-6 py-14 text-center">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e9f7fa] text-[#007b95]">
        {filtered ? (
          <Search aria-hidden="true" className="h-6 w-6" />
        ) : role === 'BUYER' ? (
          <ShoppingBag aria-hidden="true" className="h-6 w-6" />
        ) : (
          <Store aria-hidden="true" className="h-6 w-6" />
        )}
      </span>
      <h2 className="mt-4 text-lg font-black text-[#071b33]">
        {filtered
          ? 'No orders match these filters'
          : role === 'BUYER'
            ? 'No purchases yet'
            : 'No sales yet'}
      </h2>
      <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-[#687587]">
        {filtered
          ? 'Try changing the status, payment state, date, or search term.'
          : role === 'BUYER'
            ? 'Your orders will appear here after you start a purchase from a listing.'
            : 'Orders from students who buy your listings will appear here.'}
      </p>
      {filtered ? (
        <button
          className="mt-5 h-10 rounded-xl bg-[#071b33] px-4 text-sm font-black text-white"
          onClick={onClear}
          type="button"
        >
          Clear filters
        </button>
      ) : (
        <Link
          className="mt-5 inline-flex h-10 items-center rounded-xl bg-[#071b33] px-4 text-sm font-black text-white"
          to={role === 'BUYER' ? '/student/marketplace' : '/student/sell'}
        >
          {role === 'BUYER' ? 'Browse marketplace' : 'List an item'}
        </Link>
      )}
    </section>
  );
}

function actionCopy(action: PendingAction['action'], itemTitle = 'this item') {
  if (action === 'CANCEL_ORDER') {
    return {
      title: 'Cancel this order?',
      description: (
        <>
          The pending order for <strong>{itemTitle}</strong> will be cancelled.
          You can start a new order later if the listing remains available.
        </>
      ),
      confirm: 'Cancel order',
    };
  }
  if (action === 'MARK_READY_FOR_PICKUP') {
    return {
      title: 'Mark item ready?',
      description: (
        <>
          The buyer will be notified that <strong>{itemTitle}</strong> is ready
          at the agreed campus pickup location.
        </>
      ),
      confirm: 'Mark ready',
    };
  }
  return {
    title: 'Confirm item handover?',
    description: (
      <>
        Confirm only after inspecting and receiving <strong>{itemTitle}</strong>
        . This completes the order and marks the listing sold.
      </>
    ),
    confirm: 'Confirm pickup',
  };
}

function numberOrUndefined(value: string) {
  if (!value.trim()) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function apiErrorMessage(error: unknown, action = false) {
  if (isAxiosError<{ message?: string }>(error)) {
    return (
      error.response?.data?.message ??
      (action
        ? 'The order could not be updated. Please try again.'
        : 'Orders could not be loaded. Please try again.')
    );
  }
  return action
    ? 'The order could not be updated. Please try again.'
    : 'Orders could not be loaded. Please try again.';
}
