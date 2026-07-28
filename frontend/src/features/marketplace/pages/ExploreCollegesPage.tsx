import { isAxiosError } from 'axios';
import {
  Building2,
  Compass,
  GraduationCap,
  Info,
  LoaderCircle,
  PackageSearch,
  RefreshCw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { PageHeader } from '../../student/components/StudentUi';
import {
  getExploreColleges,
  getExploreMarketplace,
  type ExploreCollege,
  type ExploreColleges,
  type ExploreListing,
  type ExploreMarketplace,
  type ExploreMarketplaceQuery,
} from '../api/exploreApi';
import {
  reportMarketplaceListing,
  type ListingReportReason,
} from '../api/marketplaceApi';
import { ExploreCollegeCard } from '../components/explore-colleges/ExploreCollegeCard';
import { ExploreListingCard } from '../components/explore-colleges/ExploreListingCard';
import { ReportListingModal } from '../components/ReportListingModal';

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
  ['LIKE_NEW', 'Like new'],
  ['GOOD', 'Good'],
  ['FAIR', 'Fair'],
];

type ListingFilters = {
  category: string;
  minPrice: string;
  maxPrice: string;
  condition: string;
  pickupLocation: string;
  negotiable: string;
  postedDate: string;
  minSellerTrust: string;
  sortBy: 'newest' | 'priceAsc' | 'priceDesc';
};

const defaultFilters: ListingFilters = {
  category: '',
  minPrice: '',
  maxPrice: '',
  condition: '',
  pickupLocation: '',
  negotiable: '',
  postedDate: '',
  minSellerTrust: '',
  sortBy: 'newest',
};

export function ExploreCollegesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedCollegeId = Number(searchParams.get('collegeId')) || null;
  const [collegeSearch, setCollegeSearch] = useState('');
  const [debouncedCollegeSearch, setDebouncedCollegeSearch] = useState('');
  const initialListingSearch = searchParams.get('search') ?? '';
  const [listingSearch, setListingSearch] = useState(initialListingSearch);
  const [debouncedListingSearch, setDebouncedListingSearch] =
    useState(initialListingSearch);
  const [filters, setFilters] = useState<ListingFilters>(defaultFilters);
  const [collegeData, setCollegeData] = useState<ExploreColleges | null>(null);
  const [collegeLoading, setCollegeLoading] = useState(true);
  const [collegeError, setCollegeError] = useState<string | null>(null);
  const [collegeReloadKey, setCollegeReloadKey] = useState(0);
  const [marketplace, setMarketplace] = useState<ExploreMarketplace | null>(
    null,
  );
  const [marketplaceLoading, setMarketplaceLoading] = useState(false);
  const [marketplaceError, setMarketplaceError] = useState<string | null>(null);
  const [marketplaceReloadKey, setMarketplaceReloadKey] = useState(0);
  const [page, setPage] = useState(0);
  const [reportListing, setReportListing] = useState<ExploreListing | null>(
    null,
  );
  const [reportSuccess, setReportSuccess] = useState<string | null>(null);

  useEffect(() => {
    const timeout = window.setTimeout(
      () => setDebouncedCollegeSearch(collegeSearch.trim()),
      350,
    );
    return () => window.clearTimeout(timeout);
  }, [collegeSearch]);

  useEffect(() => {
    const timeout = window.setTimeout(
      () => setDebouncedListingSearch(listingSearch.trim()),
      350,
    );
    return () => window.clearTimeout(timeout);
  }, [listingSearch]);

  useEffect(() => {
    const controller = new AbortController();
    setCollegeLoading(true);
    setCollegeError(null);
    void getExploreColleges(debouncedCollegeSearch, controller.signal)
      .then(setCollegeData)
      .catch((error: unknown) => {
        if (!controller.signal.aborted) setCollegeError(apiErrorMessage(error));
      })
      .finally(() => {
        if (!controller.signal.aborted) setCollegeLoading(false);
      });
    return () => controller.abort();
  }, [debouncedCollegeSearch, collegeReloadKey]);

  const marketplaceQuery = useMemo<ExploreMarketplaceQuery | null>(() => {
    if (!selectedCollegeId) return null;
    return {
      collegeId: selectedCollegeId,
      search: debouncedListingSearch || undefined,
      category: filters.category || undefined,
      minPrice: numberOrUndefined(filters.minPrice),
      maxPrice: numberOrUndefined(filters.maxPrice),
      condition: filters.condition || undefined,
      pickupLocation: filters.pickupLocation || undefined,
      negotiable:
        filters.negotiable === '' ? undefined : filters.negotiable === 'true',
      postedDate: filters.postedDate || undefined,
      minSellerTrust: numberOrUndefined(filters.minSellerTrust),
      sortBy: filters.sortBy,
      page,
      size: 12,
    };
  }, [debouncedListingSearch, filters, page, selectedCollegeId]);

  useEffect(() => {
    if (!marketplaceQuery) {
      setMarketplace(null);
      setMarketplaceError(null);
      return;
    }
    const controller = new AbortController();
    setMarketplaceLoading(true);
    setMarketplaceError(null);
    void getExploreMarketplace(marketplaceQuery, controller.signal)
      .then((nextPage) => {
        setMarketplace((current) =>
          marketplaceQuery.page && current
            ? {
                ...nextPage,
                listings: [...current.listings, ...nextPage.listings],
              }
            : nextPage,
        );
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          setMarketplaceError(apiErrorMessage(error));
          if (marketplaceQuery.page === 0) setMarketplace(null);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setMarketplaceLoading(false);
      });
    return () => controller.abort();
  }, [marketplaceQuery, marketplaceReloadKey]);

  function exploreCollege(college: ExploreCollege) {
    setSearchParams({ collegeId: String(college.id) });
    setListingSearch('');
    setDebouncedListingSearch('');
    setFilters(defaultFilters);
    setPage(0);
    setReportSuccess(null);
  }

  function updateFilter<Key extends keyof ListingFilters>(
    key: Key,
    value: ListingFilters[Key],
  ) {
    setFilters((current) => ({ ...current, [key]: value }));
    setPage(0);
  }

  function clearFilters() {
    setListingSearch('');
    setDebouncedListingSearch('');
    setFilters(defaultFilters);
    setPage(0);
  }

  async function submitReport(
    reason: ListingReportReason,
    description: string,
  ) {
    if (!reportListing) return;
    try {
      await reportMarketplaceListing(reportListing.id, reason, description);
      setReportSuccess(
        `Report submitted for “${reportListing.title}”. Campus Hub administrators can now review it.`,
      );
    } catch (error) {
      throw new Error(apiErrorMessage(error));
    }
  }

  const hasFilters =
    Boolean(listingSearch) ||
    Object.entries(filters).some(
      ([key, value]) => key !== 'sortBy' && Boolean(value),
    ) ||
    filters.sortBy !== 'newest';

  return (
    <div className="space-y-8 pb-12">
      <PageHeader
        description="Discover active listings from other verified campus communities without changing your own college."
        eyebrow="Verified campus discovery"
        title="Explore other colleges"
      />

      {collegeData && (
        <section className="grid gap-4 rounded-2xl border border-[#bedbe5] bg-gradient-to-r from-[#ecfbff] to-[#f7faff] p-5 shadow-[0_4px_18px_rgba(3,22,53,0.04)] md:grid-cols-[auto_minmax(0,1fr)] md:items-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-[#007f9c] shadow-sm">
            <ShieldCheck aria-hidden="true" className="h-6 w-6" />
          </span>
          <div>
            <p className="text-sm font-black text-[#0a3954]">
              Your verified college remains{' '}
              {collegeData.viewerContext.verifiedCollegeName} (
              {collegeData.viewerContext.verifiedCollegeCode})
            </p>
            <p className="mt-1 text-sm leading-6 text-[#526b7c]">
              Exploring another campus is browse-only. It never changes your
              verified identity, default marketplace, wishlist, or order
              permissions.
            </p>
          </div>
        </section>
      )}

      <section className="rounded-2xl bg-[#061c3d] p-5 text-white shadow-[0_12px_30px_rgba(3,22,53,0.15)] sm:p-7">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(360px,0.8fr)] lg:items-center">
          <div>
            <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-cyan-300">
              <Compass aria-hidden="true" className="h-4 w-4" />
              Discover verified communities
            </p>
            <h2 className="mt-3 text-2xl font-black tracking-[-0.03em] sm:text-3xl">
              See what students at other colleges are listing
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[#c6d5e7]">
              Search by college name, code, city, state, or academic email
              domain. Every visible campus, seller, and listing is active and
              verified.
            </p>
          </div>
          <label className="relative block">
            <span className="sr-only">Search colleges</span>
            <Search
              aria-hidden="true"
              className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#65758b]"
            />
            <input
              className="h-14 w-full rounded-xl border border-white/20 bg-white pl-12 pr-12 text-sm font-medium text-[#10233d] shadow-lg outline-none placeholder:text-[#7c8898] focus:border-cyan-400 focus:ring-4 focus:ring-cyan-300/20"
              onChange={(event) => setCollegeSearch(event.target.value)}
              placeholder="Search colleges, cities, codes, or domains"
              type="search"
              value={collegeSearch}
            />
            {collegeSearch && (
              <button
                aria-label="Clear college search"
                className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-[#617083] hover:bg-[#edf2f7]"
                onClick={() => setCollegeSearch('')}
                type="button"
              >
                <X aria-hidden="true" className="h-4 w-4" />
              </button>
            )}
          </label>
        </div>
      </section>

      {collegeError ? (
        <ErrorState
          message={collegeError}
          onRetry={() => setCollegeReloadKey((current) => current + 1)}
          title="Colleges could not load"
        />
      ) : collegeLoading && !collegeData ? (
        <CollegeGridSkeleton />
      ) : collegeData ? (
        <>
          {!debouncedCollegeSearch &&
            collegeData.popularColleges.length > 0 && (
              <CollegeSection
                colleges={collegeData.popularColleges}
                description="Active verified communities with the most current marketplace activity."
                featured
                onExplore={exploreCollege}
                selectedCollegeId={selectedCollegeId}
                title="Popular colleges"
              />
            )}
          <CollegeSection
            colleges={collegeData.colleges}
            description={
              debouncedCollegeSearch
                ? `Verified matches for “${debouncedCollegeSearch}”.`
                : 'Browse every approved campus currently available on Campus Hub.'
            }
            emptySearch={debouncedCollegeSearch}
            onExplore={exploreCollege}
            selectedCollegeId={selectedCollegeId}
            title={debouncedCollegeSearch ? 'Search results' : 'All colleges'}
          />
        </>
      ) : null}

      {selectedCollegeId ? (
        <section
          className="scroll-mt-24 border-t border-[#dbe2ec] pt-8"
          id="college-marketplace"
        >
          {marketplaceError && !marketplace ? (
            <ErrorState
              message={marketplaceError}
              onRetry={() => setMarketplaceReloadKey((current) => current + 1)}
              title="This marketplace could not load"
            />
          ) : marketplace ? (
            <div className="space-y-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.13em] text-[#00819e]">
                    Browse-only marketplace · {marketplace.selectedCollege.code}
                  </p>
                  <h2 className="mt-1 text-2xl font-black tracking-[-0.03em] text-[#071b33]">
                    {marketplace.selectedCollege.name}
                  </h2>
                  <p className="mt-2 text-sm text-[#667386]">
                    {marketplace.pagination.totalElements.toLocaleString(
                      'en-IN',
                    )}{' '}
                    active listings ·{' '}
                    {marketplace.selectedCollege.verifiedStudents.toLocaleString(
                      'en-IN',
                    )}{' '}
                    verified students
                  </p>
                </div>
                <span className="inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-900">
                  <Info aria-hidden="true" className="h-4 w-4" />
                  View and report only — buying is disabled
                </span>
              </div>

              <MarketplaceFilters
                filters={filters}
                hasFilters={hasFilters}
                listingSearch={listingSearch}
                onClear={clearFilters}
                onSearchChange={(value) => {
                  setListingSearch(value);
                  setPage(0);
                }}
                onUpdate={updateFilter}
                pickupLocations={marketplace.pickupLocations}
              />

              {reportSuccess && (
                <div
                  className="flex items-start justify-between gap-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900"
                  role="status"
                >
                  <span>{reportSuccess}</span>
                  <button
                    className="shrink-0 underline underline-offset-2"
                    onClick={() => setReportSuccess(null)}
                    type="button"
                  >
                    Dismiss
                  </button>
                </div>
              )}
              {marketplaceError && (
                <div
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800"
                  role="alert"
                >
                  <span>{marketplaceError}</span>
                  <button
                    className="inline-flex items-center gap-1.5 font-bold underline underline-offset-2"
                    onClick={() =>
                      setMarketplaceReloadKey((current) => current + 1)
                    }
                    type="button"
                  >
                    <RefreshCw aria-hidden="true" className="h-3.5 w-3.5" />
                    Retry
                  </button>
                </div>
              )}

              {marketplaceLoading && page === 0 ? (
                <ListingGridSkeleton />
              ) : marketplace.listings.length > 0 ? (
                <>
                  <div className="grid gap-5 sm:grid-cols-2 2xl:grid-cols-3">
                    {marketplace.listings.map((listing) => (
                      <ExploreListingCard
                        key={listing.id}
                        listing={listing}
                        onReport={setReportListing}
                      />
                    ))}
                  </div>
                  {marketplace.pagination.hasMore && (
                    <div className="flex justify-center pt-2">
                      <button
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#b9c5d4] bg-white px-5 text-sm font-bold text-[#17304c] shadow-sm hover:border-cyan-600 hover:text-[#007b95] disabled:cursor-wait disabled:opacity-60"
                        disabled={marketplaceLoading}
                        onClick={() => setPage((current) => current + 1)}
                        type="button"
                      >
                        {marketplaceLoading && (
                          <LoaderCircle
                            aria-hidden="true"
                            className="h-4 w-4 animate-spin"
                          />
                        )}
                        Load more listings
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <EmptyMarketplace
                  filtered={hasFilters}
                  onClear={clearFilters}
                />
              )}
            </div>
          ) : (
            <ListingGridSkeleton />
          )}
        </section>
      ) : (
        <section className="rounded-2xl border border-dashed border-[#bfcbd9] bg-[#f8faff] px-5 py-9 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-[#007f9c] shadow-sm">
            <GraduationCap aria-hidden="true" className="h-7 w-7" />
          </span>
          <h2 className="mt-4 text-xl font-black text-[#071b33]">
            Choose a college to explore its marketplace
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-[#667386]">
            You can view product and seller details safely. Cross-college
            buying, orders, payment, direct messaging, and wishlist changes
            remain unavailable.
          </p>
        </section>
      )}

      <ReportListingModal
        onClose={() => setReportListing(null)}
        onSubmit={submitReport}
        open={Boolean(reportListing)}
        productTitle={reportListing?.title ?? ''}
      />
    </div>
  );
}

function CollegeSection({
  title,
  description,
  colleges,
  selectedCollegeId,
  featured = false,
  emptySearch,
  onExplore,
}: {
  title: string;
  description: string;
  colleges: ExploreCollege[];
  selectedCollegeId: number | null;
  featured?: boolean;
  emptySearch?: string;
  onExplore: (college: ExploreCollege) => void;
}) {
  return (
    <section>
      <div className="mb-4">
        <h2 className="text-xl font-black tracking-[-0.02em] text-[#071b33]">
          {title}
        </h2>
        <p className="mt-1 text-sm text-[#667386]">{description}</p>
      </div>
      {colleges.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
          {colleges.map((college) => (
            <ExploreCollegeCard
              college={college}
              featured={featured}
              key={college.id}
              onExplore={onExplore}
              selected={college.id === selectedCollegeId}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-[#c4cfdd] bg-white px-5 py-9 text-center">
          <Building2
            aria-hidden="true"
            className="mx-auto h-8 w-8 text-[#8795a7]"
          />
          <h3 className="mt-3 font-black text-[#10233d]">
            No verified colleges found
          </h3>
          <p className="mt-1 text-sm text-[#718094]">
            {emptySearch
              ? `Try a different name, code, city, state, or email domain instead of “${emptySearch}”.`
              : 'More approved college communities will appear here when available.'}
          </p>
        </div>
      )}
    </section>
  );
}

function MarketplaceFilters({
  listingSearch,
  filters,
  pickupLocations,
  hasFilters,
  onSearchChange,
  onUpdate,
  onClear,
}: {
  listingSearch: string;
  filters: ListingFilters;
  pickupLocations: string[];
  hasFilters: boolean;
  onSearchChange: (value: string) => void;
  onUpdate: <Key extends keyof ListingFilters>(
    key: Key,
    value: ListingFilters[Key],
  ) => void;
  onClear: () => void;
}) {
  return (
    <div className="rounded-2xl border border-[#dce2eb] bg-white p-4 shadow-[0_4px_16px_rgba(3,22,53,0.04)]">
      <div className="flex flex-wrap items-center gap-3">
        <label className="relative min-w-[250px] flex-1">
          <span className="sr-only">Search listings</span>
          <Search
            aria-hidden="true"
            className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#788597]"
          />
          <input
            className="h-11 w-full rounded-xl border border-[#ced6e1] bg-[#fbfcfe] pl-10 pr-4 text-sm outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100"
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search products, categories, sellers, or pickup areas"
            type="search"
            value={listingSearch}
          />
        </label>
        <label className="flex items-center gap-2">
          <SlidersHorizontal
            aria-hidden="true"
            className="h-4 w-4 text-[#6b788a]"
          />
          <span className="sr-only">Sort listings</span>
          <select
            className="h-11 rounded-xl border border-[#ced6e1] bg-white px-3 text-sm font-semibold text-[#263a52] outline-none focus:border-cyan-600"
            onChange={(event) =>
              onUpdate('sortBy', event.target.value as ListingFilters['sortBy'])
            }
            value={filters.sortBy}
          >
            <option value="newest">Newest first</option>
            <option value="priceAsc">Price: low to high</option>
            <option value="priceDesc">Price: high to low</option>
          </select>
        </label>
        {hasFilters && (
          <button
            className="inline-flex h-11 items-center gap-2 rounded-xl px-3 text-sm font-bold text-[#617084] hover:bg-[#f0f4f8] hover:text-[#10233d]"
            onClick={onClear}
            type="button"
          >
            <X aria-hidden="true" className="h-4 w-4" />
            Clear filters
          </button>
        )}
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-8">
        <FilterSelect
          label="Category"
          onChange={(value) => onUpdate('category', value)}
          value={filters.category}
        >
          <option value="">All categories</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </FilterSelect>
        <FilterSelect
          label="Condition"
          onChange={(value) => onUpdate('condition', value)}
          value={filters.condition}
        >
          <option value="">Any condition</option>
          {conditions.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </FilterSelect>
        <FilterSelect
          label="Pickup"
          onChange={(value) => onUpdate('pickupLocation', value)}
          value={filters.pickupLocation}
        >
          <option value="">Any pickup area</option>
          {pickupLocations.map((location) => (
            <option key={location} value={location}>
              {location}
            </option>
          ))}
        </FilterSelect>
        <FilterSelect
          label="Posted"
          onChange={(value) => onUpdate('postedDate', value)}
          value={filters.postedDate}
        >
          <option value="">Any time</option>
          <option value="today">Today</option>
          <option value="week">Past week</option>
          <option value="month">Past month</option>
        </FilterSelect>
        <FilterSelect
          label="Price type"
          onChange={(value) => onUpdate('negotiable', value)}
          value={filters.negotiable}
        >
          <option value="">Any price type</option>
          <option value="true">Negotiable</option>
          <option value="false">Fixed price</option>
        </FilterSelect>
        <FilterSelect
          label="Seller trust"
          onChange={(value) => onUpdate('minSellerTrust', value)}
          value={filters.minSellerTrust}
        >
          <option value="">Any trust score</option>
          <option value="50">50+ trust</option>
          <option value="70">70+ trust</option>
          <option value="90">90+ trust</option>
        </FilterSelect>
        <FilterInput
          label="Minimum price"
          onChange={(value) => onUpdate('minPrice', value)}
          placeholder="Min ₹"
          value={filters.minPrice}
        />
        <FilterInput
          label="Maximum price"
          onChange={(value) => onUpdate('maxPrice', value)}
          placeholder="Max ₹"
          value={filters.maxPrice}
        />
      </div>
    </div>
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
        className="h-10 w-full min-w-0 rounded-lg border border-[#d5dce6] bg-[#fbfcfe] px-2.5 text-xs font-semibold text-[#46576d] outline-none focus:border-cyan-600"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {children}
      </select>
    </label>
  );
}

function FilterInput({
  label,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label>
      <span className="sr-only">{label}</span>
      <input
        aria-label={label}
        className="h-10 w-full min-w-0 rounded-lg border border-[#d5dce6] bg-[#fbfcfe] px-2.5 text-xs font-semibold text-[#46576d] outline-none focus:border-cyan-600"
        min="0"
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        type="number"
        value={value}
      />
    </label>
  );
}

function ErrorState({
  title,
  message,
  onRetry,
}: {
  title: string;
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="rounded-2xl border border-rose-200 bg-white px-5 py-10 text-center shadow-sm">
      <RefreshCw aria-hidden="true" className="mx-auto h-8 w-8 text-rose-600" />
      <h2 className="mt-3 text-xl font-black text-[#071b33]">{title}</h2>
      <p className="mx-auto mt-2 max-w-xl text-sm text-[#6b788a]">{message}</p>
      <button
        className="mt-5 rounded-xl bg-[#031635] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#153557]"
        onClick={onRetry}
        type="button"
      >
        Try again
      </button>
    </div>
  );
}

function EmptyMarketplace({
  filtered,
  onClear,
}: {
  filtered: boolean;
  onClear: () => void;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-[#c4cfdd] bg-white px-5 py-10 text-center">
      <PackageSearch
        aria-hidden="true"
        className="mx-auto h-9 w-9 text-[#7d8a9c]"
      />
      <h3 className="mt-3 text-lg font-black text-[#10233d]">
        {filtered
          ? 'No listings match these filters'
          : 'No active listings yet'}
      </h3>
      <p className="mt-1 text-sm text-[#718094]">
        {filtered
          ? 'Try widening the price, condition, date, or trust filters.'
          : 'Verified active listings from this college will appear here.'}
      </p>
      {filtered && (
        <button
          className="mt-4 text-sm font-bold text-[#007b95] underline underline-offset-4"
          onClick={onClear}
          type="button"
        >
          Clear all filters
        </button>
      )}
    </div>
  );
}

function CollegeGridSkeleton() {
  return (
    <div
      aria-label="Loading colleges"
      className="grid animate-pulse gap-4 sm:grid-cols-2 2xl:grid-cols-4"
      role="status"
    >
      {Array.from({ length: 4 }, (_, index) => (
        <div
          className="h-80 rounded-2xl border border-[#e0e5ec] bg-white"
          key={index}
        />
      ))}
    </div>
  );
}

function ListingGridSkeleton() {
  return (
    <div
      aria-label="Loading marketplace listings"
      className="grid animate-pulse gap-5 sm:grid-cols-2 2xl:grid-cols-3"
      role="status"
    >
      {Array.from({ length: 6 }, (_, index) => (
        <div
          className="h-[470px] rounded-2xl border border-[#e0e5ec] bg-white"
          key={index}
        />
      ))}
    </div>
  );
}

function numberOrUndefined(value: string) {
  if (!value.trim()) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function apiErrorMessage(error: unknown) {
  if (isAxiosError(error)) {
    const data = error.response?.data as { message?: string } | undefined;
    return data?.message ?? 'Something went wrong. Please try again.';
  }
  return error instanceof Error
    ? error.message
    : 'Something went wrong. Please try again.';
}
