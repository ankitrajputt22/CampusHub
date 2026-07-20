import {
  Armchair,
  Bike,
  BookOpen,
  Calculator,
  FlaskConical,
  Headphones,
  LampDesk,
  Laptop,
} from 'lucide-react';

import type { Listing } from '../data/mockData';

const iconByVisual = {
  books: BookOpen,
  bicycle: Bike,
  laptop: Laptop,
  furniture: Armchair,
  audio: Headphones,
  lab: FlaskConical,
  calculator: Calculator,
  hostel: LampDesk,
};

const accentClasses = {
  cyan: 'bg-cyan-100 text-cyan-800',
  yellow: 'bg-amber-100 text-amber-800',
  blue: 'bg-blue-100 text-blue-800',
  rose: 'bg-rose-100 text-rose-800',
  violet: 'bg-violet-100 text-violet-800',
  green: 'bg-emerald-100 text-emerald-800',
  orange: 'bg-orange-100 text-orange-800',
  slate: 'bg-slate-200 text-slate-700',
};

export function ProductVisual({
  listing,
  compact = false,
}: {
  listing: Listing;
  compact?: boolean;
}) {
  const Icon = iconByVisual[listing.visual];

  return (
    <div
      aria-label={`${listing.title} preview`}
      className={`relative flex h-full w-full items-center justify-center overflow-hidden ${accentClasses[listing.accent]}`}
      role="img"
    >
      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-white/25" />
      <div className="absolute left-[12%] top-[14%] h-3 w-3 rounded-full bg-current opacity-15" />
      <div className="absolute right-[12%] top-[18%] h-10 w-10 rounded-full border-2 border-current opacity-10" />
      <Icon
        aria-hidden="true"
        className={`relative drop-shadow-sm ${compact ? 'h-9 w-9' : 'h-16 w-16 sm:h-20 sm:w-20'}`}
        strokeWidth={1.45}
      />
    </div>
  );
}
