import {
  BadgeCheck,
  CheckCircle2,
  GraduationCap,
  Heart,
  LockKeyhole,
  Mail,
  PackageCheck,
  Phone,
  ShieldCheck,
  ShoppingBag,
  Star,
  Store,
  UserRound,
} from 'lucide-react';
import { Link } from 'react-router-dom';

import type { StudentProfile } from '../types';

export function LockedVerifiedDetails({
  profile,
}: {
  profile: StudentProfile;
}) {
  return (
    <section
      className="scroll-mt-28 rounded-2xl border border-[#c9d7ed] bg-[#eff4ff] p-5 shadow-[0_3px_12px_rgba(3,22,53,0.04)] sm:p-6"
      id="profile-verified"
    >
      <div className="flex items-start gap-3 border-b border-[#e6e8ee] pb-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#eef1f7] text-[#364768]">
          <LockKeyhole aria-hidden="true" className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-display text-xl font-bold text-[#031635]">
              Verified identity
            </h2>
            <span className="rounded-full bg-[#eef1f7] px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-[#536079]">
              Locked
            </span>
          </div>
          <p className="mt-1 text-sm leading-5 text-[#68707d]">
            Security-controlled details cannot be changed from your profile.
          </p>
        </div>
      </div>

      <dl className="mt-5 grid gap-3 sm:grid-cols-2">
        <LockedDetail
          icon={GraduationCap}
          label="College"
          value={profile.college.name}
        />
        <LockedDetail
          icon={Mail}
          label="College email"
          verified={profile.isEmailVerified}
          value={profile.email}
        />
        <LockedDetail
          icon={Phone}
          label="Phone number"
          verified={profile.isPhoneVerified}
          value={profile.phoneNumber}
        />
        <LockedDetail icon={UserRound} label="Role" value={profile.role} />
        <LockedDetail
          icon={BadgeCheck}
          label="Account status"
          value={profile.accountStatus}
        />
        <LockedDetail
          icon={ShieldCheck}
          label="Campus Trust Score"
          value={`${profile.trustScore.score}/100 · ${profile.trustScore.level}`}
        />
      </dl>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <VerificationBadge
          label="College email verified"
          verified={profile.isEmailVerified}
        />
        <VerificationBadge
          label="Phone verified"
          verified={profile.isPhoneVerified}
        />
        <VerificationBadge
          label="Verified Student"
          verified={profile.isVerifiedStudent}
        />
      </div>
    </section>
  );
}

export function ReviewsAndMarketplace({
  profile,
}: {
  profile: StudentProfile;
}) {
  return (
    <div className="grid gap-6 2xl:grid-cols-2">
      <section
        className="scroll-mt-28 rounded-2xl border border-[#d6d9e2] bg-white p-5 shadow-[0_3px_12px_rgba(3,22,53,0.04)] sm:p-6"
        id="profile-reputation"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-xl font-bold text-[#031635]">
              Reviews & ratings
            </h2>
            <p className="mt-1 text-sm text-[#68707d]">
              Only reviews from completed orders are counted.
            </p>
          </div>
          <div className="text-right">
            <p className="flex items-center justify-end gap-1 font-display text-2xl font-black text-[#031635]">
              <Star
                aria-hidden="true"
                className="h-5 w-5 fill-amber-400 text-amber-400"
              />
              {profile.sellerStats.averageRating.toFixed(1)}
            </p>
            <p className="text-xs text-[#68707d]">
              {profile.sellerStats.totalReviews}{' '}
              {profile.sellerStats.totalReviews === 1 ? 'review' : 'reviews'}
            </p>
          </div>
        </div>

        {profile.latestReviews.length ? (
          <div className="mt-5 divide-y divide-[#e6e8ee]">
            {profile.latestReviews.map((review) => (
              <article className="py-4 first:pt-0" key={review.id}>
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-[#263346]">
                    {review.reviewerName}
                  </p>
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700">
                    <Star
                      aria-hidden="true"
                      className="h-3.5 w-3.5 fill-amber-400 text-amber-400"
                    />
                    {review.rating}/5
                  </span>
                </div>
                <p className="mt-2 text-sm leading-6 text-[#44474e]">
                  “{review.message}”
                </p>
                <p className="mt-2 text-xs text-[#858993]">
                  {new Intl.DateTimeFormat('en-IN', {
                    dateStyle: 'medium',
                  }).format(new Date(review.reviewDate))}
                </p>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-5 rounded-xl border border-dashed border-[#c5c6cf] bg-[#f8f9ff] px-5 py-8 text-center">
            <Star
              aria-hidden="true"
              className="mx-auto h-8 w-8 text-[#8293b8]"
            />
            <p className="mt-3 font-semibold text-[#263346]">No reviews yet</p>
            <p className="mt-1 text-sm leading-5 text-[#68707d]">
              Completed order reviews will build your seller reputation here.
            </p>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-[#d6d9e2] bg-white p-5 shadow-[0_3px_12px_rgba(3,22,53,0.04)] sm:p-6">
        <h2 className="font-display text-xl font-bold text-[#031635]">
          My marketplace summary
        </h2>
        <p className="mt-1 text-sm text-[#68707d]">
          A quick view of your activity across Campus Hub.
        </p>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <MarketplaceStat
            icon={Store}
            label="Active listings"
            value={profile.sellerStats.activeListings}
          />
          <MarketplaceStat
            icon={PackageCheck}
            label="Sold items"
            value={profile.sellerStats.soldItems}
          />
          <MarketplaceStat
            icon={ShoppingBag}
            label="Orders completed"
            value={profile.sellerStats.ordersCompleted}
          />
          <MarketplaceStat
            icon={Heart}
            label="Wishlist items"
            value={profile.sellerStats.wishlistItems}
          />
        </div>
        {profile.sellerStats.activeListings === 0 && (
          <p className="mt-4 rounded-lg bg-[#eff4ff] px-3 py-2 text-sm text-[#536079]">
            No active listings yet.
          </p>
        )}
        <Link
          className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-lg bg-[#1a3153] px-4 text-sm font-bold text-white hover:bg-[#031635]"
          to="/student/my-marketplace"
        >
          Go to My Marketplace
        </Link>
      </section>
    </div>
  );
}

function LockedDetail({
  label,
  value,
  icon: Icon,
  verified,
}: {
  label: string;
  value: string;
  icon: typeof Mail;
  verified?: boolean;
}) {
  return (
    <div className="rounded-xl border border-[#d6ddea] bg-white px-4 py-3">
      <dt className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.06em] text-[#68707d]">
        <Icon aria-hidden="true" className="h-3.5 w-3.5" />
        {label}
      </dt>
      <dd className="mt-2 flex min-w-0 items-center gap-2">
        <span className="min-w-0 break-words text-sm font-semibold text-[#263346]">
          {value}
        </span>
        {verified && (
          <CheckCircle2
            aria-label="Verified"
            className="h-4 w-4 shrink-0 text-emerald-600"
          />
        )}
      </dd>
    </div>
  );
}

function VerificationBadge({
  label,
  verified,
}: {
  label: string;
  verified: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-2 rounded-xl px-3 py-3 text-xs font-bold ${
        verified ? 'bg-[#d9fbe9] text-[#075d3b]' : 'bg-amber-50 text-amber-800'
      }`}
    >
      {verified ? (
        <CheckCircle2 aria-hidden="true" className="h-4 w-4" />
      ) : (
        <ShieldCheck aria-hidden="true" className="h-4 w-4" />
      )}
      {verified ? label : label.replace('verified', 'not verified')}
    </div>
  );
}

function MarketplaceStat({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: typeof Store;
}) {
  return (
    <div className="rounded-xl bg-[#eff4ff] p-4">
      <div className="flex items-center justify-between gap-2">
        <Icon aria-hidden="true" className="h-5 w-5 text-[#536079]" />
        <span className="font-display text-2xl font-black text-[#031635]">
          {value}
        </span>
      </div>
      <p className="mt-2 text-xs font-semibold text-[#536079]">{label}</p>
    </div>
  );
}
