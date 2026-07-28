import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getMyReports, type ReportPage } from '../api/reportsApi';
import { MyReportsPage } from './MyReportsPage';

vi.mock('../api/reportsApi', async (importOriginal) => {
  const original = await importOriginal<typeof import('../api/reportsApi')>();
  return {
    ...original,
    getMyReports: vi.fn(),
  };
});

const reports: ReportPage = {
  stats: {
    total: 2,
    pending: 1,
    underReview: 0,
    actionTaken: 1,
    rejected: 0,
    closed: 0,
  },
  reports: [
    {
      id: 81,
      type: 'LISTING',
      entityId: 15,
      targetTitle: 'Suspicious calculator listing',
      targetSubtitle: 'Seller: Test Student',
      targetStatus: 'BLOCKED',
      reason: 'PRICE_SCAM',
      description: 'The pickup price changed after the order.',
      status: 'ACTION_TAKEN',
      priority: 'HIGH',
      adminResponse: 'A moderator removed the listing.',
      submittedAt: '2026-07-28T10:00:00Z',
      updatedAt: '2026-07-28T11:00:00Z',
    },
  ],
  pagination: {
    page: 0,
    size: 8,
    totalElements: 1,
    totalPages: 1,
    hasMore: false,
  },
};

describe('MyReportsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getMyReports).mockResolvedValue(reports);
  });

  it('shows private report status details and applies status filters', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <MyReportsPage />
      </MemoryRouter>,
    );

    expect(
      await screen.findByRole('heading', { name: 'My Reports' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Suspicious calculator listing'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('A moderator removed the listing.'),
    ).toBeInTheDocument();
    expect(screen.getByText('High priority')).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: 'Under review' }));

    await waitFor(() =>
      expect(getMyReports).toHaveBeenLastCalledWith(
        {
          page: 0,
          size: 8,
          sortBy: 'newest',
          status: 'UNDER_REVIEW',
          type: undefined,
        },
        expect.any(AbortSignal),
      ),
    );
  });
});
