import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  createSupportTicket,
  getSupportTickets,
  type SupportTicketPage,
} from '../api/supportApi';
import { CreateSupportTicketPage } from './CreateSupportTicketPage';
import { SupportPage } from './SupportPage';

vi.mock('../api/supportApi', async (importOriginal) => {
  const original = await importOriginal<typeof import('../api/supportApi')>();
  return {
    ...original,
    createSupportTicket: vi.fn(),
    getSupportTickets: vi.fn(),
  };
});

const supportData: SupportTicketPage = {
  stats: { total: 2, open: 1, inProgress: 1, resolved: 0, closed: 0 },
  tickets: [
    {
      id: 42,
      ticketNumber: 'SUP-TEST42',
      category: 'PAYMENT',
      subject: 'Payment status did not update',
      status: 'OPEN',
      priority: 'HIGH',
      createdAt: '2026-08-08T10:00:00Z',
      updatedAt: '2026-08-08T10:00:00Z',
      lastReplyBy: 'STUDENT',
      submittedBy: 'Test Student',
      userEmail: 'student@example.com',
      collegeName: 'Test College',
      assignedAdmin: null,
    },
  ],
  pagination: {
    page: 0,
    size: 12,
    totalElements: 1,
    totalPages: 1,
    hasMore: false,
  },
};

describe('support workspace', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getSupportTickets).mockResolvedValue(supportData);
    vi.mocked(createSupportTicket).mockResolvedValue({
      id: 43,
      ticketNumber: 'SUP-TEST43',
      status: 'OPEN',
      priority: 'HIGH',
      createdAt: '2026-08-08T10:00:00Z',
    });
  });

  it('shows private ticket details and applies server status filters', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <SupportPage />
      </MemoryRouter>,
    );

    expect(
      await screen.findByRole('heading', { name: 'Contact Support' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Payment status did not update'),
    ).toBeInTheDocument();
    expect(screen.getByText('SUP-TEST42')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'In Progress' }));

    await waitFor(() =>
      expect(getSupportTickets).toHaveBeenLastCalledWith(
        { page: 0, search: undefined, size: 12, status: 'IN_PROGRESS' },
        expect.any(AbortSignal),
      ),
    );
  });

  it('creates a ticket without sending a frontend user ID', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <CreateSupportTicketPage />
      </MemoryRouter>,
    );

    await user.selectOptions(
      screen.getByRole('combobox', { name: /Category/ }),
      'PAYMENT',
    );
    await user.type(
      screen.getByPlaceholderText('Briefly describe what went wrong'),
      'Payment status did not update',
    );
    await user.type(
      screen.getByPlaceholderText(
        'Provide enough context for the support team to investigate your request...',
      ),
      'The payment completed but my order still shows pending payment.',
    );
    await user.click(
      screen.getByRole('button', { name: 'Submit Support Ticket' }),
    );

    await waitFor(() => expect(createSupportTicket).toHaveBeenCalledTimes(1));
    const payload = vi.mocked(createSupportTicket).mock.calls[0][0];
    expect(payload).toEqual({
      category: 'PAYMENT',
      subject: 'Payment status did not update',
      description:
        'The payment completed but my order still shows pending payment.',
      relatedEntityType: 'NONE',
      relatedEntityId: null,
    });
    expect(payload).not.toHaveProperty('userId');
  });
});
