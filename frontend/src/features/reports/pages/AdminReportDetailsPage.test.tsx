import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  getAdminReport,
  moderateTarget,
  type AdminReportDetails,
} from '../api/reportsApi';
import { AdminReportDetailsPage } from './AdminReportDetailsPage';

vi.mock('../api/reportsApi', async (importOriginal) => {
  const original = await importOriginal<typeof import('../api/reportsApi')>();
  return {
    ...original,
    getAdminReport: vi.fn(),
    moderateTarget: vi.fn(),
    updateReportStatus: vi.fn(),
  };
});

const report: AdminReportDetails = {
  id: 91,
  type: 'LISTING',
  entityId: 31,
  reason: 'STOLEN_ITEM_SUSPICION',
  description: 'The seller could not show proof of ownership.',
  status: 'UNDER_REVIEW',
  priority: 'CRITICAL',
  adminResponse: null,
  submittedAt: '2026-07-28T10:00:00Z',
  updatedAt: '2026-07-28T10:30:00Z',
  reviewedAt: '2026-07-28T10:30:00Z',
  reporter: {
    id: 1,
    fullName: 'Safety Reporter',
    collegeName: 'IIT Delhi',
  },
  target: {
    id: 31,
    title: 'Sealed student laptop',
    subtitle: 'Electronics',
    status: 'UNDER_REVIEW',
    ownerId: 2,
    ownerName: 'Listing Owner',
  },
  previousReportsForTarget: 2,
  moderationHistory: [
    {
      id: 1,
      action: 'REPORT_UNDER_REVIEW',
      targetType: 'REPORT',
      targetId: 91,
      previousState: 'PENDING',
      newState: 'UNDER_REVIEW',
      note: 'Checking ownership details.',
      moderatorName: 'Campus Moderator',
      createdAt: '2026-07-28T10:30:00Z',
    },
  ],
};

describe('AdminReportDetailsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getAdminReport).mockResolvedValue(report);
    vi.mocked(moderateTarget).mockResolvedValue({
      reportId: 91,
      reportStatus: 'ACTION_TAKEN',
      action: 'LISTING_BLOCKED',
      targetType: 'LISTING',
      targetId: 31,
      targetStatus: 'BLOCKED',
      updatedAt: '2026-07-28T11:00:00Z',
    });
  });

  it('shows report context and sends an audited target action', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/admin/reports/91']}>
        <Routes>
          <Route
            element={<AdminReportDetailsPage />}
            path="/admin/reports/:reportId"
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(
      await screen.findByRole('heading', { name: 'Report #91' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Sealed student laptop')).toBeInTheDocument();
    expect(screen.getByText('Checking ownership details.')).toBeInTheDocument();

    await user.type(
      screen.getByPlaceholderText(/Add evidence, rationale/i),
      'No valid ownership evidence was provided.',
    );
    await user.click(screen.getByRole('button', { name: /Block listing/i }));

    await waitFor(() =>
      expect(moderateTarget).toHaveBeenCalledWith(
        report,
        'block',
        'No valid ownership evidence was provided.',
      ),
    );
    expect(
      await screen.findByText('Block listing completed successfully.'),
    ).toBeInTheDocument();
  });
});
