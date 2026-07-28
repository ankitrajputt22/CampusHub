import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  getReviewWorkspace,
  submitOrderReview,
  type ReviewWorkspace,
} from '../api/reviewsApi';
import { ReviewsPage } from './ReviewsPage';

vi.mock('../api/reviewsApi', () => ({
  getReviewWorkspace: vi.fn(),
  submitOrderReview: vi.fn(),
}));

const workspace: ReviewWorkspace = {
  stats: {
    averageRating: 4.8,
    receivedReviews: 2,
    givenReviews: 1,
    pendingReviews: 1,
  },
  pendingReviews: [
    {
      orderId: 91,
      orderNumber: 'CH-ORD-91',
      listingId: 31,
      listingTitle: 'Engineering Mathematics',
      coverImageUrl: null,
      sellerId: 7,
      sellerName: 'Priya Sharma',
      completedAt: '2026-07-28T05:00:00Z',
    },
  ],
  receivedReviews: [],
  givenReviews: [],
};

describe('ReviewsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getReviewWorkspace)
      .mockResolvedValueOnce(workspace)
      .mockResolvedValueOnce({
        ...workspace,
        stats: { ...workspace.stats, givenReviews: 2, pendingReviews: 0 },
        pendingReviews: [],
      });
    vi.mocked(submitOrderReview).mockResolvedValue({
      id: 12,
      orderId: 91,
      orderNumber: 'CH-ORD-91',
      listingId: 31,
      listingTitle: 'Engineering Mathematics',
      reviewerName: 'Ankit Rajput',
      revieweeName: 'Priya Sharma',
      rating: 5,
      message: 'The description was accurate and pickup was easy.',
      createdAt: '2026-07-28T06:00:00Z',
    });
  });

  it('submits feedback only for a completed order and refreshes the workspace', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <ReviewsPage />
      </MemoryRouter>,
    );

    expect(
      await screen.findByRole('heading', { name: 'Reviews' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Engineering Mathematics')).toBeInTheDocument();
    expect(screen.getByText('Priya Sharma')).toBeInTheDocument();

    const submit = screen.getByRole('button', { name: 'Submit review' });
    expect(submit).toBeDisabled();

    await user.click(screen.getByRole('button', { name: '5 stars' }));
    await user.type(
      screen.getByPlaceholderText(/item accuracy/i),
      'The description was accurate and pickup was easy.',
    );
    await user.click(submit);

    await waitFor(() =>
      expect(submitOrderReview).toHaveBeenCalledWith(91, {
        rating: 5,
        message: 'The description was accurate and pickup was easy.',
      }),
    );
    expect(
      await screen.findByText(/review submitted successfully/i),
    ).toBeInTheDocument();
    expect(getReviewWorkspace).toHaveBeenCalledTimes(2);
  });
});
