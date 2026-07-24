import { isAxiosError } from 'axios';
import {
  BadgeCheck,
  Building2,
  ChevronDown,
  Filter,
  RefreshCw,
  Search,
  SearchX,
  ShieldCheck,
  SlidersHorizontal,
  Store,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import { getCampusUser } from '../../student/lib/session';
import {
  addListingToWishlist,
  getMyCollegeMarketplace,
  removeListingFromWishlist,
  type CollegeMarketplace,
  type MarketplaceListing,
  type MarketplaceQuery,
} from '../api/marketplaceApi';
import { CollegeListingCard } from '../components/CollegeListingCard';

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

type FilterState = {
  category: string;
  minPrice: string;
  maxPrice: string;
  condition: string;
  pickupLocation: string;
  negotiable: string;
  postedDate: string;
  minSellerTrust: string;
};

const emptyFilters: FilterState = {
  category: '',
  minPrice: '',
  maxPrice: '',
  condition: '',
  pickupLocation: '',
  negotiable: '',
  postedDate: '',
  minSellerTrust: '',
};

export function MarketplacePage() {
  const cachedUser = getCampusUser();
  const [searchParams] = useSearchParams();
  const searchFromUrl = searchParams.get('search') ?? '';
  const [searchInput, setSearchInput] = useState(searchFromUrl);
  const [search, setSearch] = useState(searchFromUrl);
  const [filters, setFilters] = useState<FilterState>(emptyFilters);
  const [sortBy, setSortBy] =
    useState<NonNullable<MarketplaceQuery['sortBy']>>('newest');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [marketplace, setMarketplace] = useState<CollegeMarketplace | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [wishlistError, setWishlistError] = useState<string | null>(null);
  const [wishlistBusyIds, setWishlistBusyIds] = useState<Set<number>>(
    () => new Set(),
  );
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    setSearchInput(searchFromUrl);
    setSearch(searchFromUrl);
  }, [searchFromUrl]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setSearch(searchInput.trim());
    }, 350);
    return () => window.clearTimeout(timeout);
  }, [searchInput]);

  const query = useMemo<MarketplaceQuery>(
    () => ({
      search: search || undefined,
      category: filters.category || undefined,
      minPrice: numericFilter(filters.minPrice),
      maxPrice: numericFilter(filters.maxPrice),
      condition: filters.condition || undefined,
      pickupLocation: filters.pickupLocation || undefined,
      negotiable:
        filters.negotiable === '' ? undefined : filters.negotiable === 'true',
      postedDate: filters.postedDate || undefined,
      minSellerTrust: numericFilter(filters.minSellerTrust),
      sortBy,
      page: 0,
      size: 12,
    }),
    [filters, search, sortBy],
  );

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    setWishlistError(null);

    void getMyCollegeMarketplace(query, controller.signal)
      .then(setMarketplace)
      .catch((requestError: unknown) => {
        if (!controller.signal.aborted) {
          setMarketplace(null);
          setError(apiErrorMessage(requestError));
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [query, reloadKey]);

  const activeFilterCount = Object.values(filters).filter(Boolean).length;
  const collegeName = marketplace?.college.name ?? cachedUser.collegeName;

  function updateFilter<Key extends keyof FilterState>(
    key: Key,
    value: FilterState[Key],
  ) {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  function clearFilters() {
    setFilters(emptyFilters);
  }

  async function loadMore() {
    if (!marketplace?.pagination.hasMore || loadingMore) return;
    setLoadingMore(true);
    setError(null);
    try {
      const nextPage = await getMyCollegeMarketplace({
        ...query,
        page: marketplace.pagination.page + 1,
      });
      setMarketplace((current) =>
        current
          ? {
              ...nextPage,
              listings: [...current.listings, ...nextPage.listings],
            }
          : nextPage,
      );
    } catch (requestError) {
      setError(apiErrorMessage(requestError));
    } finally {
      setLoadingMore(false);
    }
  }

  async function toggleWishlist(listing: MarketplaceListing) {
    if (wishlistBusyIds.has(listing.id) || listing.ownListing) return;
    setWishlistError(null);
    setWishlistBusyIds((current) => new Set(current).add(listing.id));
    updateListing(listing.id, { wishlisted: !listing.wishlisted });
    try {
      if (listing.wishlisted) {
        await removeListingFromWishlist(listing.id);
      } else {
        await addListingToWishlist(listing.id);
      }
    } catch (requestError) {
      updateListing(listing.id, { wishlisted: listing.wishlisted });
      setWishlistError(apiErrorMessage(requestError));
    } finally {
      setWishlistBusyIds((current) => {
        const next = new Set(current);
        next.delete(listing.id);
        return next;
      });
    }
  }

  function updateListing(
    listingId: number,
    updates: Partial<MarketplaceListing>,
  ) {
    setMarketplace((current) =>
      current
        ? {
            ...current,
            listings: current.listings.map((listing) =>
              listing.id === listingId ? { ...listing, ...updates } : listing,
            ),
          }
        : current,
    );
  }

  return (
    <div className="space-y-5 pb-8">
      <section className="overflow-hidden rounded-2xl border border-[#dbe3ee] bg-white shadow-[0_4px_18px_rgba(3,22,53,0.06)]">
        <div className="relative overflow-hidden bg-[#031635] px-5 py-6 text-white sm:px-7 sm:py-7">
          <div className="absolute -right-12 -top-20 h-52 w-52 rounded-full bg-cyan-400/10" />
          <div className="absolute -bottom-24 right-24 h-44 w-44 rounded-full border-[28px] border-white/5" />
          <div className="relative flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div>
              <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-cyan-200">
                <ShieldCheck aria-hidden="true" className="h-4 w-4" />
                Verified college marketplace
              </p>
              <h1 className="mt-2 font-display text-2xl font-black tracking-[-0.035em] sm:text-3xl">
                My College Marketplace
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                Buy and sell securely within {collegeName}. Every listing shown
                here belongs to your verified college community.
              </p>
            </div>
            <div className="inline-flex w-fit items-center gap-3 rounded-xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-300 text-[#031635]">
                <Building2 aria-hidden="true" className="h-5 w-5" />
              </span>
              <span>
                <span className="block text-[10px] font-bold uppercase tracking-[0.14em] text-cyan-100">
                  Browsing
                </span>
                <span className="mt-0.5 block max-w-[270px] truncate text-sm font-bold">
                  {collegeName}
                </span>
              </span>
              <BadgeCheck
                aria-label="Verified college"
                className="h-5 w-5 shrink-0 text-cyan-300"
              />
            </div>
          </div>
        </div>

        <div className="border-t border-slate-200 bg-white p-4 sm:p-5">
          <div className="flex flex-col gap-3 lg:flex-row">
            <label className="relative min-w-0 flex-1">
              <span className="sr-only">Search marketplace</span>
              <Search
                aria-hidden="true"
                className="absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#617084]"
              />
              <input
                className="h-12 w-full rounded-xl border border-[#cbd3de] bg-[#f8faff] pl-11 pr-4 text-sm text-[#10233d] outline-none placeholder:text-[#778395] focus:border-[#007b95] focus:bg-white focus:ring-2 focus:ring-cyan-100"
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Search items, sellers, categories, or pickup locations..."
                type="search"
                value={searchInput}
              />
            </label>
            <div className="flex gap-3">
              <button
                className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl border border-[#cbd3de] px-4 text-sm font-bold text-[#263a52] hover:border-[#007b95] lg:hidden"
                onClick={() => setFiltersOpen(true)}
                type="button"
              >
                <SlidersHorizontal aria-hidden="true" className="h-4 w-4" />
                Filters
                {activeFilterCount > 0 && (
                  <span className="rounded-full bg-[#031635] px-2 py-0.5 text-[10px] text-white">
                    {activeFilterCount}
                  </span>
                )}
              </button>
              <label className="relative flex-1 lg:w-52">
                <span className="sr-only">Sort listings</span>
                <select
                  className="h-12 w-full appearance-none rounded-xl border border-[#cbd3de] bg-white pl-4 pr-10 text-sm font-bold text-[#263a52] outline-none focus:border-[#007b95]"
                  onChange={(event) =>
                    setSortBy(
                      event.target.value as NonNullable<
                        MarketplaceQuery['sortBy']
                      >,
                    )
                  }
                  value={sortBy}
                >
                  <option value="newest">Newest first</option>
                  <option value="priceAsc">Price: low to high</option>
                  <option value="priceDesc">Price: high to low</option>
                  <option value="trusted">Most trusted sellers</option>
                </select>
                <ChevronDown
                  aria-hidden="true"
                  className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#617084]"
                />
              </label>
            </div>
          </div>

          <nav
            aria-label="Marketplace categories"
            className="-mx-1 mt-4 flex gap-2 overflow-x-auto px-1 pb-1"
          >
            <CategoryChip
              active={!filters.category}
              label="All items"
              onClick={() => updateFilter('category', '')}
            />
            {categories.map((category) => (
              <CategoryChip
                active={filters.category === category}
                key={category}
                label={category}
                onClick={() => updateFilter('category', category)}
              />
            ))}
          </nav>
        </div>
      </section>

      {wishlistError && (
        <div
          className="flex items-center justify-between gap-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800"
          role="alert"
        >
          <span>{wishlistError}</span>
          <button
            aria-label="Dismiss wishlist message"
            className="rounded-lg p-1 hover:bg-rose-100"
            onClick={() => setWishlistError(null)}
            type="button"
          >
            <X aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="grid items-start gap-5 lg:grid-cols-[248px_minmax(0,1fr)]">
        <aside className="sticky top-[92px] hidden rounded-xl border border-[#dfe3eb] bg-white p-5 shadow-[0_2px_10px_rgba(3,22,53,0.04)] lg:block">
          <FilterPanel
            filters={filters}
            onClear={clearFilters}
            onUpdate={updateFilter}
            pickupLocations={marketplace?.pickupLocations ?? []}
          />
        </aside>

        <main className="min-w-0">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-black tracking-[-0.02em] text-[#071b33]">
                Available in your college
              </h2>
              <p className="mt-0.5 text-sm text-[#667386]">
                {loading && !marketplace
                  ? 'Finding active listings...'
                  : `${marketplace?.pagination.totalElements ?? 0} active ${
                      marketplace?.pagination.totalElements === 1
                        ? 'listing'
                        : 'listings'
                    }`}
              </p>
            </div>
            {activeFilterCount > 0 && (
              <button
                className="inline-flex items-center gap-2 text-sm font-bold text-[#007b95] hover:text-[#005d72]"
                onClick={clearFilters}
                type="button"
              >
                <X aria-hidden="true" className="h-4 w-4" />
                Clear {activeFilterCount} filters
              </button>
            )}
          </div>

          {error && marketplace && (
            <div
              className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
              role="alert"
            >
              <span>{error}</span>
              <button
                className="font-bold underline underline-offset-2"
                onClick={() => setReloadKey((current) => current + 1)}
                type="button"
              >
                Try again
              </button>
            </div>
          )}

          {loading && !marketplace ? (
            <ListingSkeletons />
          ) : error && !marketplace ? (
            <LoadFailure
              message={error}
              onRetry={() => setReloadKey((current) => current + 1)}
            />
          ) : marketplace && marketplace.listings.length > 0 ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
                {marketplace.listings.map((listing) => (
                  <CollegeListingCard
                    key={listing.id}
                    listing={listing}
                    onWishlistChange={toggleWishlist}
                    wishlistBusy={wishlistBusyIds.has(listing.id)}
                  />
                ))}
              </div>
              {marketplace.pagination.hasMore && (
                <div className="mt-7 text-center">
                  <button
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#aeb9c8] bg-white px-6 text-sm font-bold text-[#10233d] shadow-sm hover:border-[#007b95] hover:text-[#007b95] disabled:cursor-wait disabled:opacity-60"
                    disabled={loadingMore}
                    onClick={loadMore}
                    type="button"
                  >
                    {loadingMore && (
                      <RefreshCw
                        aria-hidden="true"
                        className="h-4 w-4 animate-spin"
                      />
                    )}
                    {loadingMore ? 'Loading listings...' : 'Load more'}
                  </button>
                </div>
              )}
            </>
          ) : marketplace ? (
            <MarketplaceEmptyState
              activeFilterCount={activeFilterCount}
              category={filters.category}
              collegeName={marketplace.college.name}
              onClear={clearFilters}
              search={search}
            />
          ) : null}
        </main>
      </div>

      {filtersOpen && (
        <div className="fixed inset-0 z-[70] lg:hidden">
          <button
            aria-label="Close filters"
            className="absolute inset-0 bg-[#031635]/55"
            onClick={() => setFiltersOpen(false)}
            type="button"
          />
          <aside className="absolute inset-y-0 right-0 w-full max-w-sm overflow-y-auto bg-white p-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#e3e7ed] pb-4">
              <h2 className="flex items-center gap-2 text-lg font-black text-[#071b33]">
                <Filter aria-hidden="true" className="h-5 w-5" />
                Marketplace filters
              </h2>
              <button
                aria-label="Close filters"
                className="rounded-lg p-2 text-[#5e6a7b] hover:bg-[#eff4ff]"
                onClick={() => setFiltersOpen(false)}
                type="button"
              >
                <X aria-hidden="true" className="h-5 w-5" />
              </button>
            </div>
            <div className="py-5">
              <FilterPanel
                filters={filters}
                onClear={clearFilters}
                onUpdate={updateFilter}
                pickupLocations={marketplace?.pickupLocations ?? []}
              />
            </div>
            <button
              className="h-11 w-full rounded-xl bg-[#031635] text-sm font-bold text-white hover:bg-[#153557]"
              onClick={() => setFiltersOpen(false)}
              type="button"
            >
              Show results
            </button>
          </aside>
        </div>
      )}
    </div>
  );
}

function FilterPanel({
  filters,
  pickupLocations,
  onUpdate,
  onClear,
}: {
  filters: FilterState;
  pickupLocations: string[];
  onUpdate: <Key extends keyof FilterState>(
    key: Key,
    value: FilterState[Key],
  ) => void;
  onClear: () => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-black text-[#071b33]">
          <SlidersHorizontal aria-hidden="true" className="h-4 w-4" />
          Refine results
        </h2>
        <button
          className="text-xs font-bold text-[#007b95] hover:text-[#005d72]"
          onClick={onClear}
          type="button"
        >
          Reset
        </button>
      </div>

      <div className="mt-5 space-y-5">
        <FilterSelect
          label="Category"
          onChange={(value) => onUpdate('category', value)}
          options={categories}
          placeholder="All categories"
          value={filters.category}
        />
        <FilterSelect
          label="Condition"
          onChange={(value) => onUpdate('condition', value)}
          options={[
            ['NEW', 'New'],
            ['LIKE_NEW', 'Like New'],
            ['GOOD', 'Good'],
            ['FAIR', 'Fair'],
            ['USED', 'Used'],
          ]}
          placeholder="Any condition"
          value={filters.condition}
        />

        <fieldset>
          <legend className="filter-label">Price range</legend>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <label>
              <span className="sr-only">Minimum price</span>
              <input
                className="filter-control"
                min="0"
                onChange={(event) => onUpdate('minPrice', event.target.value)}
                placeholder="Min ₹"
                type="number"
                value={filters.minPrice}
              />
            </label>
            <label>
              <span className="sr-only">Maximum price</span>
              <input
                className="filter-control"
                min="0"
                onChange={(event) => onUpdate('maxPrice', event.target.value)}
                placeholder="Max ₹"
                type="number"
                value={filters.maxPrice}
              />
            </label>
          </div>
        </fieldset>

        <FilterSelect
          label="Pickup location"
          onChange={(value) => onUpdate('pickupLocation', value)}
          options={pickupLocations}
          placeholder="Anywhere on campus"
          value={filters.pickupLocation}
        />
        <FilterSelect
          label="Price flexibility"
          onChange={(value) => onUpdate('negotiable', value)}
          options={[
            ['true', 'Negotiable only'],
            ['false', 'Fixed price only'],
          ]}
          placeholder="Any pricing"
          value={filters.negotiable}
        />
        <FilterSelect
          label="Posted"
          onChange={(value) => onUpdate('postedDate', value)}
          options={[
            ['today', 'Today'],
            ['week', 'This week'],
            ['month', 'This month'],
          ]}
          placeholder="Any time"
          value={filters.postedDate}
        />
        <FilterSelect
          label="Seller trust"
          onChange={(value) => onUpdate('minSellerTrust', value)}
          options={[
            ['70', 'Trusted · 70+'],
            ['90', 'Highly trusted · 90+'],
          ]}
          placeholder="Any verified seller"
          value={filters.minSellerTrust}
        />
      </div>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  options,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  options: (string | [string, string])[];
  placeholder: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="filter-label">{label}</span>
      <span className="relative mt-2 block">
        <select
          className="filter-control appearance-none pr-9"
          onChange={(event) => onChange(event.target.value)}
          value={value}
        >
          <option value="">{placeholder}</option>
          {options.map((option) => {
            const [optionValue, optionLabel] =
              typeof option === 'string' ? [option, option] : option;
            return (
              <option key={optionValue} value={optionValue}>
                {optionLabel}
              </option>
            );
          })}
        </select>
        <ChevronDown
          aria-hidden="true"
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#657286]"
        />
      </span>
    </label>
  );
}

function CategoryChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      aria-pressed={active}
      className={`shrink-0 rounded-full border px-3.5 py-2 text-xs font-bold ${
        active
          ? 'border-[#031635] bg-[#031635] text-white'
          : 'border-[#d3d9e2] bg-white text-[#455469] hover:border-[#007b95] hover:text-[#007b95]'
      }`}
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  );
}

function ListingSkeletons() {
  return (
    <div
      aria-label="Loading marketplace listings"
      className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3"
      role="status"
    >
      {[1, 2, 3, 4, 5, 6].map((item) => (
        <div
          className="overflow-hidden rounded-xl border border-[#e0e4eb] bg-white"
          key={item}
        >
          <div className="aspect-[4/3] animate-pulse bg-[#e9eef6]" />
          <div className="space-y-3 p-4">
            <div className="h-3 w-24 animate-pulse rounded bg-[#e9eef6]" />
            <div className="h-5 w-4/5 animate-pulse rounded bg-[#e9eef6]" />
            <div className="h-6 w-28 animate-pulse rounded bg-[#e9eef6]" />
            <div className="h-10 animate-pulse rounded bg-[#f0f3f7]" />
          </div>
        </div>
      ))}
    </div>
  );
}

function LoadFailure({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="rounded-2xl border border-rose-200 bg-white px-6 py-16 text-center shadow-sm">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose-50 text-rose-600">
        <RefreshCw aria-hidden="true" className="h-6 w-6" />
      </span>
      <h2 className="mt-4 text-xl font-black text-[#071b33]">
        Marketplace could not load
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#667386]">
        {message}
      </p>
      <button
        className="mt-5 inline-flex h-11 items-center gap-2 rounded-xl bg-[#031635] px-5 text-sm font-bold text-white hover:bg-[#153557]"
        onClick={onRetry}
        type="button"
      >
        <RefreshCw aria-hidden="true" className="h-4 w-4" />
        Try again
      </button>
    </div>
  );
}

function MarketplaceEmptyState({
  search,
  category,
  collegeName,
  activeFilterCount,
  onClear,
}: {
  search: string;
  category: string;
  collegeName: string;
  activeFilterCount: number;
  onClear: () => void;
}) {
  const isFiltered = Boolean(search || activeFilterCount);
  const title = search
    ? `No results for “${search}”`
    : category
      ? `No ${category.toLowerCase()} listings yet`
      : 'No active listings in your college yet';
  const description = isFiltered
    ? 'Try another keyword or remove some filters to widen your search.'
    : `Be the first student to list an item in ${collegeName}.`;

  return (
    <div className="rounded-2xl border border-dashed border-[#c8d0dc] bg-white px-6 py-16 text-center">
      <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#eff4ff] text-[#007b95]">
        {isFiltered ? (
          <SearchX aria-hidden="true" className="h-7 w-7" />
        ) : (
          <Store aria-hidden="true" className="h-7 w-7" />
        )}
      </span>
      <h2 className="mt-5 text-xl font-black text-[#071b33]">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#667386]">
        {description}
      </p>
      {isFiltered ? (
        <button
          className="mt-5 rounded-xl bg-[#031635] px-5 py-3 text-sm font-bold text-white hover:bg-[#153557]"
          onClick={onClear}
          type="button"
        >
          Clear all filters
        </button>
      ) : (
        <Link
          className="mt-5 inline-flex rounded-xl bg-[#031635] px-5 py-3 text-sm font-bold text-white hover:bg-[#153557]"
          to="/student/sell"
        >
          List the first item
        </Link>
      )}
    </div>
  );
}

function numericFilter(value: string) {
  if (!value.trim()) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function apiErrorMessage(error: unknown) {
  if (isAxiosError<{ message?: string }>(error)) {
    return (
      error.response?.data?.message ??
      'The marketplace service is unavailable. Please try again.'
    );
  }
  return 'The marketplace service is unavailable. Please try again.';
}
