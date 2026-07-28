import {
  ArrowUpRight,
  Building2,
  Flag,
  MapPin,
  ShieldCheck,
  ShoppingBag,
  Tag,
  UserRound,
} from 'lucide-react';
import { Link } from 'react-router-dom';

import type { ExploreListing } from '../../api/exploreApi';
import {
  conditionLabel,
  formatPrice,
  relativeTime,
} from '../../lib/marketplaceFormatters';
import { MarketplaceProductVisual } from '../MarketplaceProductVisual';

export function ExploreListingCard({
  listing,
  reportBusy = false,
  onReport,
}: {
  listing: ExploreListing;
  reportBusy?: boolean;
  onReport: (listing: ExploreListing) => void;
}) {
  const detailsPath = `/student/explore-colleges/listing/${listing.id}`;

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-[#dfe3eb] bg-white shadow-[0_3px_14px_rgba(3,22,53,0.05)] transition hover:-translate-y-0.5 hover:border-[#bdc8d6] hover:shadow-[0_12px_28px_rgba(3,22,53,0.09)]">
      <Link
        aria-label={`View ${listing.title}`}
        className="relative block aspect-[4/3] overflow-hidden bg-[#eff4ff]"
        to={detailsPath}
      >
        <MarketplaceProductVisual listing={listing} />
        <span className="absolute left-3 top-3 rounded-md border border-white/70 bg-white/95 px-2 py-1 text-[11px] font-bold text-[#334155] shadow-sm">
          {conditionLabel(listing.condition)}
        </span>
        <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-md bg-[#17385e]/95 px-2 py-1 text-[10px] font-bold text-white shadow-sm">
          <Building2 aria-hidden="true" className="h-3 w-3" />
          {listing.college.code}
        </span>
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[0.09em] text-[#00809d]">
            <Tag aria-hidden="true" className="h-3.5 w-3.5" />
            {listing.category}
          </span>
          {listing.negotiable && (
            <span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700">
              Negotiable
            </span>
          )}
        </div>
        <Link
          className="mt-2 line-clamp-2 min-h-12 text-base font-black leading-6 text-[#071b33] hover:text-[#007b95]"
          to={detailsPath}
        >
          {listing.title}
        </Link>
        <strong className="mt-2 text-xl font-black tracking-[-0.02em] text-[#031635]">
          {formatPrice(listing.price)}
        </strong>
        <p className="mt-3 flex items-center gap-2 text-xs text-[#687384]">
          <MapPin aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{listing.pickupLocation}</span>
          <span aria-hidden="true">·</span>
          <span className="shrink-0">{relativeTime(listing.createdAt)}</span>
        </p>

        <div className="mt-4 flex items-center gap-2.5 border-t border-[#edf0f4] pt-4">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#eff4ff] text-xs font-black text-[#153557]">
            {initials(listing.seller.fullName) || (
              <UserRound aria-hidden="true" className="h-4 w-4" />
            )}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-[#1f2e43]">
              {listing.seller.fullName}
            </p>
            <p className="mt-0.5 flex items-center gap-1 text-[10px] font-bold text-emerald-700">
              <ShieldCheck aria-hidden="true" className="h-3 w-3" />
              {listing.seller.trustScore} trust · {listing.seller.trustLevel}
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-[minmax(0,1fr)_auto] gap-2">
          <Link
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#031635] px-3 text-xs font-bold text-white hover:bg-[#153557]"
            to={detailsPath}
          >
            View details
            <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" />
          </Link>
          <button
            aria-label={`Report ${listing.title}`}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#d2d9e3] text-[#647185] hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 disabled:cursor-wait disabled:opacity-60"
            disabled={reportBusy}
            onClick={() => onReport(listing)}
            title="Report listing"
            type="button"
          >
            <Flag aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>
        <p className="mt-3 flex items-start gap-1.5 rounded-lg bg-amber-50 px-2.5 py-2 text-[10px] font-semibold leading-4 text-amber-900">
          <ShoppingBag aria-hidden="true" className="mt-0.5 h-3 w-3 shrink-0" />
          Buying from other colleges is not available yet.
        </p>
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
