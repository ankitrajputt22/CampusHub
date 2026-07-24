import { BadgeCheck, CalendarDays, ShieldCheck, Star } from 'lucide-react';
import { Link } from 'react-router-dom';

import { resolveApiAssetUrl } from '../../../lib/apiClient';
import type { ProductSeller } from '../api/marketplaceApi';

export function SellerInfoCard({ seller }: { seller: ProductSeller }) {
  const photoUrl = resolveApiAssetUrl(seller.profilePhotoUrl);
  const trustScore = Math.max(0, Math.min(100, seller.trustScore));

  return (
    <section className="relative overflow-hidden rounded-2xl border border-[#dce2eb] bg-white p-5 shadow-[0_4px_18px_rgba(3,22,53,0.05)] sm:p-6">
      <span
        aria-hidden="true"
        className="absolute -right-10 -top-12 h-32 w-32 rounded-full bg-cyan-50"
      />
      <div className="relative">
        <p className="text-[11px] font-black uppercase tracking-[0.13em] text-[#007b95]">
          Seller information
        </p>

        <div className="mt-3 flex min-w-0 items-center gap-3">
          {photoUrl ? (
            <img
              alt={`${seller.fullName} profile`}
              className="h-14 w-14 shrink-0 rounded-full border-2 border-white object-cover shadow-sm ring-1 ring-[#d8e0ea]"
              src={photoUrl}
            />
          ) : (
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#d8e2ff] font-black text-[#153557] ring-1 ring-[#c2d0e6]">
              {initials(seller.fullName)}
            </span>
          )}
          <div className="min-w-0">
            <p className="truncate text-lg font-black text-[#10233d]">
              {seller.fullName}
            </p>
            {seller.verifiedStudent && (
              <p className="mt-1 flex items-center gap-1.5 text-xs font-bold text-emerald-700">
                <BadgeCheck aria-hidden="true" className="h-4 w-4" />
                Verified Student
              </p>
            )}
            <p className="mt-1 truncate text-xs font-semibold text-[#657387]">
              {seller.collegeName}
            </p>
          </div>
        </div>

        {(seller.department || seller.yearOfStudy) && (
          <p className="mt-2 pl-[4.25rem] text-xs text-[#657387]">
            {[seller.department, seller.yearOfStudy]
              .filter(Boolean)
              .join(' · ')}
          </p>
        )}

        <div className="mt-5 grid gap-4 rounded-xl border border-emerald-100 bg-emerald-50/70 p-4 sm:grid-cols-[112px_minmax(0,1fr)] sm:items-center">
          <div className="flex flex-col items-center sm:border-r sm:border-emerald-200 sm:pr-4">
            <div
              aria-label={`Campus Trust Score ${trustScore} out of 100`}
              className="relative h-20 w-20 rounded-full"
              role="img"
              style={{
                background: `conic-gradient(#10b981 ${trustScore * 3.6}deg, #dbe7e3 0deg)`,
              }}
            >
              <div className="absolute inset-[6px] flex flex-col items-center justify-center rounded-full bg-white">
                <strong className="text-xl font-black leading-none text-emerald-800">
                  {trustScore}
                </strong>
                <span className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.08em] text-emerald-700">
                  Trust
                </span>
              </div>
            </div>
            <p className="mt-2 text-center text-[11px] font-bold text-emerald-800">
              {seller.trustLevel}
            </p>
          </div>

          <dl className="grid grid-cols-2 gap-2 text-sm">
            <SellerStat
              label="Rating"
              value={
                seller.totalReviews > 0
                  ? `${seller.averageRating.toFixed(1)}/5`
                  : 'No ratings yet'
              }
            />
            <SellerStat
              label="Successful deals"
              value={seller.successfulDeals.toLocaleString('en-IN')}
            />
            <SellerStat
              label="Reviews"
              value={seller.totalReviews.toLocaleString('en-IN')}
            />
            <SellerStat
              icon={<CalendarDays className="h-3.5 w-3.5" />}
              label="Member since"
              value={new Intl.DateTimeFormat('en-IN', {
                month: 'short',
                year: 'numeric',
              }).format(new Date(seller.memberSince))}
            />
          </dl>
        </div>

        <Link
          className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#b8c4d3] text-sm font-bold text-[#153557] hover:border-[#007b95] hover:bg-cyan-50 hover:text-[#007b95]"
          to={`/user/public-profile/${seller.id}`}
        >
          <ShieldCheck aria-hidden="true" className="h-4 w-4" />
          View seller profile
        </Link>
      </div>
    </section>
  );
}

function SellerStat({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-lg bg-white/90 px-3 py-2.5 shadow-sm">
      <dt className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.1em] text-[#788496]">
        {icon ?? (label === 'Rating' ? <Star className="h-3.5 w-3.5" /> : null)}
        {label}
      </dt>
      <dd className="mt-1.5 text-xs font-black text-[#21344c] sm:text-sm">
        {value}
      </dd>
    </div>
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
