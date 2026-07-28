import { Eye, MapPin, ShieldCheck, Tag, Trash2, UserRound } from 'lucide-react';
import { Link } from 'react-router-dom';

import { MarketplaceProductVisual } from '../../marketplace/components/MarketplaceProductVisual';
import {
  conditionLabel,
  formatPrice,
  relativeTime,
} from '../../marketplace/lib/marketplaceFormatters';
import type { WishlistItem, WishlistListingStatus } from '../api/wishlistApi';

const statusClasses: Record<WishlistListingStatus, string> = {
  ACTIVE: 'bg-emerald-100 text-emerald-800',
  RESERVED: 'bg-violet-100 text-violet-800',
  SOLD: 'bg-blue-100 text-blue-800',
  INACTIVE: 'bg-slate-200 text-slate-700',
  DELETED: 'bg-rose-100 text-rose-800',
  BLOCKED: 'bg-rose-100 text-rose-800',
  UNDER_REVIEW: 'bg-amber-100 text-amber-800',
};

export function WishlistCard({
  item,
  onRemove,
}: {
  item: WishlistItem;
  onRemove: (item: WishlistItem) => void;
}) {
  const { listing } = item;
  const message = availabilityMessage(listing.status, listing.available);

  return (
    <article
      className={`group flex h-full flex-col overflow-hidden rounded-2xl border bg-white shadow-[0_4px_18px_rgba(3,22,53,0.045)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(3,22,53,0.09)] ${
        listing.available
          ? 'border-[#dce2eb] hover:border-[#b9c8d9]'
          : 'border-[#d6dce5]'
      }`}
    >
      <div
        className={`relative aspect-[16/10] overflow-hidden bg-[#eef3f8] ${
          listing.available ? '' : 'grayscale-[30%]'
        }`}
      >
        <MarketplaceProductVisual
          listing={{
            title: listing.title,
            category: listing.category,
            primaryImageUrl: listing.coverImageUrl,
          }}
        />
        <span
          className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-[11px] font-black tracking-wide ${statusClasses[listing.status]}`}
        >
          {listing.status.replace(/_/g, ' ')}
        </span>
        <button
          aria-label={`Remove ${listing.title} from wishlist`}
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-lg border border-white bg-white/95 text-rose-600 shadow-sm transition hover:bg-rose-50"
          onClick={() => onRemove(item)}
          title="Remove from wishlist"
          type="button"
        >
          <Trash2 aria-hidden="true" className="h-4 w-4" />
        </button>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[0.1em] text-[#007b95]">
              <Tag aria-hidden="true" className="h-3.5 w-3.5" />
              {listing.category}
            </p>
            <h3 className="mt-1 line-clamp-2 min-h-12 text-base font-black leading-6 text-[#10233d]">
              {listing.title}
            </h3>
          </div>
          <p className="shrink-0 text-base font-black text-[#071b33]">
            {formatPrice(listing.price)}
          </p>
        </div>

        <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-[#506176]">
          <span className="rounded-md bg-[#f1f5f9] px-2 py-1">
            {conditionLabel(listing.condition)}
          </span>
          <span className="rounded-md bg-[#f1f5f9] px-2 py-1">
            Saved {relativeTime(item.savedAt)}
          </span>
        </div>

        <p className="mt-3 flex items-center gap-1.5 truncate text-xs text-[#687587]">
          <MapPin aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
          {listing.pickupLocation}
        </p>

        {message && (
          <p
            className={`mt-3 rounded-lg px-3 py-2 text-xs font-bold leading-5 ${
              listing.status === 'UNDER_REVIEW'
                ? 'bg-amber-50 text-amber-800'
                : 'bg-slate-100 text-[#59687a]'
            }`}
          >
            {message}
          </p>
        )}

        <div className="mt-auto flex items-end justify-between gap-3 border-t border-[#edf0f4] pt-4">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#eff4ff] text-xs font-black text-[#153557]">
              {initials(listing.seller.fullName) || (
                <UserRound aria-hidden="true" className="h-4 w-4" />
              )}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-[#1f2e43]">
                {listing.seller.fullName}
              </p>
              <p className="mt-1 flex items-center gap-1 text-[10px] font-bold text-emerald-700">
                <ShieldCheck aria-hidden="true" className="h-3 w-3" />
                {listing.seller.trustScore}/100 · {listing.seller.trustLevel}
              </p>
            </div>
          </div>
          {listing.available && (
            <Link
              className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg bg-[#071b33] px-3 text-xs font-bold text-white hover:bg-[#0c2a4c]"
              to={`/listing/${listing.id}`}
            >
              <Eye aria-hidden="true" className="h-3.5 w-3.5" />
              View details
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}

function availabilityMessage(
  status: WishlistListingStatus,
  available: boolean,
) {
  if (available) return null;
  if (status === 'SOLD') return 'This item has already been sold.';
  if (status === 'INACTIVE' || status === 'RESERVED') {
    return 'This listing is currently unavailable.';
  }
  if (status === 'UNDER_REVIEW') return 'This listing is under review.';
  return 'This listing is no longer available.';
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}
