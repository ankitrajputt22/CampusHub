import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  getNotificationPreview,
  getUnreadNotificationCount,
  markNotificationRead,
} from '../api/notificationsApi';
import { NotificationBell } from './NotificationBell';

vi.mock('../api/notificationsApi', async (importOriginal) => {
  const original =
    await importOriginal<typeof import('../api/notificationsApi')>();
  return {
    ...original,
    broadcastNotificationCount: vi.fn(),
    getNotificationPreview: vi.fn(),
    getUnreadNotificationCount: vi.fn(),
    markNotificationRead: vi.fn(),
  };
});

describe('NotificationBell', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getUnreadNotificationCount).mockResolvedValue({
      unreadCount: 2,
    });
    vi.mocked(getNotificationPreview).mockResolvedValue({
      unreadCount: 2,
      notifications: [
        {
          id: 201,
          title: 'Payment successful',
          message: 'Your calculator payment was successful.',
          notificationType: 'PAYMENT',
          priority: 'HIGH',
          relatedEntityType: 'ORDER',
          relatedEntityId: 501,
          actionUrl: '/student/orders/501',
          isRead: false,
          readAt: null,
          createdAt: '2026-07-28T05:00:00Z',
        },
      ],
    });
    vi.mocked(markNotificationRead).mockResolvedValue({
      id: 201,
      isRead: true,
      readAt: '2026-07-28T06:00:00Z',
      unreadCount: 1,
    });
  });

  it('shows a recent preview and securely opens the related page', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <Routes>
          <Route
            element={<NotificationBell initialUnreadCount={2} />}
            path="*"
          />
          <Route
            element={<div>Order destination</div>}
            path="/student/orders/:orderId"
          />
        </Routes>
      </MemoryRouter>,
    );

    await user.click(
      screen.getByRole('button', { name: 'Notifications, 2 unread' }),
    );
    expect(await screen.findByText('Payment successful')).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /View all notifications/i }),
    ).toHaveAttribute('href', '/student/notifications');

    await user.click(
      screen.getByRole('button', { name: /Payment successful/i }),
    );
    await waitFor(() => expect(markNotificationRead).toHaveBeenCalledWith(201));
    expect(await screen.findByText('Order destination')).toBeInTheDocument();
  });
});
