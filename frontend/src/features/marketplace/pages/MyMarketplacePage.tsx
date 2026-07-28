import { isAxiosError } from 'axios';
import {
  BarChart3,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eye,
  Heart,
  ListChecks,
  PackageCheck,
  PackageOpen,
  Plus,
  RotateCcw,
  Search,
  SlidersHorizontal,
} from 'lucide-react';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { getCampusUser } from '../../student/lib/session';
import {
  deleteMarketplaceListing,
  getMyMarketplace,
  type MyListingStatus,
  type MyListingSummary,
  type MyMarketplace,
  type MyMarketplaceQuery,
  updateMarketplaceListingStatus,
} from '../api/marketplaceApi';
import {
  ConfirmListingActionModal,
  type ListingAction,
} from '../components/my-marketplace/ConfirmListingActionModal';
import { MyListingCard } from '../components/my-marketplace/MyListingCard';

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

const conditions = [
  ['NEW', 'New'],
  ['LIKE_NEW', 'Like New'],
  ['GOOD', 'Good'],
  ['FAIR', 'Fair'],
  ['USED', 'Used'],
];

const tabs: Array<{
  label: string;
  status?: MyListingStatus;
  countKey?:
    'totalListings' | 'activeListings' | 'soldListings' | 'inactiveListings';
}> = [
  { label: 'All', countKey: 'totalListings' },
  { label: 'Active', status: 'ACTIVE', countKey: 'activeListings' },
  { label: 'Sold', status: 'SOLD', countKey: 'soldListings' },
  { label: 'Inactive', status: 'INACTIVE', countKey: 'inactiveListings' },
  { label: 'Under review', status: 'UNDER_REVIEW' },
  { label: 'Blocked', status: 'BLOCKED' },
];

const initialMarketplace: MyMarketplace = {
  stats: {
    totalListings: 0,
    activeListings: 0,
    soldListings: 0,
    inactiveListings: 0,
    totalViews: 0,
    totalWishlistSaves: 0,
  },
  listings: [],
  pagination: {
    page: 0,
    size: 12,
    totalElements: 0,
    totalPages: 0,
    hasMore: false,
  },
};

type PendingAction = {
  listing: MyListingSummary;
  action: ListingAction;
};

export function MyMarketplacePage() {
  const user = getCampusUser();
  const location = useLocation();
  const navigate = useNavigate();
  const [marketplace, setMarketplace] =
    useState<MyMarketplace>(initialMarketplace);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<MyListingStatus | undefined>();
  const [category, setCategory] = useState('');
  const [condition, setCondition] = useState('');
  const [postedDate, setPostedDate] = useState('');
  const [sortBy, setSortBy] =
    useState<NonNullable<MyMarketplaceQuery['sortBy']>>('newest');
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(() =>
    (location.state as { listingUpdated?: boolean } | null)?.listingUpdated
      ? 'Listing updated successfully.'
      : null,
  );
  const [reloadToken, setReloadToken] = useState(0);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(
    null,
  );
  const [actionBusy, setActionBusy] = useState(false);

  useEffect(() => {
    if (
      (location.state as { listingUpdated?: boolean } | null)?.listingUpdated
    ) {
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.pathname, location.state, navigate]);

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

    getMyMarketplace(
      {
        search: search || undefined,
        status,
        category: category || undefined,
        condition: condition || undefined,
        postedDate: postedDate || undefined,
        sortBy,
        page,
        size: 12,
      },
      controller.signal,
    )
      .then(setMarketplace)
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
    condition,
    page,
    postedDate,
    reloadToken,
    search,
    sortBy,
    status,
  ]);

  const closeAction = useCallback(() => {
    if (!actionBusy) setPendingAction(null);
  }, [actionBusy]);

  async function confirmAction() {
    if (!pendingAction) return;
    setActionBusy(true);
    setError(null);
    setSuccess(null);
    try {
      if (pendingAction.action === 'delete') {
        await deleteMarketplaceListing(pendingAction.listing.id);
        setSuccess('Listing deleted successfully.');
      } else {
        await updateMarketplaceListingStatus(
          pendingAction.listing.id,
          pendingAction.action,
        );
        setSuccess(successMessage(pendingAction.action));
      }
      setPendingAction(null);
      setReloadToken((current) => current + 1);
    } catch (requestError) {
      setError(apiErrorMessage(requestError));
    } finally {
      setActionBusy(false);
    }
  }

  function clearFilters() {
    setSearchInput('');
    setSearch('');
    setStatus(undefined);
    setCategory('');
    setCondition('');
    setPostedDate('');
    setSortBy('newest');
    setPage(0);
  }

  const hasFilters = Boolean(
    search ||
    status ||
    category ||
    condition ||
    postedDate ||
    sortBy !== 'newest',
  );

  return (
    <div className="space-y-6 pb-10">
      <header className="flex flex-col gap-4 border-b border-[#dce2eb] pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[#007b95]">
            Seller control panel
          </p>
          <h1 className="mt-2 text-2xl font-black tracking-[-0.035em] text-[#071b33] sm:text-3xl">
            My Marketplace
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#667386]">
            Manage your posted items, availability, and listing performance in{' '}
            <span className="font-bold text-[#344960]">{user.collegeName}</span>
            .
          </p>
        </div>
        <Link
          className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#071b33] px-5 text-sm font-bold text-white shadow-sm transition hover:bg-[#0c2a4c]"
          to="/student/sell"
        >
          <Plus aria-hidden="true" className="h-4 w-4" />
          Sell new item
        </Link>
      </header>

      {success && (
        <div
          className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800"
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
            className="inline-flex items-center gap-1.5 self-start font-black text-rose-800 underline underline-offset-2 sm:self-auto"
            onClick={() => setReloadToken((current) => current + 1)}
            type="button"
          >
            <RotateCcw aria-hidden="true" className="h-4 w-4" />
            Try again
          </button>
        </div>
      )}

      <section
        aria-label="Marketplace performance"
        className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5"
      >
        <MetricCard
          icon={ListChecks}
          label="Total listings"
          value={marketplace.stats.totalListings}
        />
        <MetricCard
          icon={PackageCheck}
          label="Active listings"
          tone="green"
          value={marketplace.stats.activeListings}
        />
        <MetricCard
          icon={PackageOpen}
          label="Items sold"
          tone="blue"
          value={marketplace.stats.soldListings}
        />
        <MetricCard
          icon={Eye}
          label="Total views"
          tone="cyan"
          value={marketplace.stats.totalViews}
        />
        <MetricCard
          icon={Heart}
          label="Wishlist saves"
          tone="rose"
          value={marketplace.stats.totalWishlistSaves}
        />
      </section>

      <section className="overflow-hidden rounded-2xl border border-[#dce2eb] bg-white shadow-[0_4px_18px_rgba(3,22,53,0.045)]">
        <div className="flex gap-1 overflow-x-auto border-b border-[#dce2eb] px-4 pt-2">
          {tabs.map((tab) => {
            const selected = status === tab.status;
            const count = tab.countKey
              ? marketplace.stats[tab.countKey]
              : undefined;
            return (
              <button
                aria-pressed={selected}
                className={`flex shrink-0 items-center gap-2 border-b-2 px-3 py-3 text-sm font-bold transition ${
                  selected
                    ? 'border-[#00a7c4] text-[#071b33]'
                    : 'border-transparent text-[#687587] hover:text-[#071b33]'
                }`}
                key={tab.label}
                onClick={() => {
                  setStatus(tab.status);
                  setPage(0);
                }}
                type="button"
              >
                {tab.label}
                {count !== undefined && (
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] ${
                      selected
                        ? 'bg-cyan-100 text-[#007b95]'
                        : 'bg-[#eef2f7] text-[#657387]'
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="grid gap-3 p-4 lg:grid-cols-[minmax(260px,1fr)_repeat(4,minmax(140px,auto))]">
          <label className="relative">
            <span className="sr-only">Search your listings</span>
            <Search
              aria-hidden="true"
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#788496]"
            />
            <input
              className="h-10 w-full rounded-xl border border-[#cfd8e5] bg-white pl-10 pr-3 text-sm text-[#10233d] outline-none transition placeholder:text-[#8a96a5] focus:border-[#00a7c4] focus:ring-2 focus:ring-cyan-100"
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search your listings..."
              value={searchInput}
            />
          </label>
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
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </FilterSelect>
          <FilterSelect
            label="Condition"
            onChange={(value) => {
              setCondition(value);
              setPage(0);
            }}
            value={condition}
          >
            <option value="">Any condition</option>
            {conditions.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </FilterSelect>
          <FilterSelect
            label="Posted date"
            onChange={(value) => {
              setPostedDate(value);
              setPage(0);
            }}
            value={postedDate}
          >
            <option value="">Any time</option>
            <option value="today">Today</option>
            <option value="week">Past week</option>
            <option value="month">Past month</option>
          </FilterSelect>
          <FilterSelect
            label="Sort listings"
            onChange={(value) => {
              setSortBy(value as NonNullable<MyMarketplaceQuery['sortBy']>);
              setPage(0);
            }}
            value={sortBy}
          >
            <option value="newest">Newest first</option>
            <option value="priceAsc">Price: low to high</option>
            <option value="priceDesc">Price: high to low</option>
            <option value="mostViewed">Most viewed</option>
            <option value="mostWishlisted">Most wishlisted</option>
          </FilterSelect>
        </div>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <SlidersHorizontal
            aria-hidden="true"
            className="h-4 w-4 text-[#64748b]"
          />
          <p className="text-sm text-[#667386]">
            <span className="font-black text-[#25384f]">
              {marketplace.pagination.totalElements}
            </span>{' '}
            {marketplace.pagination.totalElements === 1
              ? 'listing'
              : 'listings'}
          </p>
        </div>
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
        <LoadingGrid />
      ) : marketplace.listings.length > 0 ? (
        <section
          aria-label="Your listings"
          className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3"
        >
          {marketplace.listings.map((listing) => (
            <MyListingCard
              key={listing.id}
              listing={listing}
              onAction={(selectedListing, action) => {
                setSuccess(null);
                setPendingAction({ listing: selectedListing, action });
              }}
            />
          ))}
        </section>
      ) : (
        <EmptyState
          filtered={hasFilters}
          status={status}
          onClear={clearFilters}
        />
      )}

      {!loading && marketplace.pagination.totalPages > 1 && (
        <nav
          aria-label="My marketplace pages"
          className="flex items-center justify-center gap-3"
        >
          <button
            aria-label="Previous page"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#cfd8e5] bg-white text-[#25384f] transition hover:border-[#00a7c4] disabled:cursor-not-allowed disabled:opacity-40"
            disabled={page === 0}
            onClick={() => setPage((current) => Math.max(0, current - 1))}
            type="button"
          >
            <ChevronLeft aria-hidden="true" className="h-4 w-4" />
          </button>
          <span className="text-sm font-bold text-[#506176]">
            Page {marketplace.pagination.page + 1} of{' '}
            {marketplace.pagination.totalPages}
          </span>
          <button
            aria-label="Next page"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#cfd8e5] bg-white text-[#25384f] transition hover:border-[#00a7c4] disabled:cursor-not-allowed disabled:opacity-40"
            disabled={!marketplace.pagination.hasMore}
            onClick={() => setPage((current) => current + 1)}
            type="button"
          >
            <ChevronRight aria-hidden="true" className="h-4 w-4" />
          </button>
        </nav>
      )}

      {pendingAction && (
        <ConfirmListingActionModal
          action={pendingAction.action}
          busy={actionBusy}
          listingTitle={pendingAction.listing.title}
          onCancel={closeAction}
          onConfirm={confirmAction}
        />
      )}
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  tone = 'navy',
}: {
  icon: typeof BarChart3;
  label: string;
  value: number;
  tone?: 'navy' | 'green' | 'blue' | 'cyan' | 'rose';
}) {
  const toneClasses = {
    navy: 'bg-[#e8eef7] text-[#17395f]',
    green: 'bg-emerald-100 text-emerald-700',
    blue: 'bg-blue-100 text-blue-700',
    cyan: 'bg-cyan-100 text-[#007b95]',
    rose: 'bg-rose-100 text-rose-700',
  };
  return (
    <article className="rounded-2xl border border-[#dce2eb] bg-white p-4 shadow-[0_4px_16px_rgba(3,22,53,0.04)]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold text-[#687587]">{label}</p>
          <p className="mt-1 text-2xl font-black text-[#071b33]">
            {value.toLocaleString('en-IN')}
          </p>
        </div>
        <span
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${toneClasses[tone]}`}
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
  children: ReactNode;
}) {
  return (
    <label>
      <span className="sr-only">{label}</span>
      <select
        aria-label={label}
        className="h-10 w-full rounded-xl border border-[#cfd8e5] bg-white px-3 text-sm font-semibold text-[#33475e] outline-none transition focus:border-[#00a7c4] focus:ring-2 focus:ring-cyan-100"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {children}
      </select>
    </label>
  );
}

function LoadingGrid() {
  return (
    <div
      aria-label="Loading your marketplace"
      className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3"
      role="status"
    >
      {[0, 1, 2].map((item) => (
        <div
          className="overflow-hidden rounded-2xl border border-[#dce2eb] bg-white"
          key={item}
        >
          <div className="aspect-[16/10] animate-pulse bg-[#e8edf4]" />
          <div className="space-y-3 p-4">
            <div className="h-4 w-2/3 animate-pulse rounded bg-[#e8edf4]" />
            <div className="h-6 w-4/5 animate-pulse rounded bg-[#e8edf4]" />
            <div className="h-14 animate-pulse rounded-xl bg-[#f0f3f7]" />
          </div>
        </div>
      ))}
      <span className="sr-only">Loading your marketplace...</span>
    </div>
  );
}

function EmptyState({
  filtered,
  status,
  onClear,
}: {
  filtered: boolean;
  status?: MyListingStatus;
  onClear: () => void;
}) {
  let title = 'You have not posted any items yet';
  let description =
    'Start selling safely within your verified college marketplace.';
  if (filtered) {
    title =
      status === 'ACTIVE'
        ? 'You have no active listings right now'
        : status === 'SOLD'
          ? 'No sold items yet'
          : 'No listings match these filters';
    description =
      status === 'ACTIVE'
        ? 'Post a new item or reactivate an inactive listing.'
        : 'Try another keyword or clear the selected filters.';
  }

  return (
    <section className="rounded-2xl border border-dashed border-[#bdc9d8] bg-white px-6 py-14 text-center">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e5f7fb] text-[#007b95]">
        {filtered ? (
          <Search aria-hidden="true" className="h-7 w-7" />
        ) : (
          <PackageOpen aria-hidden="true" className="h-7 w-7" />
        )}
      </span>
      <h2 className="mt-4 text-xl font-black text-[#10233d]">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#687587]">
        {description}
      </p>
      {filtered ? (
        <button
          className="mt-5 inline-flex h-10 items-center justify-center rounded-xl border border-[#cfd8e5] px-4 text-sm font-black text-[#25384f] hover:border-[#00a7c4] hover:text-[#007b95]"
          onClick={onClear}
          type="button"
        >
          Clear filters
        </button>
      ) : (
        <Link
          className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#071b33] px-4 text-sm font-black text-white hover:bg-[#0c2a4c]"
          to="/student/sell"
        >
          <Plus aria-hidden="true" className="h-4 w-4" />
          Sell your first item
        </Link>
      )}
    </section>
  );
}

function successMessage(action: Exclude<ListingAction, 'delete'>) {
  if (action === 'mark-sold') return 'Listing marked as sold.';
  if (action === 'mark-inactive') return 'Listing marked as inactive.';
  return 'Listing reactivated successfully.';
}

function apiErrorMessage(error: unknown) {
  if (isAxiosError(error)) {
    const message = (error.response?.data as { message?: string } | undefined)
      ?.message;
    if (message) return message;
  }
  return 'Unable to update your marketplace. Please try again.';
}
