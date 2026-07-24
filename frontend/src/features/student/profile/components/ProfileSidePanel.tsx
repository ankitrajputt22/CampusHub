import {
  ArrowRight,
  Check,
  CheckCircle2,
  CircleAlert,
  Eye,
  EyeOff,
  Github,
  Globe2,
  HeartHandshake,
  Linkedin,
  LoaderCircle,
  LockKeyhole,
  MapPin,
  ShieldCheck,
  Sparkles,
  Star,
} from 'lucide-react';
import { useEffect, useState } from 'react';

import { getApiErrorMessage } from '../../../auth/api/authApi';
import { resolveApiAssetUrl } from '../../../../lib/apiClient';
import type { ProfilePrivacySettings, StudentProfile } from '../types';

export function ProfileSidePanel({
  profile,
  onPrivacySave,
}: {
  profile: StudentProfile;
  onPrivacySave: (settings: ProfilePrivacySettings) => Promise<void>;
}) {
  const [privacy, setPrivacy] = useState(profile.privacySettings);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<
    { tone: 'success' | 'error'; text: string } | undefined
  >();

  useEffect(() => {
    setPrivacy(profile.privacySettings);
  }, [profile.privacySettings]);

  const privacyChanged = privacySettingsChanged(
    privacy,
    profile.privacySettings,
  );

  function changePrivacy(key: keyof ProfilePrivacySettings, checked: boolean) {
    setMessage(undefined);
    setPrivacy((current) => ({ ...current, [key]: checked }));
  }

  async function savePrivacy() {
    setSaving(true);
    setMessage(undefined);
    try {
      await onPrivacySave(privacy);
      setMessage({
        tone: 'success',
        text: 'Privacy settings updated successfully.',
      });
    } catch (error) {
      setMessage({ tone: 'error', text: getApiErrorMessage(error) });
    } finally {
      setSaving(false);
    }
  }

  return (
    <aside className="space-y-6">
      <TrustScoreCard profile={profile} />
      <ProfileCompletionCard profile={profile} />
      <PublicProfilePreview privacy={privacy} profile={profile} />
      <section
        className="scroll-mt-28 rounded-2xl border border-[#d6d9e2] bg-white p-5 shadow-[0_3px_12px_rgba(3,22,53,0.04)]"
        id="profile-privacy"
      >
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#e5eeff] text-[#364768]">
            <LockKeyhole aria-hidden="true" className="h-5 w-5" />
          </span>
          <div>
            <h2 className="font-display text-xl font-bold text-[#031635]">
              Privacy controls
            </h2>
            <p className="mt-1 text-sm leading-5 text-[#68707d]">
              Choose what other verified students can see.
            </p>
          </div>
        </div>

        <div className="mt-5 divide-y divide-[#e6e8ee]">
          <PrivacyToggle
            checked={privacy.showBio}
            label="Show bio publicly"
            onChange={(checked) => changePrivacy('showBio', checked)}
          />
          <PrivacyToggle
            checked={privacy.showLinkedin}
            label="Show LinkedIn publicly"
            onChange={(checked) => changePrivacy('showLinkedin', checked)}
          />
          <PrivacyToggle
            checked={privacy.showGithub}
            label="Show GitHub publicly"
            onChange={(checked) => changePrivacy('showGithub', checked)}
          />
          <PrivacyToggle
            checked={privacy.showHostelArea}
            label="Show hostel / campus area"
            onChange={(checked) => changePrivacy('showHostelArea', checked)}
          />
          <PrivacyToggle
            checked={privacy.showDepartment}
            label="Show department / branch"
            onChange={(checked) => changePrivacy('showDepartment', checked)}
          />
          <PrivacyToggle
            checked={privacy.showYearOfStudy}
            label="Show year of study"
            onChange={(checked) => changePrivacy('showYearOfStudy', checked)}
          />
        </div>

        <div className="mt-4 rounded-xl bg-[#fff7e6] px-3 py-3 text-xs leading-5 text-[#705100]">
          <strong>Always public:</strong> your name, college, verification,
          trust score, rating, reviews, and active listings.
        </div>
        {message && (
          <p
            className={`mt-4 flex items-start gap-2 rounded-lg px-3 py-2 text-xs ${
              message.tone === 'success'
                ? 'bg-emerald-50 text-emerald-800'
                : 'bg-red-50 text-red-700'
            }`}
            role="status"
          >
            {message.tone === 'success' && (
              <Check aria-hidden="true" className="mt-0.5 h-3.5 w-3.5" />
            )}
            {message.text}
          </p>
        )}
        <button
          className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#031635] px-4 text-sm font-bold text-white hover:bg-[#1a3153] disabled:cursor-not-allowed disabled:opacity-50"
          disabled={saving || !privacyChanged}
          onClick={() => void savePrivacy()}
          type="button"
        >
          {saving && (
            <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />
          )}
          {saving ? 'Saving privacy…' : 'Save privacy settings'}
        </button>
      </section>
    </aside>
  );
}

function TrustScoreCard({ profile }: { profile: StudentProfile }) {
  const score = profile.trustScore.score;
  const scoreColor = trustScoreColor(score);
  return (
    <section className="rounded-2xl bg-[#1a3153] p-5 text-white shadow-[0_8px_25px_rgba(3,22,53,0.15)]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#9bbdf3]">
            Campus Trust Score
          </p>
          <h2 className="mt-1 font-display text-xl font-bold">
            {profile.trustScore.level}
          </h2>
        </div>
        <ShieldCheck aria-hidden="true" className="h-7 w-7 text-[#6ffbbe]" />
      </div>
      <div className="mt-5 flex items-center gap-5">
        <div
          aria-label={`Campus Trust Score ${score} out of 100`}
          className="grid h-24 w-24 shrink-0 place-items-center rounded-full"
          style={{
            background: `conic-gradient(${scoreColor} ${score * 3.6}deg, #314969 0deg)`,
          }}
        >
          <div className="grid h-20 w-20 place-items-center rounded-full bg-[#1a3153] text-center">
            <span className="font-display text-2xl font-black">{score}</span>
            <span className="-mt-4 text-[10px] text-[#b7c9e7]">/ 100</span>
          </div>
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold">Build more trust</p>
          <p className="mt-1 text-xs leading-5 text-[#c6d7f3]">
            Verification is locked. Profile and successful deals can improve
            your score.
          </p>
        </div>
      </div>
      <ul className="mt-5 space-y-2">
        {profile.trustScore.suggestions.slice(0, 3).map((suggestion) => (
          <li
            className="flex items-start justify-between gap-3 rounded-lg bg-white/[0.06] px-3 py-2 text-xs leading-5 text-[#dce8fb]"
            key={suggestion}
          >
            <span className="flex items-start gap-2">
              <Sparkles
                aria-hidden="true"
                className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#6ffbbe]"
              />
              {suggestion}
            </span>
            {trustPointValue(suggestion) && (
              <span className="shrink-0 rounded-full bg-[#6ffbbe] px-2 py-0.5 text-[10px] font-black text-[#003320]">
                {trustPointValue(suggestion)}
              </span>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

function ProfileCompletionCard({ profile }: { profile: StudentProfile }) {
  const completion = profile.profileCompletion;
  return (
    <section className="rounded-2xl border border-[#d6d9e2] bg-white p-5 shadow-[0_3px_12px_rgba(3,22,53,0.04)]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-bold text-[#031635]">
            Profile completion
          </h2>
          <p className="mt-1 text-xs text-[#68707d]">
            {completion.completedFields} of {completion.totalFields} trust
            signals complete
          </p>
        </div>
        <span className="font-display text-2xl font-black text-[#00677f]">
          {completion.percentage}%
        </span>
      </div>
      <div
        aria-label={`${completion.percentage}% profile completion`}
        aria-valuemax={100}
        aria-valuemin={0}
        aria-valuenow={completion.percentage}
        className="mt-4 h-2.5 overflow-hidden rounded-full bg-[#e5eeff]"
        role="progressbar"
      >
        <div
          className="h-full rounded-full bg-[linear-gradient(90deg,#00ccf9,#00875a)] transition-all"
          style={{ width: `${completion.percentage}%` }}
        />
      </div>
      {completion.missingFields.length ? (
        <div className="mt-5">
          <p className="text-xs font-bold uppercase tracking-[0.08em] text-[#68707d]">
            Complete next
          </p>
          <ul className="mt-3 space-y-2">
            {completion.missingFields.slice(0, 4).map((field) => {
              const action = completionAction(field);
              return (
                <li
                  className="flex items-center justify-between gap-3 rounded-lg bg-[#f8f9ff] px-3 py-2.5 text-sm text-[#44474e]"
                  key={field}
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <CircleAlert
                      aria-hidden="true"
                      className="h-4 w-4 shrink-0 text-[#ba1a1a]"
                    />
                    {field}
                  </span>
                  <a
                    aria-label={`Complete ${field}: ${action.label}`}
                    className="inline-flex shrink-0 items-center gap-1 text-xs font-bold text-[#00677f] hover:underline"
                    href={action.href}
                  >
                    {action.label}
                    <ArrowRight aria-hidden="true" className="h-3 w-3" />
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      ) : (
        <p className="mt-4 flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800">
          <CheckCircle2 aria-hidden="true" className="h-4 w-4" />
          Your profile is complete.
        </p>
      )}
    </section>
  );
}

function PublicProfilePreview({
  profile,
  privacy,
}: {
  profile: StudentProfile;
  privacy: ProfilePrivacySettings;
}) {
  const photoUrl = resolveApiAssetUrl(profile.profilePhotoUrl);
  const hasVisibleProfessionalLink =
    (privacy.showLinkedin && Boolean(profile.linkedinUrl)) ||
    (privacy.showGithub && Boolean(profile.githubUrl));
  return (
    <section className="overflow-hidden rounded-2xl border border-dashed border-[#aebbd1] bg-white shadow-[0_3px_12px_rgba(3,22,53,0.04)]">
      <div className="flex items-center justify-between bg-[#e5eeff] px-5 py-3">
        <div className="flex items-center gap-2">
          <Globe2 aria-hidden="true" className="h-4 w-4 text-[#364768]" />
          <h2 className="text-sm font-bold text-[#031635]">
            Public seller preview
          </h2>
        </div>
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#536079]">
          <Eye aria-hidden="true" className="h-3.5 w-3.5" />
          Live preview
        </span>
      </div>
      <div className="p-5">
        <div className="flex items-start gap-3">
          {photoUrl ? (
            <img
              alt=""
              className="h-14 w-14 rounded-xl object-cover"
              src={photoUrl}
            />
          ) : (
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[#d8e2ff] font-display text-lg font-black text-[#031635]">
              {initials(profile.fullName)}
            </div>
          )}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <p className="font-display text-lg font-bold text-[#031635]">
                {profile.fullName}
              </p>
              <ShieldCheck
                aria-label="Verified Student"
                className="h-4 w-4 text-[#00875a]"
              />
            </div>
            <p className="mt-0.5 text-xs leading-5 text-[#68707d]">
              {profile.college.name}
            </p>
          </div>
        </div>

        {(privacy.showDepartment || privacy.showYearOfStudy) && (
          <p className="mt-4 text-sm font-semibold text-[#263346]">
            {[
              privacy.showDepartment ? profile.department : null,
              privacy.showYearOfStudy ? profile.yearOfStudy : null,
            ]
              .filter(Boolean)
              .join(' · ')}
          </p>
        )}
        {privacy.showBio && (
          <p className="mt-3 text-sm leading-6 text-[#536079]">
            {profile.bio ||
              'Add a short bio to make your profile more trustworthy.'}
          </p>
        )}
        {privacy.showHostelArea && (
          <p className="mt-3 flex items-center gap-2 text-xs text-[#68707d]">
            <MapPin aria-hidden="true" className="h-3.5 w-3.5" />
            {profile.hostelArea}
          </p>
        )}
        <div className="mt-4 flex flex-wrap gap-2">
          {privacy.showLinkedin && profile.linkedinUrl && (
            <PublicLink icon={Linkedin} label="LinkedIn" />
          )}
          {privacy.showGithub && profile.githubUrl && (
            <PublicLink icon={Github} label="GitHub" />
          )}
          {!hasVisibleProfessionalLink && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f1f3f8] px-2.5 py-1 text-[11px] text-[#68707d]">
              <EyeOff aria-hidden="true" className="h-3 w-3" />
              {!privacy.showLinkedin && !privacy.showGithub
                ? 'Professional links private'
                : 'No professional links added'}
            </span>
          )}
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2 border-t border-[#e6e8ee] pt-4 text-center">
          <PreviewMetric
            icon={ShieldCheck}
            label="Trust"
            value={profile.trustScore.score}
          />
          <PreviewMetric
            icon={Star}
            label="Rating"
            value={profile.sellerStats.averageRating.toFixed(1)}
          />
          <PreviewMetric
            icon={HeartHandshake}
            label="Deals"
            value={profile.sellerStats.successfulDeals}
          />
        </div>
      </div>
    </section>
  );
}

function PrivacyToggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 py-3.5">
      <span className="text-sm font-semibold text-[#263346]">{label}</span>
      <input
        checked={checked}
        className="peer sr-only"
        onChange={(event) => onChange(event.target.checked)}
        type="checkbox"
      />
      <span className="relative h-6 w-11 shrink-0 rounded-full bg-[#c5c6cf] transition peer-focus-visible:ring-2 peer-focus-visible:ring-[#00a7cd] peer-checked:bg-[#00875a] after:absolute after:left-1 after:top-1 after:h-4 after:w-4 after:rounded-full after:bg-white after:shadow-sm after:transition peer-checked:after:translate-x-5" />
    </label>
  );
}

function PublicLink({
  label,
  icon: Icon,
}: {
  label: string;
  icon: typeof Linkedin;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#eff4ff] px-2.5 py-1 text-[11px] font-semibold text-[#364768]">
      <Icon aria-hidden="true" className="h-3 w-3" />
      {label}
    </span>
  );
}

function PreviewMetric({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  icon: typeof Star;
}) {
  return (
    <div>
      <p className="flex items-center justify-center gap-1 font-display text-lg font-black text-[#031635]">
        <Icon aria-hidden="true" className="h-3.5 w-3.5 text-[#00677f]" />
        {value}
      </p>
      <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.06em] text-[#858993]">
        {label}
      </p>
    </div>
  );
}

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

function privacySettingsChanged(
  current: ProfilePrivacySettings,
  saved: ProfilePrivacySettings,
) {
  return (Object.keys(current) as (keyof ProfilePrivacySettings)[]).some(
    (key) => current[key] !== saved[key],
  );
}

function trustScoreColor(score: number) {
  if (score <= 40) return '#f87171';
  if (score <= 70) return '#fbbf24';
  return '#6ffbbe';
}

function trustPointValue(suggestion: string) {
  const normalized = suggestion.toLowerCase();
  if (
    normalized.includes('profile photo') ||
    normalized.includes('short bio') ||
    normalized.includes('linkedin or github')
  ) {
    return '+5';
  }
  return null;
}

function completionAction(field: string) {
  const actions: Record<string, { href: string; label: string }> = {
    'Full name': { href: '#profile-full-name', label: 'Edit' },
    'College email verification': {
      href: '#profile-verified',
      label: 'Review',
    },
    'Phone verification': { href: '#profile-verified', label: 'Review' },
    'Department / branch': { href: '#profile-academic', label: 'Edit' },
    Course: { href: '#profile-academic', label: 'Edit' },
    'Year of study': { href: '#profile-academic', label: 'Edit' },
    'Hostel / campus area': { href: '#profile-hostel', label: 'Add' },
    'Profile photo': { href: '#profile-photo', label: 'Add' },
    Bio: { href: '#profile-bio', label: 'Add' },
    'LinkedIn URL': { href: '#profile-linkedin', label: 'Connect' },
    'GitHub URL': { href: '#profile-github', label: 'Connect' },
  };
  return actions[field] ?? { href: '#profile-details', label: 'Complete' };
}
