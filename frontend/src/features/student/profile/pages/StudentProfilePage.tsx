import { AlertCircle, LoaderCircle, RefreshCw, UserRound } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { getApiErrorMessage } from '../../../auth/api/authApi';
import { useStudentDashboard } from '../../dashboard/context/studentDashboardContext';
import { clearCampusSession, updateCampusUser } from '../../lib/session';
import {
  changePassword,
  getStudentProfile,
  logoutAllDevices,
  requestAccountDeactivation,
  updatePrivacySettings,
  updateStudentProfile,
  uploadProfilePhoto,
} from '../api/profileApi';
import { ProfileAccountSettings } from '../components/ProfileAccountSettings';
import { ProfileDetailsForm } from '../components/ProfileDetailsForm';
import { ProfileHeader } from '../components/ProfileHeader';
import {
  LockedVerifiedDetails,
  ReviewsAndMarketplace,
} from '../components/ProfileIdentityCards';
import { ProfileSidePanel } from '../components/ProfileSidePanel';
import type {
  ChangePasswordPayload,
  ProfilePrivacySettings,
  ProfileUpdatePayload,
  StudentProfile,
} from '../types';

export function StudentProfilePage() {
  const [profile, setProfile] = useState<StudentProfile>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const navigate = useNavigate();
  const { refresh: refreshDashboard } = useStudentDashboard();

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setProfile(await getStudentProfile());
    } catch (caught) {
      setError(
        getApiErrorMessage(caught) ||
          'Unable to load profile. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  async function saveProfile(payload: ProfileUpdatePayload) {
    const updated = await updateStudentProfile(payload);
    setProfile(updated);
    updateCampusUser({
      fullName: updated.fullName,
      trustScore: updated.trustScore.score,
    });
    await refreshDashboard();
  }

  async function savePrivacy(settings: ProfilePrivacySettings) {
    const updated = await updatePrivacySettings(settings);
    setProfile(updated);
  }

  async function savePhoto(file: File) {
    await uploadProfilePhoto(file);
    setNotice('Profile photo updated successfully.');
    const updated = await getStudentProfile();
    setProfile(updated);
    updateCampusUser({ trustScore: updated.trustScore.score });
    await refreshDashboard();
  }

  async function updatePassword(payload: ChangePasswordPayload) {
    await changePassword(payload);
    clearCampusSession();
    navigate('/login', {
      replace: true,
      state: {
        message: 'Password changed successfully. Please sign in again.',
      },
    });
  }

  async function logoutEverywhere() {
    await logoutAllDevices();
    clearCampusSession();
    navigate('/login', {
      replace: true,
      state: { message: 'You have been logged out from all devices.' },
    });
  }

  async function deactivate() {
    await requestAccountDeactivation();
    clearCampusSession();
    navigate('/login', {
      replace: true,
      state: { message: 'Your account deactivation request was submitted.' },
    });
  }

  if (loading && !profile) {
    return (
      <div
        aria-label="Loading your profile"
        className="grid min-h-[65vh] place-items-center"
      >
        <div className="text-center">
          <LoaderCircle
            aria-hidden="true"
            className="mx-auto h-9 w-9 animate-spin text-[#00677f]"
          />
          <p className="mt-4 font-semibold text-[#263346]">
            Loading your profile...
          </p>
          <p className="mt-1 text-sm text-[#68707d]">
            Preparing your identity and trust details.
          </p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="mx-auto grid min-h-[65vh] max-w-lg place-items-center">
        <section className="w-full rounded-2xl border border-red-200 bg-white p-7 text-center shadow-sm">
          <AlertCircle
            aria-hidden="true"
            className="mx-auto h-9 w-9 text-red-600"
          />
          <h1 className="mt-4 font-display text-2xl font-bold text-[#031635]">
            Unable to load profile
          </h1>
          <p className="mt-2 text-sm leading-6 text-[#68707d]">
            {error || 'Unable to load profile. Please try again.'}
          </p>
          <button
            className="mt-6 inline-flex h-11 items-center gap-2 rounded-lg bg-[#031635] px-5 text-sm font-bold text-white"
            onClick={() => void loadProfile()}
            type="button"
          >
            <RefreshCw aria-hidden="true" className="h-4 w-4" />
            Retry
          </button>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 md:pb-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-[#00677f]">
            <UserRound aria-hidden="true" className="h-4 w-4" />
            Identity & trust
          </p>
          <h1 className="mt-2 font-display text-3xl font-extrabold tracking-[-0.025em] text-[#031635] sm:text-4xl">
            Student profile
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#68707d]">
            Manage your verified identity, seller reputation, public visibility,
            and account security.
          </p>
        </div>
        <p className="rounded-full bg-[#d9fbe9] px-3 py-1.5 text-xs font-bold text-[#075d3b]">
          {profile.accountStatus} account
        </p>
      </div>

      <nav
        aria-label="Profile page sections"
        className="flex gap-2 overflow-x-auto rounded-xl border border-[#d6d9e2] bg-white p-2 shadow-[0_2px_8px_rgba(3,22,53,0.03)]"
      >
        <ProfileSectionLink href="#profile-overview" label="Overview" />
        <ProfileSectionLink href="#profile-details" label="Profile details" />
        <ProfileSectionLink
          href="#profile-verified"
          label="Verified identity"
        />
        <ProfileSectionLink
          href="#profile-reputation"
          label="Seller reputation"
        />
        <ProfileSectionLink href="#profile-privacy" label="Privacy" />
        <ProfileSectionLink href="#profile-security" label="Account security" />
      </nav>

      {notice && (
        <div
          className="flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800"
          role="status"
        >
          {notice}
          <button
            aria-label="Dismiss message"
            className="text-xs underline"
            onClick={() => setNotice('')}
            type="button"
          >
            Dismiss
          </button>
        </div>
      )}

      <ProfileHeader onPhotoSelected={savePhoto} profile={profile} />

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_360px] 2xl:grid-cols-[minmax(0,1fr)_390px]">
        <div className="space-y-6">
          <ProfileDetailsForm onSave={saveProfile} profile={profile} />
          <LockedVerifiedDetails profile={profile} />
          <ReviewsAndMarketplace profile={profile} />
          <ProfileAccountSettings
            onChangePassword={updatePassword}
            onDeactivate={deactivate}
            onLogoutAll={logoutEverywhere}
          />
        </div>
        <ProfileSidePanel onPrivacySave={savePrivacy} profile={profile} />
      </div>
    </div>
  );
}

function ProfileSectionLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      className="shrink-0 rounded-lg px-3 py-2 text-xs font-bold text-[#536079] hover:bg-[#e5eeff] hover:text-[#031635]"
      href={href}
    >
      {label}
    </a>
  );
}
