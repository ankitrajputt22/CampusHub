import { Building2, MapPin, Search, Users } from 'lucide-react';
import { useState } from 'react';

import { PageHeader, SectionHeading } from '../../student/components/StudentUi';
import { ListingCard } from '../components/ListingCard';
import { colleges, listings } from '../data/mockData';

export function ExploreCollegesPage() {
  const [query, setQuery] = useState('');
  const filtered = colleges.filter((college) =>
    college.name.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div className="space-y-7">
      <PageHeader
        description="Browse verified campus communities separately from your default college marketplace."
        eyebrow="Discover"
        title="Explore other colleges"
      />
      <div className="relative max-w-2xl">
        <Search
          aria-hidden="true"
          className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
        />
        <input
          className="h-12 w-full rounded-lg border border-slate-200 bg-white pl-12 pr-4 text-sm shadow-sm outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search a verified college"
          type="search"
          value={query}
        />
      </div>
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {filtered.map((college, index) => (
          <article
            className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
            key={college.name}
          >
            <div
              className={`flex h-11 w-11 items-center justify-center rounded-lg ${['bg-cyan-100 text-cyan-800', 'bg-amber-100 text-amber-800', 'bg-emerald-100 text-emerald-800', 'bg-blue-100 text-blue-800'][index % 4]}`}
            >
              <Building2 aria-hidden="true" className="h-5 w-5" />
            </div>
            <h2 className="mt-4 min-h-14 text-base font-bold leading-6 text-slate-950">
              {college.name}
            </h2>
            <p className="mt-3 flex items-center gap-2 text-sm text-slate-500">
              <MapPin aria-hidden="true" className="h-4 w-4" />
              {college.city}, Uttar Pradesh
            </p>
            <p className="mt-2 flex items-center gap-2 text-sm text-slate-500">
              <Users aria-hidden="true" className="h-4 w-4" />
              {college.students} verified students
            </p>
            <button
              className="mt-5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-800 hover:border-cyan-700 hover:bg-cyan-50"
              type="button"
            >
              View {college.listings} listings
            </button>
          </article>
        ))}
      </section>
      <section className="space-y-4">
        <SectionHeading
          description="A preview of public listings from nearby verified colleges."
          title="Across Uttar Pradesh"
        />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {listings.slice(4, 8).map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      </section>
    </div>
  );
}
