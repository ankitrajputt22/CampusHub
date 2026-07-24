import {
  Armchair,
  Bike,
  BookOpen,
  Boxes,
  FileText,
  FlaskConical,
  Headphones,
  LampDesk,
  PackageOpen,
  Pencil,
  Shirt,
} from 'lucide-react';
import { useEffect, useState } from 'react';

import { resolveApiAssetUrl } from '../../../lib/apiClient';
import type { MarketplaceListing } from '../api/marketplaceApi';

const categoryVisuals = {
  Books: { icon: BookOpen, tone: 'bg-amber-100 text-amber-800' },
  Notes: { icon: FileText, tone: 'bg-sky-100 text-sky-800' },
  Electronics: { icon: Headphones, tone: 'bg-violet-100 text-violet-800' },
  Bicycles: { icon: Bike, tone: 'bg-emerald-100 text-emerald-800' },
  'Hostel Essentials': {
    icon: LampDesk,
    tone: 'bg-slate-200 text-slate-700',
  },
  Furniture: { icon: Armchair, tone: 'bg-rose-100 text-rose-800' },
  'Lab Equipment': {
    icon: FlaskConical,
    tone: 'bg-cyan-100 text-cyan-800',
  },
  Stationery: { icon: Pencil, tone: 'bg-orange-100 text-orange-800' },
  Clothing: { icon: Shirt, tone: 'bg-fuchsia-100 text-fuchsia-800' },
  Others: { icon: Boxes, tone: 'bg-blue-100 text-blue-800' },
};

export function MarketplaceProductVisual({
  listing,
  compact = false,
}: {
  listing: Pick<MarketplaceListing, 'title' | 'category' | 'primaryImageUrl'>;
  compact?: boolean;
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const imageUrl = resolveApiAssetUrl(listing.primaryImageUrl);
  const visual = categoryVisuals[
    listing.category as keyof typeof categoryVisuals
  ] ?? {
    icon: PackageOpen,
    tone: 'bg-blue-100 text-blue-800',
  };
  const Icon = visual.icon;

  useEffect(() => {
    setImageFailed(false);
  }, [imageUrl]);

  if (imageUrl && !imageFailed) {
    return (
      <img
        alt={listing.title}
        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        loading="lazy"
        onError={() => setImageFailed(true)}
        src={imageUrl}
      />
    );
  }

  return (
    <div
      aria-label={`${listing.title} preview`}
      className={`marketplace-product-visual relative flex h-full w-full items-center justify-center overflow-hidden ${visual.tone}`}
      role="img"
    >
      <Icon
        aria-hidden="true"
        className={`relative z-10 drop-shadow-sm ${
          compact ? 'h-9 w-9' : 'h-16 w-16 sm:h-20 sm:w-20'
        }`}
        strokeWidth={1.45}
      />
    </div>
  );
}
