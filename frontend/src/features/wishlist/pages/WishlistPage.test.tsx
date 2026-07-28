import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  getWishlist,
  removeWishlistItem,
  type WishlistPageData,
} from '../api/wishlistApi';
import { WishlistPage } from './WishlistPage';

const refreshDashboard = vi.fn();

vi.mock('../api/wishlistApi', () => ({
  getWishlist: vi.fn(),
  removeWishlistItem: vi.fn(),
}));

vi.mock('../../student/dashboard/context/studentDashboardContext', () => ({
  useStudentDashboard: () => ({ refresh: refreshDashboard }),
}));

vi.mock('../../student/lib/session', () => ({
  getCampusUser: () => ({
    collegeName: 'Rajkiya Engineering College Mainpuri',
  }),
}));

const wishlist: WishlistPageData = {
  stats: {
    totalItems: 2,
    availableItems: 1,
    unavailableItems: 1,
  },
  items: [
    {
      wishlistId: 11,
      savedAt: new Date().toISOString(),
      listing: {
        id: 101,
        title: 'Scientific calculator',
        price: 850,
        category: 'Electronics',
        condition: 'LIKE_NEW',
        pickupLocation: 'Central Library Gate',
        status: 'ACTIVE',
        coverImageUrl: null,
        available: true,
        seller: {
          id: 5,
          fullName: 'Rahul Sharma',
          trustScore: 82,
          trustLevel: 'Trusted Student',
        },
      },
    },
    {
      wishlistId: 12,
      savedAt: new Date().toISOString(),
      listing: {
        id: 102,
        title: 'Previously sold textbook',
        price: 400,
        category: 'Books',
        condition: 'GOOD',
        pickupLocation: 'Academic Block',
        status: 'SOLD',
        coverImageUrl: null,
        available: false,
        seller: {
          id: 6,
          fullName: 'Priya Verma',
          trustScore: 74,
          trustLevel: 'Trusted Student',
        },
      },
    },
  ],
  pagination: {
    page: 0,
    size: 12,
    totalElements: 2,
    totalPages: 1,
    hasMore: false,
  },
};

describe('WishlistPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getWishlist).mockResolvedValue(wishlist);
    vi.mocked(removeWishlistItem).mockResolvedValue({
      listingId: 102,
      wishlisted: false,
    });
    refreshDashboard.mockResolvedValue(undefined);
  });

  it('renders status-aware saved items and removes an item after confirmation', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <WishlistPage />
      </MemoryRouter>,
    );

    expect(
      await screen.findByRole('heading', { name: 'Scientific calculator' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Previously sold textbook' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('This item has already been sold.'),
    ).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'View details' })).toHaveLength(
      1,
    );
    expect(screen.getByRole('link', { name: 'View details' })).toHaveAttribute(
      'href',
      '/listing/101',
    );

    await user.click(
      screen.getByRole('button', {
        name: 'Remove Previously sold textbook from wishlist',
      }),
    );
    expect(
      screen.getByRole('heading', { name: 'Remove from your wishlist?' }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Remove item' }));

    await waitFor(() => expect(removeWishlistItem).toHaveBeenCalledWith(102));
    expect(
      await screen.findByText('Item removed from wishlist.'),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'Previously sold textbook' }),
    ).not.toBeInTheDocument();
    expect(refreshDashboard).toHaveBeenCalled();
  });
});
