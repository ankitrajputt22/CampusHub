import { Heart, MapPin, ShieldCheck, Tag, UserRound } from 'lucide-react';
import { Link } from 'react-router-dom';

import type { MarketplaceListing } from '../api/marketplaceApi';
import {
  conditionLabel,
  formatPrice,
  relativeTime,
} from '../lib/marketplaceFormatters';
import { MarketplaceProductVisual } from './MarketplaceProductVisual';

export function CollegeListingCard({
  listing,
  wishlistBusy,
  onWishlistChange,
  wishlistEnabled = true,
  detailsBasePath = '/listing',
}: {
  listing: MarketplaceListing;
  wishlistBusy: boolean;
  onWishlistChange: (listing: MarketplaceListing) => void;
  wishlistEnabled?: boolean;
  detailsBasePath?: string;
}) {
  const detailsPath = `${detailsBasePath}/${listing.id}`;

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-xl border border-[#dfe3eb] bg-white shadow-[0_2px_10px_rgba(3,22,53,0.05)] transition hover:-translate-y-0.5 hover:border-[#b9c4d3] hover:shadow-[0_10px_24px_rgba(3,22,53,0.09)]">
      <div className="relative aspect-[4/3] overflow-hidden bg-[#eff4ff]">
        <MarketplaceProductVisual listing={listing} />
        <span className="absolute left-3 top-3 rounded-md border border-white/70 bg-white/95 px-2 py-1 text-[11px] font-bold text-[#334155] shadow-sm">
          {conditionLabel(listing.condition)}
        </span>
        {listing.ownListing ? (
          <span className="absolute right-3 top-3 rounded-md bg-[#031635] px-2.5 py-1.5 text-[11px] font-bold text-white shadow-sm">
            Your listing
          </span>
        ) : !wishlistEnabled ? (
          <span className="absolute right-3 top-3 rounded-md bg-[#17385e] px-2.5 py-1.5 text-[11px] font-bold text-white shadow-sm">
            Browse only
          </span>
        ) : (
          <button
            aria-label={
              listing.wishlisted
                ? `Remove ${listing.title} from wishlist`
                : `Save ${listing.title} to wishlist`
            }
            aria-pressed={listing.wishlisted}
            className={`absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-lg border bg-white shadow-sm ${
              listing.wishlisted
                ? 'border-rose-200 text-rose-600'
                : 'border-white text-[#516072] hover:border-rose-200 hover:text-rose-600'
            } disabled:cursor-wait disabled:opacity-60`}
            disabled={wishlistBusy}
            onClick={() => onWishlistChange(listing)}
            title={
              listing.wishlisted ? 'Remove from wishlist' : 'Add to wishlist'
            }
            type="button"
          >
            <Heart
              aria-hidden="true"
              className="h-[18px] w-[18px]"
              fill={listing.wishlisted ? 'currentColor' : 'none'}
            />
          </button>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-center justify-between gap-3 text-xs">
          <span className="inline-flex items-center gap-1.5 font-bold uppercase tracking-[0.09em] text-[#007b95]">
            <Tag aria-hidden="true" className="h-3.5 w-3.5" />
            {listing.category}
          </span>
          {listing.negotiable && (
            <span className="rounded-full bg-emerald-50 px-2 py-1 font-semibold text-emerald-700">
              Negotiable
            </span>
          )}
        </div>

        <Link
          className="mt-2 line-clamp-2 min-h-12 text-[16px] font-extrabold leading-6 text-[#071b33] hover:text-[#007b95]"
          to={detailsPath}
        >
          {listing.title}
        </Link>
        <p className="mt-2 text-xl font-black tracking-[-0.02em] text-[#031635]">
          {formatPrice(listing.price)}
        </p>

        <div className="mt-3 flex items-center gap-2 text-xs text-[#687384]">
          <MapPin aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{listing.pickupLocation}</span>
          <span aria-hidden="true">·</span>
          <span className="shrink-0">{relativeTime(listing.createdAt)}</span>
        </div>

        <div className="mt-auto flex items-center justify-between gap-3 border-t border-[#edf0f4] pt-4">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#eff4ff] text-xs font-black text-[#153557]">
              {initials(listing.seller.fullName) || (
                <UserRound className="h-4 w-4" />
              )}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-[#1f2e43]">
                {listing.seller.fullName}
              </p>
              <p className="mt-1 flex w-fit items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-800">
                <ShieldCheck
                  aria-hidden="true"
                  className="h-3 w-3 text-emerald-600"
                />
                {listing.seller.trustScore} Trust Score
              </p>
            </div>
          </div>
          <Link
            className="shrink-0 rounded-lg bg-[#031635] px-3 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#153557]"
            to={detailsPath}
          >
            View details
          </Link>
        </div>
      </div>
    </article>
  );
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}
