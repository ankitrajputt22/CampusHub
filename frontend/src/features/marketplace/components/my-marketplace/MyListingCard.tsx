import {
  Eye,
  Heart,
  MapPin,
  PackageOpen,
  Pencil,
  PauseCircle,
  RotateCcw,
  ShoppingBag,
  Trash2,
} from 'lucide-react';
import { Link } from 'react-router-dom';

import { resolveApiAssetUrl } from '../../../../lib/apiClient';
import type {
  MyListingStatus,
  MyListingSummary,
} from '../../api/marketplaceApi';
import {
  conditionLabel,
  formatPrice,
  relativeTime,
} from '../../lib/marketplaceFormatters';
import type { ListingAction } from './ConfirmListingActionModal';

const statusClasses: Record<MyListingStatus, string> = {
  ACTIVE: 'bg-emerald-100 text-emerald-800',
  RESERVED: 'bg-violet-100 text-violet-800',
  SOLD: 'bg-blue-100 text-blue-800',
  INACTIVE: 'bg-slate-200 text-slate-700',
  UNDER_REVIEW: 'bg-amber-100 text-amber-800',
  BLOCKED: 'bg-rose-100 text-rose-800',
};

export function MyListingCard({
  listing,
  onAction,
}: {
  listing: MyListingSummary;
  onAction: (listing: MyListingSummary, action: ListingAction) => void;
}) {
  const imageUrl = resolveApiAssetUrl(listing.coverImageUrl);
  const editable = listing.status === 'ACTIVE' || listing.status === 'INACTIVE';
  const viewable =
    listing.status === 'ACTIVE' ||
    listing.status === 'SOLD' ||
    listing.status === 'INACTIVE';

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-[#dce2eb] bg-white shadow-[0_4px_18px_rgba(3,22,53,0.045)] transition hover:-translate-y-0.5 hover:border-[#b9c8d9] hover:shadow-[0_12px_30px_rgba(3,22,53,0.09)]">
      <div className="relative aspect-[16/10] overflow-hidden bg-[#e9f3f7]">
        {imageUrl ? (
          <img
            alt={listing.title}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.025]"
            src={imageUrl}
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center bg-gradient-to-br from-[#e2f7fb] to-[#e7edfa] text-[#33738a]">
            <PackageOpen aria-hidden="true" className="h-12 w-12" />
            <span className="mt-2 text-xs font-bold">No product image</span>
          </div>
        )}
        <span
          className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-[11px] font-black tracking-wide ${statusClasses[listing.status]}`}
        >
          {listing.status.replace('_', ' ')}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-black uppercase tracking-[0.12em] text-[#007b95]">
              {listing.category}
            </p>
            <h2 className="mt-1 line-clamp-2 text-base font-black leading-6 text-[#10233d]">
              {listing.title}
            </h2>
          </div>
          <p className="shrink-0 text-base font-black text-[#071b33]">
            {formatPrice(listing.price)}
          </p>
        </div>

        <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-[#506176]">
          <span className="rounded-md bg-[#f1f5f9] px-2 py-1">
            {conditionLabel(listing.condition)}
          </span>
          {listing.negotiable && (
            <span className="rounded-md bg-cyan-50 px-2 py-1 text-[#007b95]">
              Negotiable
            </span>
          )}
        </div>

        <p className="mt-3 flex items-center gap-1.5 truncate text-xs text-[#687587]">
          <MapPin aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
          {listing.pickupLocation}
        </p>

        <div className="mt-4 grid grid-cols-3 divide-x divide-[#dce2eb] rounded-xl bg-[#f6f8fb] px-2 py-2.5 text-center">
          <div>
            <p className="flex items-center justify-center gap-1 text-xs font-black text-[#243b55]">
              <Eye aria-hidden="true" className="h-3.5 w-3.5" />
              {listing.views}
            </p>
            <p className="mt-0.5 text-[10px] text-[#788496]">Views</p>
          </div>
          <div>
            <p className="flex items-center justify-center gap-1 text-xs font-black text-[#243b55]">
              <Heart aria-hidden="true" className="h-3.5 w-3.5" />
              {listing.wishlistCount}
            </p>
            <p className="mt-0.5 text-[10px] text-[#788496]">Saves</p>
          </div>
          <div>
            <p className="text-xs font-black text-[#243b55]">
              {relativeTime(listing.postedDate)}
            </p>
            <p className="mt-0.5 text-[10px] text-[#788496]">Posted</p>
          </div>
        </div>

        <div className="mt-auto flex flex-wrap gap-2 pt-4">
          {viewable && (
            <Link
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-[#cfd8e5] px-3 text-xs font-bold text-[#25384f] transition hover:border-[#00a7c4] hover:text-[#007b95]"
              to={`/listing/${listing.id}`}
            >
              <Eye aria-hidden="true" className="h-3.5 w-3.5" />
              View
            </Link>
          )}
          {editable && (
            <Link
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-[#cfd8e5] px-3 text-xs font-bold text-[#25384f] transition hover:border-[#00a7c4] hover:text-[#007b95]"
              to={`/student/my-marketplace/edit/${listing.id}`}
            >
              <Pencil aria-hidden="true" className="h-3.5 w-3.5" />
              Edit
            </Link>
          )}
          {listing.status === 'ACTIVE' && (
            <>
              <button
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-[#071b33] px-3 text-xs font-bold text-white transition hover:bg-[#0c2a4c]"
                onClick={() => onAction(listing, 'mark-sold')}
                type="button"
              >
                <ShoppingBag aria-hidden="true" className="h-3.5 w-3.5" />
                Mark sold
              </button>
              <button
                aria-label={`Make ${listing.title} inactive`}
                className="ml-auto inline-flex h-9 w-9 items-center justify-center rounded-lg text-[#617086] transition hover:bg-amber-50 hover:text-amber-700"
                onClick={() => onAction(listing, 'mark-inactive')}
                title="Make inactive"
                type="button"
              >
                <PauseCircle aria-hidden="true" className="h-4 w-4" />
              </button>
            </>
          )}
          {listing.status === 'INACTIVE' && (
            <button
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-[#071b33] px-3 text-xs font-bold text-white transition hover:bg-[#0c2a4c]"
              onClick={() => onAction(listing, 'reactivate')}
              type="button"
            >
              <RotateCcw aria-hidden="true" className="h-3.5 w-3.5" />
              Reactivate
            </button>
          )}
          <button
            aria-label={`Delete ${listing.title}`}
            className={`${listing.status === 'ACTIVE' ? '' : 'ml-auto'} inline-flex h-9 w-9 items-center justify-center rounded-lg text-[#7a8797] transition hover:bg-rose-50 hover:text-rose-700`}
            onClick={() => onAction(listing, 'delete')}
            title="Delete listing"
            type="button"
          >
            <Trash2 aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>
      </div>
    </article>
  );
}
