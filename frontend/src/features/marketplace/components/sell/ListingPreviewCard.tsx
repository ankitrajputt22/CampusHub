import { Eye, Heart, MapPin, PackageOpen, ShieldCheck } from 'lucide-react';

import type { CampusUser } from '../../../student/lib/session';
import { conditionLabel, formatPrice } from '../../lib/marketplaceFormatters';

export type ListingPreview = {
  title: string;
  category: string;
  price: number;
  condition: string;
  pickupLocation: string;
  negotiable: boolean;
};

export function ListingPreviewCard({
  listing,
  coverImageUrl,
  user,
}: {
  listing: ListingPreview;
  coverImageUrl: string | null;
  user: CampusUser;
}) {
  const title = listing.title.trim() || 'Your product title';
  const category = listing.category || 'Category';
  const condition = listing.condition || 'Condition';
  const pickup = listing.pickupLocation.trim() || 'Campus pickup point';

  return (
    <section aria-labelledby="listing-preview-heading">
      <div className="flex items-center justify-between gap-3">
        <h2
          className="flex items-center gap-2 text-sm font-black text-[#25384f]"
          id="listing-preview-heading"
        >
          <Eye aria-hidden="true" className="h-4 w-4 text-[#007b95]" />
          Live listing preview
        </h2>
        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-emerald-700">
          Active after posting
        </span>
      </div>

      <article className="mt-3 overflow-hidden rounded-2xl border border-[#dce2eb] bg-white shadow-[0_8px_24px_rgba(3,22,53,0.09)]">
        <div className="relative aspect-[4/3] overflow-hidden bg-[#eaf0f7]">
          {coverImageUrl ? (
            <img
              alt="Listing cover preview"
              className="h-full w-full object-cover"
              src={coverImageUrl}
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center bg-[#e9f5f8] text-[#007b95]">
              <PackageOpen aria-hidden="true" className="h-14 w-14" />
              <span className="mt-2 text-xs font-bold">
                Your cover image appears here
              </span>
            </div>
          )}
          <div className="absolute left-3 top-3 flex max-w-[70%] flex-wrap gap-2">
            <span className="rounded-md bg-[#031635]/90 px-2 py-1 text-[10px] font-black uppercase tracking-[0.07em] text-white backdrop-blur">
              {category}
            </span>
            <span className="rounded-md bg-white/95 px-2 py-1 text-[10px] font-black uppercase tracking-[0.07em] text-[#25384f] backdrop-blur">
              {conditionLabel(condition)}
            </span>
          </div>
          <button
            aria-label="Wishlist button preview"
            className="absolute right-3 top-3 flex h-9 w-9 cursor-default items-center justify-center rounded-full bg-white/95 text-[#42536a] shadow"
            disabled
            type="button"
          >
            <Heart aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>

        <div className="p-4">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
            <h3 className="line-clamp-2 text-base font-black leading-6 text-[#10233d]">
              {title}
            </h3>
            <div className="text-right">
              <strong className="block text-xl font-black text-[#031635]">
                {listing.price > 0 ? formatPrice(listing.price) : '₹0'}
              </strong>
              <span
                className={`mt-0.5 block text-[9px] font-black uppercase tracking-[0.07em] ${
                  listing.negotiable ? 'text-emerald-700' : 'text-[#788496]'
                }`}
              >
                {listing.negotiable ? 'Negotiable' : 'Fixed price'}
              </span>
            </div>
          </div>

          <p className="mt-4 flex items-center gap-1.5 border-y border-[#edf0f4] py-3 text-xs font-semibold text-[#687587]">
            <MapPin aria-hidden="true" className="h-3.5 w-3.5" />
            {pickup}
          </p>

          <div className="mt-3 flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#d8e2ff] text-xs font-black text-[#153557]">
                {initials(user.fullName)}
              </span>
              <div className="min-w-0">
                <p className="truncate text-xs font-black text-[#25384f]">
                  {user.fullName}
                </p>
                <p className="mt-0.5 truncate text-[10px] text-[#788496]">
                  {user.collegeName}
                </p>
              </div>
            </div>
            <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-[#e5eeff] px-2 py-1 text-[10px] font-black text-[#153557]">
              <ShieldCheck aria-hidden="true" className="h-3 w-3" />
              {user.trustScore}/100
            </span>
          </div>

          <button
            className="mt-4 h-10 w-full cursor-default rounded-lg bg-[#031635] text-xs font-bold text-white"
            disabled
            type="button"
          >
            View details
          </button>
        </div>
      </article>
    </section>
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
