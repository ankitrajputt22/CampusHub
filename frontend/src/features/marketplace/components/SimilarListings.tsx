import { ArrowRight, PackageSearch } from 'lucide-react';
import { Link } from 'react-router-dom';

import type { MarketplaceListing } from '../api/marketplaceApi';
import { CollegeListingCard } from './CollegeListingCard';

export function SimilarListings({
  category,
  collegeName,
  listings,
  wishlistBusyIds,
  onWishlistChange,
}: {
  category: string;
  collegeName: string;
  listings: MarketplaceListing[];
  wishlistBusyIds: Set<number>;
  onWishlistChange: (listing: MarketplaceListing) => void;
}) {
  return (
    <section className="mt-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.13em] text-[#007b95]">
            Recommended from your campus
          </p>
          <h2 className="mt-1 text-xl font-black tracking-[-0.02em] text-[#071b33]">
            Other {category.toLowerCase()} in your college
          </h2>
          <p className="mt-1 text-sm text-[#667386]">
            Active listings from verified students at {collegeName}
          </p>
        </div>
        <Link
          className="inline-flex items-center gap-2 text-sm font-bold text-[#007b95] hover:text-[#005d72]"
          to={`/student/marketplace?search=${encodeURIComponent(category)}`}
        >
          Browse category
          <ArrowRight aria-hidden="true" className="h-4 w-4" />
        </Link>
      </div>

      {listings.length > 0 ? (
        <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {listings.map((listing) => (
            <CollegeListingCard
              key={listing.id}
              listing={listing}
              onWishlistChange={onWishlistChange}
              wishlistBusy={wishlistBusyIds.has(listing.id)}
            />
          ))}
        </div>
      ) : (
        <div className="mt-5 flex items-center gap-3 rounded-2xl border border-dashed border-[#cad2de] bg-white px-5 py-6 text-sm text-[#667386]">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#eff4ff] text-[#007b95]">
            <PackageSearch aria-hidden="true" className="h-5 w-5" />
          </span>
          No similar active listings are available in your college right now.
        </div>
      )}
    </section>
  );
}
