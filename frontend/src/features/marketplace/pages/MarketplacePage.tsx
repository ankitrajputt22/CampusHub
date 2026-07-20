import { SlidersHorizontal, X } from 'lucide-react';
import { useMemo, useState } from 'react';

import { PageHeader } from '../../student/components/StudentUi';
import { getCampusUser } from '../../student/lib/session';
import { ListingCard } from '../components/ListingCard';
import { categories, listings } from '../data/mockData';

export function MarketplacePage() {
  const user = getCampusUser();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All categories');
  const [condition, setCondition] = useState('Any condition');
  const [sort, setSort] = useState('Newest');
  const [filtersOpen, setFiltersOpen] = useState(false);

  const results = useMemo(() => {
    const filtered = listings.filter((listing) => {
      const matchesSearch = `${listing.title} ${listing.category}`
        .toLowerCase()
        .includes(search.toLowerCase());
      const matchesCategory =
        category === 'All categories' || listing.category === category;
      const matchesCondition =
        condition === 'Any condition' || listing.condition === condition;
      return matchesSearch && matchesCategory && matchesCondition;
    });

    return [...filtered].sort((first, second) => {
      if (sort === 'Price: Low to high') return first.price - second.price;
      if (sort === 'Price: High to low') return second.price - first.price;
      if (sort === 'Trusted sellers')
        return second.sellerTrust - first.sellerTrust;
      return 0;
    });
  }, [category, condition, search, sort]);

  function clearFilters() {
    setSearch('');
    setCategory('All categories');
    setCondition('Any condition');
    setSort('Newest');
  }

  return (
    <div className="space-y-6">
      <PageHeader
        description={`Verified listings from ${user.collegeName}. Your college is determined by your verified account.`}
        eyebrow="My college"
        title="Campus marketplace"
      />

      <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside
          className={`${filtersOpen ? 'fixed inset-0 z-50 overflow-y-auto bg-white p-5' : 'hidden'} lg:static lg:block lg:rounded-lg lg:border lg:border-slate-200 lg:bg-white lg:p-5 lg:shadow-sm`}
        >
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-bold text-slate-950">
              <SlidersHorizontal aria-hidden="true" className="h-4 w-4" />
              Filters
            </h2>
            <button
              aria-label="Close filters"
              className="rounded-lg p-2 text-slate-500 lg:hidden"
              onClick={() => setFiltersOpen(false)}
              title="Close filters"
              type="button"
            >
              <X aria-hidden="true" className="h-5 w-5" />
            </button>
          </div>
          <div className="mt-5 space-y-5">
            <FilterSelect
              label="Category"
              onChange={setCategory}
              options={categories}
              value={category}
            />
            <FilterSelect
              label="Condition"
              onChange={setCondition}
              options={[
                'Any condition',
                'New',
                'Like New',
                'Good',
                'Fair',
                'Used',
              ]}
              value={condition}
            />
            <div>
              <label
                className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500"
                htmlFor="max-price"
              >
                Maximum price
              </label>
              <input
                className="mt-3 w-full accent-cyan-700"
                defaultValue="50000"
                id="max-price"
                max="50000"
                min="500"
                step="500"
                type="range"
              />
              <div className="mt-1 flex justify-between text-xs text-slate-500">
                <span>₹500</span>
                <span>₹50,000</span>
              </div>
            </div>
            <button
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:border-cyan-700"
              onClick={clearFilters}
              type="button"
            >
              Clear filters
            </button>
          </div>
        </aside>

        <section className="min-w-0">
          <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm sm:flex-row">
            <input
              className="h-10 min-w-0 flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search books, cycles, electronics..."
              type="search"
              value={search}
            />
            <button
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-300 px-3 text-sm font-semibold text-slate-700 lg:hidden"
              onClick={() => setFiltersOpen(true)}
              type="button"
            >
              <SlidersHorizontal aria-hidden="true" className="h-4 w-4" />
              Filters
            </button>
            <select
              aria-label="Sort listings"
              className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none focus:border-cyan-600"
              onChange={(event) => setSort(event.target.value)}
              value={sort}
            >
              {[
                'Newest',
                'Price: Low to high',
                'Price: High to low',
                'Trusted sellers',
              ].map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </div>

          <div className="my-4 flex items-center justify-between gap-4">
            <p className="text-sm text-slate-600">
              <strong className="text-slate-950">{results.length}</strong>{' '}
              listings found
            </p>
            <p className="hidden text-xs text-slate-500 sm:block">
              Campus pickup only
            </p>
          </div>

          {results.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
              {results.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
              <h2 className="font-bold text-slate-900">No matching listings</h2>
              <p className="mt-2 text-sm text-slate-500">
                Try a different keyword or clear the filters.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function FilterSelect({
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
    <div>
      <label
        className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500"
        htmlFor={`filter-${label}`}
      >
        {label}
      </label>
      <select
        className="mt-2 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-cyan-600"
        id={`filter-${label}`}
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </div>
  );
}
