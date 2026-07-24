import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getStudentDashboard } from '../dashboard/api/dashboardApi';
import { StudentDashboardProvider } from '../dashboard/context/StudentDashboardProvider';
import type { StudentDashboard } from '../dashboard/types';
import { StudentDashboardPage } from './StudentDashboardPage';

vi.mock('../dashboard/api/dashboardApi', () => ({
  getStudentDashboard: vi.fn(),
}));

const dashboard: StudentDashboard = {
  user: {
    id: 7,
    fullName: 'Ankit Rajput',
    email: 'ankit@iitd.ac.in',
    collegeId: 1,
    collegeName: 'IIT Delhi',
    collegeCode: 'IITD',
    role: 'STUDENT',
    accountStatus: 'ACTIVE',
    isEmailVerified: true,
    isPhoneVerified: true,
    department: 'Computer Science Engineering',
    course: 'B.Tech',
    yearOfStudy: '3rd Year',
    hostelOrCampusArea: 'Aravali Hostel',
    profilePhotoFileName: null,
  },
  trustScore: {
    score: 30,
    level: 'New / Low Trust',
    suggestions: ['Add a clear profile photo.'],
  },
  profileCompletion: {
    percentage: 64,
    completedFields: 7,
    totalFields: 11,
    missingFields: ['profilePhoto', 'bio', 'linkedinUrl', 'githubUrl'],
  },
  stats: {
    activeListings: 1,
    wishlistItems: 2,
    ordersPlaced: 3,
    itemsSold: 1,
    unreadNotifications: 1,
  },
  latestListings: [
    {
      id: 101,
      title: 'Scientific Calculator',
      category: 'Electronics',
      price: 900,
      condition: 'Like New',
      imageUrl: null,
      sellerId: 9,
      sellerName: 'Priya Verma',
      sellerTrustScore: 82,
      postedDate: '2026-07-24T10:00:00Z',
    },
  ],
  notifications: [
    {
      id: 1,
      type: 'ACCOUNT',
      title: 'Account verified',
      message: 'Your student account is verified.',
      isRead: false,
      createdAt: '2026-07-24T10:00:00Z',
    },
  ],
  recentActivity: [
    {
      id: 1,
      type: 'ACCOUNT_VERIFIED',
      message: 'Completed college email and phone verification.',
      createdAt: '2026-07-24T10:00:00Z',
    },
  ],
  generatedAt: '2026-07-24T10:00:00Z',
};

describe('StudentDashboardPage', () => {
  beforeEach(() => {
    vi.mocked(getStudentDashboard).mockResolvedValue(dashboard);
  });

  it('renders authenticated dashboard data from the backend response', async () => {
    render(
      <MemoryRouter>
        <StudentDashboardProvider>
          <StudentDashboardPage />
        </StudentDashboardProvider>
      </MemoryRouter>,
    );

    expect(
      await screen.findByRole('heading', { name: /Welcome, Ankit/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Latest in IIT Delhi' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Scientific Calculator')).toBeInTheDocument();
    expect(screen.getByText('Electronics')).toBeInTheDocument();
    expect(screen.getByText('Account verified')).toBeInTheDocument();
    expect(
      screen.getByText('Completed college email and phone verification.'),
    ).toBeInTheDocument();
  });
});
