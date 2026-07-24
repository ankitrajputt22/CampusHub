import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getStudentProfile } from '../api/profileApi';
import type { StudentProfile } from '../types';
import { StudentProfilePage } from './StudentProfilePage';

vi.mock('../../dashboard/context/studentDashboardContext', () => ({
  useStudentDashboard: () => ({
    refresh: vi.fn().mockResolvedValue(undefined),
  }),
}));

vi.mock('../api/profileApi', () => ({
  changePassword: vi.fn(),
  getStudentProfile: vi.fn(),
  logoutAllDevices: vi.fn(),
  requestAccountDeactivation: vi.fn(),
  updatePrivacySettings: vi.fn(),
  updateStudentProfile: vi.fn(),
  uploadProfilePhoto: vi.fn(),
}));

const profile: StudentProfile = {
  id: 7,
  fullName: 'Ankit Rajput',
  email: 'ankit241011@recmainpuri.in',
  phoneNumber: '+91 9876543210',
  college: {
    id: 1,
    name: 'Rajkiya Engineering College Mainpuri',
    code: 'RECM',
  },
  department: 'Computer Science Engineering',
  course: 'B.Tech',
  yearOfStudy: '3rd Year',
  rollNumber: '241011',
  hostelArea: 'Main Campus',
  profilePhotoUrl: null,
  bio: null,
  linkedinUrl: null,
  githubUrl: null,
  isEmailVerified: true,
  isPhoneVerified: true,
  isVerifiedStudent: true,
  role: 'STUDENT',
  accountStatus: 'ACTIVE',
  trustScore: {
    score: 30,
    level: 'New / Low Trust',
    suggestions: [
      'Add a clear profile photo.',
      'Add a short bio.',
      'Connect LinkedIn or GitHub.',
    ],
  },
  profileCompletion: {
    percentage: 64,
    completedFields: 7,
    totalFields: 11,
    missingFields: ['Profile photo', 'Bio', 'LinkedIn URL', 'GitHub URL'],
  },
  sellerStats: {
    averageRating: 0,
    totalReviews: 0,
    successfulDeals: 0,
    activeListings: 0,
    soldItems: 0,
    ordersCompleted: 0,
    wishlistItems: 0,
  },
  privacySettings: {
    showBio: true,
    showLinkedin: true,
    showGithub: true,
    showHostelArea: false,
    showDepartment: true,
    showYearOfStudy: true,
  },
  latestReviews: [],
};

describe('StudentProfilePage', () => {
  beforeEach(() => {
    vi.mocked(getStudentProfile).mockResolvedValue(profile);
  });

  it('renders the authenticated profile, locked identity, and empty reputation states', async () => {
    render(
      <MemoryRouter>
        <StudentProfilePage />
      </MemoryRouter>,
    );

    expect(
      await screen.findByRole('heading', { name: 'Student profile' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Ankit Rajput' }),
    ).toBeInTheDocument();
    expect(screen.getByText('30/100')).toBeInTheDocument();
    expect(screen.getAllByText('64%')).toHaveLength(2);
    expect(screen.getByText('No reviews yet')).toBeInTheDocument();
    expect(screen.getByText('ankit241011@recmainpuri.in')).toBeInTheDocument();
    expect(screen.getAllByText('Verified Student')).not.toHaveLength(0);
    expect(
      screen.getByRole('heading', { name: 'Privacy controls' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('navigation', { name: 'Profile page sections' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', {
        name: 'Complete Profile photo: Add',
      }),
    ).toHaveAttribute('href', '#profile-photo');
    expect(screen.getAllByText('+5')).toHaveLength(3);
    expect(
      screen.getByRole('button', { name: 'Save privacy settings' }),
    ).toBeDisabled();
  });
});
