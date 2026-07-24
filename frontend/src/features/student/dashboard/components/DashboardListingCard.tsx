import {
  Bike,
  BookOpen,
  Calculator,
  LampDesk,
  PackageOpen,
  ShieldCheck,
} from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

import type { DashboardListing } from '../types';

export function DashboardListingCard({
  listing,
}: {
  listing: DashboardListing;
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const VisualIcon = listingIcon(listing.category, listing.title);
  const showImage = Boolean(listing.imageUrl) && !imageFailed;

  return (
    <article className="group flex min-w-0 flex-col overflow-hidden rounded-xl border border-[#c5c6cf] bg-white transition duration-200 hover:-translate-y-0.5 hover:border-[#8293b8] hover:shadow-[0_10px_24px_rgba(3,22,53,0.10)]">
      <div className="relative h-48 overflow-hidden bg-[#e5eeff]">
        {showImage ? (
          <img
            alt={listing.title}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.025]"
            onError={() => setImageFailed(true)}
            src={listing.imageUrl ?? ''}
          />
        ) : (
          <div className="dashboard-product-visual flex h-full w-full items-center justify-center">
            <VisualIcon
              aria-hidden="true"
              className="relative h-16 w-16 text-[#364768]"
              strokeWidth={1.25}
            />
          </div>
        )}
        <span className="absolute left-3 top-3 rounded-md bg-white/95 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.08em] text-[#031635] shadow-sm">
          {listing.category}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-1 font-display text-lg font-bold text-[#031635]">
          {listing.title}
        </h3>
        <p className="mt-1 text-sm text-[#5d6470]">{listing.condition}</p>

        <div className="mt-5 flex items-center justify-between gap-3">
          <p className="font-display text-xl font-extrabold text-[#6f83af]">
            {formatPrice(listing.price)}
          </p>
          <span className="inline-flex items-center gap-1 rounded-md bg-[#e5eeff] px-2 py-1 text-[11px] font-bold text-[#081b3a]">
            <ShieldCheck
              aria-hidden="true"
              className="h-3.5 w-3.5 text-[#00875f]"
            />
            {listing.sellerTrustScore}
          </span>
        </div>

        <div className="mt-3 min-w-0 border-t border-[#edf0f5] pt-3">
          <p className="truncate text-xs font-semibold text-[#27374c]">
            {listing.sellerName}
          </p>
          <p className="mt-0.5 text-[11px] text-[#75777f]">
            Posted {formatPostedDate(listing.postedDate)}
          </p>
        </div>

        <Link
          className="mt-4 inline-flex h-11 items-center justify-center rounded-lg border border-[#031635] text-sm font-semibold text-[#031635] hover:bg-[#031635] hover:text-white"
          state={{ listingId: listing.id, listingTitle: listing.title }}
          to="/student/chat"
        >
          Interested
        </Link>
      </div>
    </article>
  );
}

function listingIcon(category: string, title: string) {
  const searchable = `${category} ${title}`.toLowerCase();
  if (searchable.includes('book')) return BookOpen;
  if (searchable.includes('bicycle') || searchable.includes('cycle')) {
    return Bike;
  }
  if (searchable.includes('calculator')) return Calculator;
  if (
    searchable.includes('lamp') ||
    searchable.includes('hostel') ||
    searchable.includes('dorm')
  ) {
    return LampDesk;
  }
  return PackageOpen;
}

function formatPrice(price: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(price);
}

function formatPostedDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'recently';
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
  }).format(date);
}
