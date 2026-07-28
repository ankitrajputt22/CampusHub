import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  confirmOrderPickup,
  getOrders,
  type OrdersPageData,
} from '../api/ordersApi';
import { OrdersPage } from './OrdersPage';

const refreshDashboard = vi.fn();

vi.mock('../api/ordersApi', () => ({
  cancelOrder: vi.fn(),
  confirmOrderPickup: vi.fn(),
  getOrders: vi.fn(),
  markOrderReady: vi.fn(),
}));

vi.mock('../../student/dashboard/context/studentDashboardContext', () => ({
  useStudentDashboard: () => ({ refresh: refreshDashboard }),
}));

const purchases: OrdersPageData = {
  stats: {
    totalOrders: 1,
    pendingPayment: 0,
    paidOrders: 0,
    readyForPickup: 1,
    completedOrders: 0,
    cancelledOrders: 0,
  },
  orders: [
    {
      id: 41,
      orderNumber: 'CH-ORD-20260726-ABC12345',
      role: 'BUYER',
      status: 'READY_FOR_PICKUP',
      paymentStatus: 'SUCCESS',
      amount: 850,
      createdAt: '2026-07-26T07:00:00Z',
      updatedAt: '2026-07-26T08:00:00Z',
      pickupLocation: 'Central Library Gate',
      listing: {
        id: 101,
        title: 'Casio scientific calculator',
        category: 'Electronics',
        condition: 'LIKE_NEW',
        coverImageUrl: null,
      },
      otherParty: {
        id: 8,
        fullName: 'Priya Sharma',
        profilePhotoUrl: null,
        trustScore: 86,
        trustLevel: 'Trusted Student',
      },
      availableActions: ['VIEW_DETAILS', 'CONFIRM_PICKUP'],
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

describe('OrdersPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getOrders).mockResolvedValue(purchases);
    vi.mocked(confirmOrderPickup).mockResolvedValue({
      orderId: 41,
      orderNumber: 'CH-ORD-20260726-ABC12345',
      status: 'COMPLETED',
      paymentStatus: 'SUCCESS',
      updatedAt: '2026-07-26T09:00:00Z',
      message: 'Pickup confirmed and the order is complete.',
    });
    refreshDashboard.mockResolvedValue(undefined);
  });

  it('renders server orders and confirms pickup with a safety prompt', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <OrdersPage />
      </MemoryRouter>,
    );

    expect(
      await screen.findByRole('link', {
        name: 'Casio scientific calculator',
      }),
    ).toBeInTheDocument();
    expect(screen.getByText('Priya Sharma')).toBeInTheDocument();
    expect(screen.getAllByText(/Payment Success/i)).toHaveLength(2);
    expect(screen.getByRole('link', { name: 'View details' })).toHaveAttribute(
      'href',
      '/student/orders/41',
    );

    await user.click(screen.getByRole('button', { name: 'Confirm pickup' }));
    expect(
      screen.getByRole('heading', { name: 'Confirm item handover?' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/only after inspecting and receiving/i),
    ).toBeInTheDocument();

    await user.click(
      within(screen.getByRole('dialog')).getByRole('button', {
        name: 'Confirm pickup',
      }),
    );

    await waitFor(() => expect(confirmOrderPickup).toHaveBeenCalledWith(41));
    expect(
      await screen.findByText('Pickup confirmed and the order is complete.'),
    ).toBeInTheDocument();
    expect(refreshDashboard).toHaveBeenCalled();
  });

  it('loads the authenticated seller view when My Sales is selected', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <OrdersPage />
      </MemoryRouter>,
    );
    await screen.findByRole('link', {
      name: 'Casio scientific calculator',
    });

    await user.click(screen.getByRole('tab', { name: 'My Sales' }));

    await waitFor(() =>
      expect(getOrders).toHaveBeenLastCalledWith(
        'SELLER',
        expect.objectContaining({ page: 0 }),
        expect.any(AbortSignal),
      ),
    );
  });
});
