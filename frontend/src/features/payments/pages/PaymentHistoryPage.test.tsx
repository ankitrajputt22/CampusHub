import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getMyPayments } from '../api/paymentsApi';
import { PaymentHistoryPage } from './PaymentHistoryPage';

vi.mock('../api/paymentsApi', () => ({
  getMyPayments: vi.fn(),
  recordRazorpayFailure: vi.fn(),
  retryPaymentCheckout: vi.fn(),
  verifyRazorpayPayment: vi.fn(),
}));

vi.mock('../../student/dashboard/context/studentDashboardContext', () => ({
  useStudentDashboard: () => ({ refresh: vi.fn() }),
}));

describe('PaymentHistoryPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getMyPayments).mockResolvedValue({
      stats: {
        totalPayments: 2,
        successfulPayments: 1,
        pendingPayments: 1,
        failedPayments: 0,
        refundedPayments: 0,
        totalSpent: 1850,
      },
      payments: [
        {
          id: 91,
          orderId: 81,
          orderNumber: 'CH-ORDER-81',
          role: 'BUYER',
          listingId: 41,
          productTitle: 'Casio scientific calculator',
          coverImageUrl: null,
          amount: 1850,
          currency: 'INR',
          paymentStatus: 'PENDING',
          orderStatus: 'PENDING_PAYMENT',
          paymentMethod: 'Razorpay Checkout',
          razorpayPaymentId: null,
          refundStatus: 'NOT_REQUIRED',
          failureReason: null,
          paymentDate: null,
          createdAt: '2026-07-26T10:00:00Z',
          canRetry: true,
        },
      ],
      pagination: {
        page: 0,
        size: 12,
        totalElements: 1,
        totalPages: 1,
        hasMore: false,
      },
    });
  });

  it('shows backend payment history and a resumable order', async () => {
    render(
      <MemoryRouter initialEntries={['/student/payments?orderId=81']}>
        <Routes>
          <Route element={<PaymentHistoryPage />} path="/student/payments" />
        </Routes>
      </MemoryRouter>,
    );

    expect(
      await screen.findByRole('heading', { name: 'Payments' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Complete your secure payment' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Continue payment' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Casio scientific calculator' }),
    ).toHaveAttribute('href', '/listing/41');
    expect(
      screen.getByText('CH-ORDER-81 · Razorpay Checkout'),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'View order' })).toHaveAttribute(
      'href',
      '/student/orders/81',
    );
    expect(getMyPayments).toHaveBeenCalledWith(
      {
        search: undefined,
        status: undefined,
        page: 0,
        size: 12,
      },
      expect.any(AbortSignal),
    );
  });
});
