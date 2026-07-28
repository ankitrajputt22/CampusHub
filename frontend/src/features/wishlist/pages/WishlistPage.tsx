import { isAxiosError } from 'axios';
import {
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Filter,
  Heart,
  HeartOff,
  PackageCheck,
  RotateCcw,
  Search,
  SlidersHorizontal,
} from 'lucide-react';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';

import { useStudentDashboard } from '../../student/dashboard/context/studentDashboardContext';
import { getCampusUser } from '../../student/lib/session';
import {
  getWishlist,
  removeWishlistItem,
  type WishlistItem,
  type WishlistPageData,
  type WishlistQuery,
} from '../api/wishlistApi';
import { RemoveWishlistModal } from '../components/RemoveWishlistModal';
import { WishlistCard } from '../components/WishlistCard';

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

const initialWishlist: WishlistPageData = {
  stats: {
    totalItems: 0,
    availableItems: 0,
    unavailableItems: 0,
  },
  items: [],
  pagination: {
    page: 0,
    size: 12,
    totalElements: 0,
    totalPages: 0,
    hasMore: false,
  },
};

export function WishlistPage() {
  const user = getCampusUser();
  const { refresh: refreshDashboard } = useStudentDashboard();
  const [wishlist, setWishlist] = useState<WishlistPageData>(initialWishlist);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [condition, setCondition] = useState('');
  const [status, setStatus] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [minSellerTrust, setMinSellerTrust] = useState('');
  const [savedDate, setSavedDate] = useState('');
  const [sortBy, setSortBy] =
    useState<NonNullable<WishlistQuery['sortBy']>>('recent');
  const [moreFiltersOpen, setMoreFiltersOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const [removeTarget, setRemoveTarget] = useState<WishlistItem | null>(null);
  const [removeBusy, setRemoveBusy] = useState(false);

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

    getWishlist(
      {
        search: search || undefined,
        category: category || undefined,
        condition: condition || undefined,
        status: (status || undefined) as WishlistQuery['status'],
        minPrice: numberOrUndefined(minPrice),
        maxPrice: numberOrUndefined(maxPrice),
        minSellerTrust: numberOrUndefined(minSellerTrust),
        savedDate: (savedDate || undefined) as WishlistQuery['savedDate'],
        sortBy,
        page,
        size: 12,
      },
      controller.signal,
    )
      .then(setWishlist)
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
    maxPrice,
    minPrice,
    minSellerTrust,
    page,
    reloadToken,
    savedDate,
    search,
    sortBy,
    status,
  ]);

  const closeRemoveModal = useCallback(() => {
    if (!removeBusy) setRemoveTarget(null);
  }, [removeBusy]);

  async function confirmRemove() {
    if (!removeTarget) return;
    setRemoveBusy(true);
    setError(null);
    setSuccess(null);
    try {
      await removeWishlistItem(removeTarget.listing.id);
      setWishlist((current) => {
        const wasAvailable = removeTarget.listing.available;
        return {
          ...current,
          stats: {
            totalItems: Math.max(0, current.stats.totalItems - 1),
            availableItems: Math.max(
              0,
              current.stats.availableItems - (wasAvailable ? 1 : 0),
            ),
            unavailableItems: Math.max(
              0,
              current.stats.unavailableItems - (wasAvailable ? 0 : 1),
            ),
          },
          items: current.items.filter(
            (item) => item.wishlistId !== removeTarget.wishlistId,
          ),
          pagination: {
            ...current.pagination,
            totalElements: Math.max(0, current.pagination.totalElements - 1),
          },
        };
      });
      setRemoveTarget(null);
      setSuccess('Item removed from wishlist.');
      void refreshDashboard();
    } catch (requestError) {
      setError(apiErrorMessage(requestError, true));
    } finally {
      setRemoveBusy(false);
    }
  }

  function clearFilters() {
    setSearchInput('');
    setSearch('');
    setCategory('');
    setCondition('');
    setStatus('');
    setMinPrice('');
    setMaxPrice('');
    setMinSellerTrust('');
    setSavedDate('');
    setSortBy('recent');
    setPage(0);
  }

  const hasFilters = Boolean(
    search ||
    category ||
    condition ||
    status ||
    minPrice ||
    maxPrice ||
    minSellerTrust ||
    savedDate ||
    sortBy !== 'recent',
  );
  const availableItems = wishlist.items.filter(
    (item) => item.listing.available,
  );
  const unavailableItems = wishlist.items.filter(
    (item) => !item.listing.available,
  );

  return (
    <div className="space-y-6 pb-10">
      <header className="flex flex-col gap-4 border-b border-[#dce2eb] pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[#007b95]">
            Saved campus finds
          </p>
          <h1 className="mt-2 text-2xl font-black tracking-[-0.035em] text-[#071b33] sm:text-3xl">
            My Wishlist
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#667386]">
            Saved items from{' '}
            <span className="font-bold text-[#344960]">
              {user.collegeName} Campus Hub
            </span>
            .
          </p>
        </div>
        <Link
          className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#071b33] px-5 text-sm font-bold text-white shadow-sm transition hover:bg-[#0c2a4c]"
          to="/student/marketplace"
        >
          <Search aria-hidden="true" className="h-4 w-4" />
          Browse marketplace
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
        aria-label="Wishlist summary"
        className="grid gap-3 sm:grid-cols-3"
      >
        <MetricCard
          icon={Heart}
          label="Total saved items"
          tone="rose"
          value={wishlist.stats.totalItems}
        />
        <MetricCard
          icon={PackageCheck}
          label="Available items"
          tone="green"
          value={wishlist.stats.availableItems}
        />
        <MetricCard
          icon={HeartOff}
          label="Unavailable items"
          value={wishlist.stats.unavailableItems}
        />
      </section>

      {wishlist.stats.totalItems > 0 &&
        wishlist.stats.availableItems === 0 &&
        !loading && (
          <section className="flex flex-col gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-black text-amber-950">
                All saved items are currently unavailable
              </h2>
              <p className="mt-1 text-sm text-amber-800">
                Browse the marketplace to find similar products from verified
                students.
              </p>
            </div>
            <Link
              className="inline-flex h-10 shrink-0 items-center justify-center rounded-xl bg-amber-900 px-4 text-sm font-bold text-white"
              to="/student/marketplace"
            >
              Browse marketplace
            </Link>
          </section>
        )}

      <section className="overflow-hidden rounded-2xl border border-[#dce2eb] bg-white shadow-[0_4px_18px_rgba(3,22,53,0.045)]">
        <div className="grid gap-3 p-4 lg:grid-cols-[minmax(260px,1fr)_repeat(4,minmax(145px,auto))]">
          <label className="relative">
            <span className="sr-only">Search your wishlist</span>
            <Search
              aria-hidden="true"
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#788496]"
            />
            <input
              className="h-10 w-full rounded-xl border border-[#cfd8e5] bg-white pl-10 pr-3 text-sm text-[#10233d] outline-none transition placeholder:text-[#8a96a5] focus:border-[#00a7c4] focus:ring-2 focus:ring-cyan-100"
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search your wishlist..."
              type="search"
              value={searchInput}
            />
          </label>
          <FilterSelect
            label="Availability"
            onChange={(value) => {
              setStatus(value);
              setPage(0);
            }}
            value={status}
          >
            <option value="">All availability</option>
            <option value="AVAILABLE">Available</option>
            <option value="UNAVAILABLE">Unavailable</option>
            <option value="SOLD">Sold</option>
            <option value="INACTIVE">Inactive</option>
            <option value="UNDER_REVIEW">Under review</option>
            <option value="BLOCKED">Blocked</option>
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
            <option value="NEW">New</option>
            <option value="LIKE_NEW">Like New</option>
            <option value="GOOD">Good</option>
            <option value="FAIR">Fair</option>
            <option value="USED">Used</option>
          </FilterSelect>
          <FilterSelect
            label="Sort saved items"
            onChange={(value) => {
              setSortBy(value as NonNullable<WishlistQuery['sortBy']>);
              setPage(0);
            }}
            value={sortBy}
          >
            <option value="recent">Recently saved</option>
            <option value="oldest">Oldest saved</option>
            <option value="priceAsc">Price: low to high</option>
            <option value="priceDesc">Price: high to low</option>
            <option value="trusted">Most trusted sellers</option>
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
            Price, trust score, and saved date
            <ChevronDown
              aria-hidden="true"
              className={`h-4 w-4 transition ${moreFiltersOpen ? 'rotate-180' : ''}`}
            />
          </button>
          {moreFiltersOpen && (
            <div className="mt-3 grid gap-3 border-t border-[#edf0f4] pt-4 sm:grid-cols-2 lg:grid-cols-4">
              <NumberFilter
                label="Minimum price"
                max={100000}
                onChange={(value) => {
                  setMinPrice(value);
                  setPage(0);
                }}
                placeholder="₹ Min"
                value={minPrice}
              />
              <NumberFilter
                label="Maximum price"
                max={100000}
                onChange={(value) => {
                  setMaxPrice(value);
                  setPage(0);
                }}
                placeholder="₹ Max"
                value={maxPrice}
              />
              <NumberFilter
                label="Minimum seller trust score"
                max={100}
                onChange={(value) => {
                  setMinSellerTrust(value);
                  setPage(0);
                }}
                placeholder="Minimum trust score"
                value={minSellerTrust}
              />
              <FilterSelect
                label="Saved date"
                onChange={(value) => {
                  setSavedDate(value);
                  setPage(0);
                }}
                value={savedDate}
              >
                <option value="">Saved any time</option>
                <option value="today">Saved today</option>
                <option value="week">Past week</option>
                <option value="month">Past month</option>
              </FilterSelect>
            </div>
          )}
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
              {wishlist.pagination.totalElements}
            </span>{' '}
            {wishlist.pagination.totalElements === 1
              ? 'saved item'
              : 'saved items'}
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
      ) : wishlist.items.length === 0 ? (
        <EmptyState filtered={hasFilters} onClear={clearFilters} />
      ) : (
        <div className="space-y-8">
          {availableItems.length > 0 && (
            <WishlistSection
              description="Review the latest details before starting a purchase."
              items={availableItems}
              onRemove={setRemoveTarget}
              title="Available now"
            />
          )}
          {unavailableItems.length > 0 && (
            <WishlistSection
              description="These remain saved so you can see what changed and remove them when ready."
              items={unavailableItems}
              onRemove={setRemoveTarget}
              title="Unavailable saved items"
            />
          )}
        </div>
      )}

      {!loading && wishlist.pagination.totalPages > 1 && (
        <nav
          aria-label="Wishlist pages"
          className="flex items-center justify-center gap-3"
        >
          <button
            aria-label="Previous page"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#cfd8e5] bg-white text-[#25384f] hover:border-[#00a7c4] disabled:cursor-not-allowed disabled:opacity-40"
            disabled={page === 0}
            onClick={() => setPage((current) => Math.max(0, current - 1))}
            type="button"
          >
            <ChevronLeft aria-hidden="true" className="h-4 w-4" />
          </button>
          <span className="text-sm font-bold text-[#506176]">
            Page {wishlist.pagination.page + 1} of{' '}
            {wishlist.pagination.totalPages}
          </span>
          <button
            aria-label="Next page"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#cfd8e5] bg-white text-[#25384f] hover:border-[#00a7c4] disabled:cursor-not-allowed disabled:opacity-40"
            disabled={!wishlist.pagination.hasMore}
            onClick={() => setPage((current) => current + 1)}
            type="button"
          >
            <ChevronRight aria-hidden="true" className="h-4 w-4" />
          </button>
        </nav>
      )}

      {removeTarget && (
        <RemoveWishlistModal
          busy={removeBusy}
          itemTitle={removeTarget.listing.title}
          onCancel={closeRemoveModal}
          onConfirm={confirmRemove}
        />
      )}
    </div>
  );
}

function WishlistSection({
  title,
  description,
  items,
  onRemove,
}: {
  title: string;
  description: string;
  items: WishlistItem[];
  onRemove: (item: WishlistItem) => void;
}) {
  return (
    <section>
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-[#10233d]">{title}</h2>
          <p className="mt-1 text-sm text-[#687587]">{description}</p>
        </div>
        <span className="rounded-full bg-[#eaf0f8] px-3 py-1 text-xs font-black text-[#40546d]">
          {items.length}
        </span>
      </div>
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <WishlistCard item={item} key={item.wishlistId} onRemove={onRemove} />
        ))}
      </div>
    </section>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  tone = 'slate',
}: {
  icon: typeof Heart;
  label: string;
  value: number;
  tone?: 'rose' | 'green' | 'slate';
}) {
  const tones = {
    rose: 'bg-rose-100 text-rose-700',
    green: 'bg-emerald-100 text-emerald-700',
    slate: 'bg-slate-200 text-slate-700',
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
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${tones[tone]}`}
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

function NumberFilter({
  label,
  placeholder,
  value,
  max,
  onChange,
}: {
  label: string;
  placeholder: string;
  value: string;
  max: number;
  onChange: (value: string) => void;
}) {
  return (
    <label>
      <span className="sr-only">{label}</span>
      <input
        aria-label={label}
        className="h-10 w-full rounded-xl border border-[#cfd8e5] bg-white px-3 text-sm text-[#33475e] outline-none transition placeholder:text-[#8a96a5] focus:border-[#00a7c4] focus:ring-2 focus:ring-cyan-100"
        max={max}
        min="0"
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        type="number"
        value={value}
      />
    </label>
  );
}

function LoadingGrid() {
  return (
    <div
      aria-label="Loading your wishlist"
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
            <div className="h-16 animate-pulse rounded-xl bg-[#f0f3f7]" />
          </div>
        </div>
      ))}
      <span className="sr-only">Loading your wishlist...</span>
    </div>
  );
}

function EmptyState({
  filtered,
  onClear,
}: {
  filtered: boolean;
  onClear: () => void;
}) {
  return (
    <section className="rounded-2xl border border-dashed border-[#bdc9d8] bg-white px-6 py-14 text-center">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#ffe8ec] text-rose-600">
        {filtered ? (
          <Search aria-hidden="true" className="h-7 w-7" />
        ) : (
          <Heart aria-hidden="true" className="h-7 w-7" />
        )}
      </span>
      <h2 className="mt-4 text-xl font-black text-[#10233d]">
        {filtered
          ? 'No wishlist items match your search'
          : 'Your wishlist is empty'}
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#687587]">
        {filtered
          ? 'Try another keyword or clear the selected filters.'
          : 'Save items you like in your college marketplace and come back to them later.'}
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
          to="/student/marketplace"
        >
          <Search aria-hidden="true" className="h-4 w-4" />
          Browse marketplace
        </Link>
      )}
    </section>
  );
}

function numberOrUndefined(value: string) {
  if (!value) return undefined;
  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
}

function apiErrorMessage(error: unknown, removing = false) {
  if (isAxiosError(error)) {
    const message = (error.response?.data as { message?: string } | undefined)
      ?.message;
    if (message) return message;
  }
  return removing
    ? 'Unable to remove item. Please try again.'
    : 'Unable to load wishlist. Please try again.';
}
