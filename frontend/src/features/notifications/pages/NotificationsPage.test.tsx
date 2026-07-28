import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type NotificationsData,
} from '../api/notificationsApi';
import { NotificationsPage } from './NotificationsPage';

vi.mock('../api/notificationsApi', async (importOriginal) => {
  const original =
    await importOriginal<typeof import('../api/notificationsApi')>();
  return {
    ...original,
    broadcastNotificationCount: vi.fn(),
    getNotifications: vi.fn(),
    markAllNotificationsRead: vi.fn(),
    markNotificationRead: vi.fn(),
  };
});

const notifications: NotificationsData = {
  stats: {
    totalNotifications: 6,
    unreadNotifications: 2,
    orderNotifications: 3,
    paymentNotifications: 1,
    reviewNotifications: 1,
    systemNotifications: 1,
  },
  notifications: [
    {
      id: 101,
      title: 'Item ready for pickup',
      message: 'Priya marked your calculator ready for pickup.',
      notificationType: 'ORDER',
      priority: 'HIGH',
      relatedEntityType: 'ORDER',
      relatedEntityId: 501,
      actionUrl: '/student/orders/501',
      isRead: false,
      readAt: null,
      createdAt: '2026-07-28T05:00:00Z',
    },
    {
      id: 102,
      title: 'New review received',
      message: 'You received a 5-star review for your listing.',
      notificationType: 'REVIEW',
      priority: 'MEDIUM',
      relatedEntityType: 'REVIEW',
      relatedEntityId: 301,
      actionUrl: '/student/reviews',
      isRead: true,
      readAt: '2026-07-28T05:30:00Z',
      createdAt: '2026-07-28T04:00:00Z',
    },
  ],
  pagination: {
    page: 0,
    size: 20,
    totalElements: 2,
    totalPages: 1,
    hasMore: false,
  },
};

describe('NotificationsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getNotifications).mockResolvedValue(notifications);
    vi.mocked(markNotificationRead).mockResolvedValue({
      id: 101,
      isRead: true,
      readAt: '2026-07-28T06:00:00Z',
      unreadCount: 1,
    });
    vi.mocked(markAllNotificationsRead).mockResolvedValue({
      updatedCount: 2,
      unreadCount: 0,
      updatedAt: '2026-07-28T06:00:00Z',
    });
  });

  it('shows live stats and marks an update read before opening its order', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/student/notifications']}>
        <Routes>
          <Route
            element={<NotificationsPage />}
            path="/student/notifications"
          />
          <Route
            element={<div>Order destination</div>}
            path="/student/orders/:orderId"
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(
      await screen.findByRole('heading', { name: 'Notifications' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Item ready for pickup')).toBeInTheDocument();
    expect(screen.getByText('New review received')).toBeInTheDocument();
    expect(screen.getByText('Order updates')).toBeInTheDocument();
    expect(screen.getByText('System alerts')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Unread 2' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'View order' }));

    await waitFor(() => expect(markNotificationRead).toHaveBeenCalledWith(101));
    expect(await screen.findByText('Order destination')).toBeInTheDocument();
  });

  it('applies server filters and marks every unread update as read', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <NotificationsPage />
      </MemoryRouter>,
    );
    await screen.findByText('Item ready for pickup');

    await user.click(screen.getByRole('tab', { name: 'Payments' }));
    await waitFor(() =>
      expect(getNotifications).toHaveBeenLastCalledWith({
        page: 0,
        size: 20,
        sortBy: 'newest',
        type: 'PAYMENT',
      }),
    );

    await user.click(screen.getByRole('button', { name: 'Mark all as read' }));
    await waitFor(() =>
      expect(markAllNotificationsRead).toHaveBeenCalledTimes(1),
    );
    expect(
      await screen.findByText('All notifications marked as read.'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Mark all as read' }),
    ).toBeDisabled();
  });

  it('does not render an action for an unapproved external route', async () => {
    vi.mocked(getNotifications).mockResolvedValue({
      ...notifications,
      notifications: [
        {
          ...notifications.notifications[0],
          actionUrl: 'https://example.com/untrusted',
        },
      ],
    });

    render(
      <MemoryRouter>
        <NotificationsPage />
      </MemoryRouter>,
    );

    expect(
      await screen.findByText('Item ready for pickup'),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'View order' }),
    ).not.toBeInTheDocument();
  });
});
