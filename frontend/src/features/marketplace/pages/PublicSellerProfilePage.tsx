import { isAxiosError } from 'axios';
import {
  ArrowLeft,
  BadgeCheck,
  Github,
  Flag,
  Linkedin,
  PackageCheck,
  RefreshCw,
  ShieldCheck,
  Star,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { resolveApiAssetUrl } from '../../../lib/apiClient';
import { getApiErrorMessage } from '../../auth/api/authApi';
import {
  reportUser,
  type ReportReason,
  type UserReportReason,
} from '../../reports/api/reportsApi';
import { ReportEntityModal } from '../../reports/components/ReportEntityModal';
import { getCampusUser } from '../../student/lib/session';
import {
  getPublicSellerProfile,
  type PublicSellerProfile,
} from '../api/marketplaceApi';

export function PublicSellerProfilePage() {
  const { sellerId: sellerIdParam } = useParams();
  const sellerId = Number(sellerIdParam);
  const [profile, setProfile] = useState<PublicSellerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [reportOpen, setReportOpen] = useState(false);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    if (!Number.isInteger(sellerId) || sellerId < 1) {
      setError('This seller profile link is invalid.');
      setLoading(false);
      return () => controller.abort();
    }
    setLoading(true);
    setError(null);
    void getPublicSellerProfile(sellerId, controller.signal)
      .then(setProfile)
      .catch((requestError: unknown) => {
        if (!controller.signal.aborted) {
          setProfile(null);
          setError(apiErrorMessage(requestError));
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [reloadKey, sellerId]);

  if (loading) {
    return (
      <div
        aria-label="Loading seller profile"
        className="mx-auto max-w-4xl animate-pulse space-y-5"
        role="status"
      >
        <div className="h-52 rounded-2xl bg-white" />
        <div className="h-72 rounded-2xl bg-white" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-rose-200 bg-white px-6 py-14 text-center">
        <RefreshCw className="mx-auto h-8 w-8 text-rose-600" />
        <h1 className="mt-4 text-xl font-black text-[#071b33]">
          Seller profile unavailable
        </h1>
        <p className="mt-2 text-sm text-[#667386]">{error}</p>
        <button
          className="mt-5 rounded-xl bg-[#031635] px-5 py-3 text-sm font-bold text-white"
          onClick={() => setReloadKey((current) => current + 1)}
          type="button"
        >
          Try again
        </button>
      </div>
    );
  }

  const photoUrl = resolveApiAssetUrl(profile.profilePhotoUrl);
  const ownProfile = getCampusUser().id === profile.id;
  const profileId = profile.id;

  async function submitReport(reason: ReportReason, description: string) {
    try {
      await reportUser(profileId, reason as UserReportReason, description);
      setNotice('Report submitted. You can track its status in My Reports.');
    } catch (caught) {
      throw new Error(getApiErrorMessage(caught));
    }
  }

  return (
    <div className="mx-auto max-w-5xl pb-10">
      <Link
        className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-[#007b95]"
        to="/student/marketplace"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to marketplace
      </Link>

      {notice && (
        <div
          className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800"
          role="status"
        >
          {notice}
        </div>
      )}

      <section className="overflow-hidden rounded-2xl border border-[#dce2eb] bg-white shadow-sm">
        <div className="h-28 bg-[#031635]" />
        <div className="-mt-10 flex flex-col gap-4 px-5 pb-6 sm:flex-row sm:items-end sm:px-7">
          {photoUrl ? (
            <img
              alt={`${profile.fullName} profile`}
              className="h-24 w-24 rounded-full border-4 border-white object-cover shadow-md"
              src={photoUrl}
            />
          ) : (
            <span className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-white bg-[#d8e2ff] text-xl font-black text-[#153557] shadow-md">
              {initials(profile.fullName)}
            </span>
          )}
          <div className="min-w-0 flex-1 pb-1">
            <h1 className="text-2xl font-black text-[#071b33]">
              {profile.fullName}
            </h1>
            <p className="mt-1 flex items-center gap-2 text-sm font-bold text-emerald-700">
              <BadgeCheck className="h-4 w-4" />
              Verified Student
            </p>
            <p className="mt-2 text-sm text-[#667386]">{profile.collegeName}</p>
          </div>
          {!ownProfile && (
            <button
              className="mb-1 inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-rose-200 bg-white px-4 text-sm font-bold text-rose-700 hover:bg-rose-50"
              onClick={() => setReportOpen(true)}
              type="button"
            >
              <Flag aria-hidden="true" className="h-4 w-4" />
              Report student
            </button>
          )}
        </div>
      </section>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_320px]">
        <section className="rounded-2xl border border-[#dce2eb] bg-white p-5 sm:p-6">
          <h2 className="font-black text-[#10233d]">About the seller</h2>
          <p className="mt-3 text-sm leading-7 text-[#5f6d80]">
            {profile.bio || 'This student has not added a public bio yet.'}
          </p>
          {(profile.department || profile.yearOfStudy) && (
            <p className="mt-5 rounded-xl bg-[#f5f8fc] px-4 py-3 text-sm font-semibold text-[#344861]">
              {[profile.department, profile.yearOfStudy]
                .filter(Boolean)
                .join(' · ')}
            </p>
          )}
          <div className="mt-5 flex flex-wrap gap-3">
            {profile.linkedinUrl && (
              <a
                className="inline-flex items-center gap-2 rounded-xl border border-[#c3ccd8] px-4 py-2 text-sm font-bold text-[#263a52]"
                href={profile.linkedinUrl}
                rel="noreferrer"
                target="_blank"
              >
                <Linkedin className="h-4 w-4" />
                LinkedIn
              </a>
            )}
            {profile.githubUrl && (
              <a
                className="inline-flex items-center gap-2 rounded-xl border border-[#c3ccd8] px-4 py-2 text-sm font-bold text-[#263a52]"
                href={profile.githubUrl}
                rel="noreferrer"
                target="_blank"
              >
                <Github className="h-4 w-4" />
                GitHub
              </a>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-[#dce2eb] bg-white p-5">
          <h2 className="flex items-center gap-2 font-black text-[#10233d]">
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
            Seller reputation
          </h2>
          <div className="mt-4 rounded-xl bg-emerald-50 p-4">
            <strong className="text-2xl font-black text-emerald-800">
              {profile.trustScore}/100
            </strong>
            <p className="mt-1 text-xs font-bold text-emerald-700">
              {profile.trustLevel}
            </p>
          </div>
          <dl className="mt-4 space-y-3">
            <ProfileStat
              icon={<Star className="h-4 w-4" />}
              label="Rating"
              value={
                profile.totalReviews > 0
                  ? `${profile.averageRating.toFixed(1)}/5`
                  : 'No ratings'
              }
            />
            <ProfileStat
              icon={<PackageCheck className="h-4 w-4" />}
              label="Successful deals"
              value={profile.successfulDeals.toString()}
            />
            <ProfileStat
              label="Active listings"
              value={profile.activeListings.toString()}
            />
          </dl>
        </section>
      </div>
      <ReportEntityModal
        onClose={() => setReportOpen(false)}
        onSubmit={submitReport}
        open={reportOpen}
        targetName={profile.fullName}
        type="USER"
      />
    </div>
  );
}

function ProfileStat({
  icon,
  label,
  value,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-[#f6f8fc] px-3 py-3 text-sm">
      <dt className="flex items-center gap-2 text-[#667386]">
        {icon}
        {label}
      </dt>
      <dd className="font-black text-[#21344c]">{value}</dd>
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

function apiErrorMessage(error: unknown) {
  if (isAxiosError<{ message?: string }>(error)) {
    return (
      error.response?.data?.message ??
      'Unable to load this seller profile. Please try again.'
    );
  }
  return 'Unable to load this seller profile. Please try again.';
}
