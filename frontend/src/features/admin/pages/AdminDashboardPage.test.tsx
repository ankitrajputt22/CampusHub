import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getAdminDashboard, type AdminDashboard } from '../api/adminApi';
import { AdminDashboardPage } from './AdminDashboardPage';

vi.mock('../api/adminApi', async (importOriginal) => {
  const original = await importOriginal<typeof import('../api/adminApi')>();
  return {
    ...original,
    getAdminDashboard: vi.fn(),
  };
});

const dashboard: AdminDashboard = {
  stats: {
    totalUsers: 148,
    activeUsers: 131,
    totalListings: 62,
    activeListings: 44,
    totalOrders: 27,
    pendingReports: 3,
    blockedListings: 2,
    totalReviews: 19,
  },
  pendingReports: [
    {
      id: 701,
      type: 'LISTING',
      reason: 'FAKE_LISTING',
      priority: 'HIGH',
      targetTitle: 'Scientific Calculator',
      reporterName: 'Ankit Rajput',
      reporterCollege: 'REC Mainpuri',
      createdAt: '2026-07-24T10:00:00Z',
    },
  ],
  recentListings: [
    {
      id: 41,
      title: 'Engineering Drawing Kit',
      imageUrl: null,
      sellerName: 'Priya Sharma',
      collegeName: 'REC Mainpuri',
      status: 'ACTIVE',
      price: 650,
      createdAt: '2026-07-24T09:00:00Z',
    },
  ],
  recentUsers: [
    {
      id: 33,
      fullName: 'Rahul Verma',
      collegeName: 'REC Mainpuri',
      emailVerified: true,
      phoneVerified: true,
      accountStatus: 'ACTIVE',
      trustScore: 78,
      createdAt: '2026-07-23T09:00:00Z',
    },
  ],
  orderPaymentSummary: {
    totalOrders: 27,
    completedOrders: 18,
    successfulPayments: 20,
    failedPayments: 2,
    pendingPayments: 5,
  },
  moderationActivity: [
    {
      id: 11,
      adminId: 2,
      adminName: 'Campus Admin',
      actionType: 'LISTING_BLOCKED',
      targetType: 'LISTING',
      targetId: 40,
      previousValue: 'ACTIVE',
      newValue: 'BLOCKED',
      note: 'Confirmed prohibited item.',
      ipAddress: '127.0.0.1',
      userAgent: 'Vitest',
      createdAt: '2026-07-24T08:00:00Z',
    },
  ],
};

describe('AdminDashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getAdminDashboard).mockResolvedValue(dashboard);
  });

  it('shows platform health, pending reports, and moderation activity', async () => {
    render(
      <MemoryRouter>
        <AdminDashboardPage />
      </MemoryRouter>,
    );

    expect(
      await screen.findByRole('heading', { name: 'Admin Dashboard' }),
    ).toBeInTheDocument();
    expect(screen.getByText('148')).toBeInTheDocument();
    expect(screen.getByText('Scientific Calculator')).toBeInTheDocument();
    expect(screen.getByText('Engineering Drawing Kit')).toBeInTheDocument();
    expect(screen.getByText('Rahul Verma')).toBeInTheDocument();
    expect(screen.getByText(/Campus Admin/)).toBeInTheDocument();
  });
});
