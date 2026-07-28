import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  deleteMarketplaceListing,
  getMyMarketplace,
  updateMarketplaceListingStatus,
  type MyMarketplace,
} from '../api/marketplaceApi';
import { MyMarketplacePage } from './MyMarketplacePage';

vi.mock('../api/marketplaceApi', () => ({
  deleteMarketplaceListing: vi.fn(),
  getMyMarketplace: vi.fn(),
  updateMarketplaceListingStatus: vi.fn(),
}));

vi.mock('../../student/lib/session', () => ({
  getCampusUser: () => ({
    id: 9,
    fullName: 'Ankit Rajput',
    collegeName: 'Rajkiya Engineering College Mainpuri',
  }),
}));

const marketplace: MyMarketplace = {
  stats: {
    totalListings: 3,
    activeListings: 1,
    soldListings: 1,
    inactiveListings: 1,
    totalViews: 42,
    totalWishlistSaves: 8,
  },
  listings: [
    {
      id: 101,
      title: 'Casio scientific calculator',
      price: 850,
      category: 'Electronics',
      condition: 'LIKE_NEW',
      pickupLocation: 'Central Library Gate',
      status: 'ACTIVE',
      coverImageUrl: null,
      views: 42,
      wishlistCount: 8,
      postedDate: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      negotiable: true,
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

describe('MyMarketplacePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getMyMarketplace).mockResolvedValue(marketplace);
    vi.mocked(updateMarketplaceListingStatus).mockResolvedValue({
      id: 101,
      status: 'SOLD',
      updatedAt: new Date().toISOString(),
    });
    vi.mocked(deleteMarketplaceListing).mockResolvedValue({
      id: 101,
      status: 'DELETED',
      updatedAt: new Date().toISOString(),
    });
  });

  it('loads authenticated seller data and confirms listing status actions', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <MyMarketplacePage />
      </MemoryRouter>,
    );

    expect(
      await screen.findByRole('heading', {
        name: 'Casio scientific calculator',
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Rajkiya Engineering College Mainpuri'),
    ).toBeInTheDocument();
    expect(screen.getAllByText('42')).toHaveLength(2);
    expect(screen.getByRole('link', { name: 'Edit' })).toHaveAttribute(
      'href',
      '/student/my-marketplace/edit/101',
    );

    await user.click(screen.getByRole('button', { name: 'Mark sold' }));
    expect(
      screen.getByRole('heading', {
        name: 'Mark this listing as sold?',
      }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Mark as sold' }));

    await waitFor(() =>
      expect(updateMarketplaceListingStatus).toHaveBeenCalledWith(
        101,
        'mark-sold',
      ),
    );
    expect(
      await screen.findByText('Listing marked as sold.'),
    ).toBeInTheDocument();
  });
});
