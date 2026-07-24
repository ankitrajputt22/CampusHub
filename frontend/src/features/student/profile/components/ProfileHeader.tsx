import {
  Camera,
  CheckCircle2,
  GraduationCap,
  MapPin,
  ShieldCheck,
} from 'lucide-react';
import { useRef, useState } from 'react';

import { resolveApiAssetUrl } from '../../../../lib/apiClient';
import type { StudentProfile } from '../types';

const acceptedPhotoTypes = ['image/jpeg', 'image/png', 'image/webp'];

export function ProfileHeader({
  profile,
  onPhotoSelected,
}: {
  profile: StudentProfile;
  onPhotoSelected: (file: File) => Promise<void>;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [photoError, setPhotoError] = useState('');
  const [uploading, setUploading] = useState(false);
  const photoUrl = resolveApiAssetUrl(profile.profilePhotoUrl);

  async function selectPhoto(file?: File) {
    if (!file) return;
    setPhotoError('');
    if (!acceptedPhotoTypes.includes(file.type)) {
      setPhotoError('Only JPG, JPEG, PNG, and WEBP image files are allowed.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setPhotoError('Profile photo size should be less than 2 MB.');
      return;
    }
    setUploading(true);
    try {
      await onPhotoSelected(file);
    } catch (error) {
      setPhotoError(
        error instanceof Error
          ? error.message
          : 'Unable to update profile photo.',
      );
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <section
      className="scroll-mt-28 overflow-hidden rounded-2xl border border-[#c9d7ed] bg-white shadow-[0_8px_30px_rgba(3,22,53,0.06)]"
      id="profile-overview"
    >
      <div className="h-24 bg-[linear-gradient(115deg,#031635_0%,#1a3153_55%,#00677f_100%)] sm:h-32" />
      <div className="px-5 pb-6 sm:px-7">
        <div className="-mt-12 flex flex-col gap-5 sm:-mt-14 sm:flex-row sm:items-end">
          <div
            className="relative w-fit shrink-0 scroll-mt-28"
            id="profile-photo"
          >
            {photoUrl ? (
              <img
                alt={`${profile.fullName} profile`}
                className="h-28 w-28 rounded-2xl border-4 border-white bg-[#e5eeff] object-cover shadow-md sm:h-32 sm:w-32"
                src={photoUrl}
              />
            ) : (
              <div
                aria-label={`${profile.fullName} profile avatar`}
                className="flex h-28 w-28 items-center justify-center rounded-2xl border-4 border-white bg-[#d8e2ff] font-display text-3xl font-black text-[#031635] shadow-md sm:h-32 sm:w-32"
              >
                {initials(profile.fullName)}
              </div>
            )}
            <input
              accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
              aria-label="Select profile photo"
              className="sr-only"
              disabled={uploading}
              onChange={(event) => void selectPhoto(event.target.files?.[0])}
              ref={inputRef}
              type="file"
            />
            <button
              aria-label="Change profile photo"
              className="absolute -bottom-2 -right-2 flex h-10 w-10 items-center justify-center rounded-xl border-2 border-white bg-[#00ccf9] text-[#003846] shadow-md transition hover:brightness-105 disabled:cursor-wait disabled:opacity-70"
              disabled={uploading}
              onClick={() => inputRef.current?.click()}
              title="Change profile photo"
              type="button"
            >
              <Camera aria-hidden="true" className="h-[18px] w-[18px]" />
            </button>
          </div>

          <div className="min-w-0 flex-1 pb-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-display text-3xl font-extrabold tracking-[-0.025em] text-[#031635]">
                {profile.fullName}
              </h2>
              {profile.isVerifiedStudent && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#d9fbe9] px-3 py-1 text-xs font-bold text-[#075d3b]">
                  <ShieldCheck aria-hidden="true" className="h-4 w-4" />
                  Verified Student
                </span>
              )}
            </div>
            <p className="mt-2 flex items-start gap-2 text-sm text-[#44474e]">
              <MapPin
                aria-hidden="true"
                className="mt-0.5 h-4 w-4 shrink-0 text-[#00677f]"
              />
              {profile.college.name}
            </p>
            <p className="mt-1.5 flex items-center gap-2 text-sm text-[#44474e]">
              <GraduationCap
                aria-hidden="true"
                className="h-4 w-4 shrink-0 text-[#00677f]"
              />
              {profile.department} · {profile.yearOfStudy}
            </p>
          </div>

          <div className="grid shrink-0 grid-cols-2 gap-3 sm:min-w-64">
            <Metric
              label="Trust Score"
              tone={trustTone(profile.trustScore.score)}
              value={`${profile.trustScore.score}/100`}
              valueNumber={profile.trustScore.score}
            />
            <Metric
              label="Profile"
              tone="#00a7cd"
              value={`${profile.profileCompletion.percentage}%`}
              valueNumber={profile.profileCompletion.percentage}
            />
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[#e6e8ee] pt-4">
          <p className="flex items-center gap-2 text-xs text-[#68707d]">
            <CheckCircle2
              aria-hidden="true"
              className="h-4 w-4 text-[#00875a]"
            />
            JPG, PNG or WEBP · maximum 2 MB
          </p>
          <button
            className="text-xs font-bold text-[#00677f] hover:underline"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
            type="button"
          >
            {uploading
              ? 'Uploading photo…'
              : photoUrl
                ? 'Change profile photo'
                : 'Add profile photo'}
          </button>
        </div>
        {photoError && (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {photoError}
          </p>
        )}
      </div>
    </section>
  );
}

function Metric({
  label,
  value,
  valueNumber,
  tone,
}: {
  label: string;
  value: string;
  valueNumber: number;
  tone: string;
}) {
  return (
    <div className="rounded-xl bg-[#eff4ff] px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#68707d]">
        {label}
      </p>
      <p className="mt-1 font-display text-xl font-black text-[#031635]">
        {value}
      </p>
      <div
        aria-label={`${label} ${valueNumber} percent`}
        aria-valuemax={100}
        aria-valuemin={0}
        aria-valuenow={valueNumber}
        className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#d8e2f4]"
        role="progressbar"
      >
        <div
          className="h-full rounded-full transition-all"
          style={{ backgroundColor: tone, width: `${valueNumber}%` }}
        />
      </div>
    </div>
  );
}

function trustTone(score: number) {
  if (score <= 40) return '#dc2626';
  if (score <= 70) return '#d97706';
  return '#00875a';
}

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}
