import { Heart, MapPin, ShieldCheck, Star } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

import type { Listing } from '../data/mockData';
import { ProductVisual } from './ProductVisual';

export function ListingCard({
  listing,
  saved = false,
}: {
  listing: Listing;
  saved?: boolean;
}) {
  const [isSaved, setIsSaved] = useState(saved);

  return (
    <article className="group overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="relative aspect-[4/3] overflow-hidden">
        <ProductVisual listing={listing} />
        <span className="absolute left-3 top-3 rounded-md bg-white/95 px-2 py-1 text-xs font-semibold text-slate-700 shadow-sm">
          {listing.condition}
        </span>
        <button
          aria-label={
            isSaved
              ? `Remove ${listing.title} from wishlist`
              : `Save ${listing.title} to wishlist`
          }
          className={`absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-lg border bg-white shadow-sm transition ${isSaved ? 'border-rose-200 text-rose-600' : 'border-white text-slate-500 hover:text-rose-600'}`}
          onClick={() => setIsSaved((current) => !current)}
          title={isSaved ? 'Remove from wishlist' : 'Add to wishlist'}
          type="button"
        >
          <Heart
            aria-hidden="true"
            className="h-[18px] w-[18px]"
            fill={isSaved ? 'currentColor' : 'none'}
          />
        </button>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-cyan-700">
              {listing.category}
            </p>
            <Link
              className="mt-1 line-clamp-2 block min-h-12 font-bold leading-6 text-slate-950 hover:text-cyan-800"
              to={`/listing/${listing.id}`}
            >
              {listing.title}
            </Link>
          </div>
          <p className="shrink-0 text-lg font-black text-slate-950">
            ₹{listing.price.toLocaleString('en-IN')}
          </p>
        </div>

        <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
          <MapPin aria-hidden="true" className="h-3.5 w-3.5" />
          <span className="truncate">{listing.location}</span>
          <span aria-hidden="true">·</span>
          <span className="shrink-0">{listing.posted}</span>
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-800">
              {listing.seller}
            </p>
            <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
              <ShieldCheck
                aria-hidden="true"
                className="h-3.5 w-3.5 text-emerald-600"
              />
              Trust {listing.sellerTrust}
            </p>
          </div>
          <span className="flex items-center gap-1 text-xs font-semibold text-slate-600">
            <Star
              aria-hidden="true"
              className="h-3.5 w-3.5 fill-amber-400 text-amber-400"
            />
            {listing.sellerRating}
          </span>
        </div>
      </div>
    </article>
  );
}
