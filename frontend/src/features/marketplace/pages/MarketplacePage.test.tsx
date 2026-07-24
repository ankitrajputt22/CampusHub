import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  addListingToWishlist,
  getMyCollegeMarketplace,
  removeListingFromWishlist,
  type CollegeMarketplace,
} from '../api/marketplaceApi';
import { MarketplacePage } from './MarketplacePage';

vi.mock('../api/marketplaceApi', () => ({
  addListingToWishlist: vi.fn(),
  getMyCollegeMarketplace: vi.fn(),
  removeListingFromWishlist: vi.fn(),
}));

const marketplace: CollegeMarketplace = {
  college: {
    id: 7,
    name: 'Rajkiya Engineering College Mainpuri',
    code: 'RECM',
  },
  listings: [
    {
      id: 41,
      title: 'Engineering Mathematics book set',
      description: 'Three well-kept semester books.',
      category: 'Books',
      price: 680,
      condition: 'GOOD',
      primaryImageUrl: null,
      pickupLocation: 'Academic Block',
      negotiable: true,
      createdAt: new Date().toISOString(),
      seller: {
        id: 12,
        fullName: 'Priya Verma',
        profilePhotoUrl: null,
        trustScore: 84,
      },
      wishlisted: false,
      ownListing: false,
    },
  ],
  pagination: {
    page: 0,
    size: 12,
    totalElements: 1,
    totalPages: 1,
    hasMore: false,
  },
  pickupLocations: ['Academic Block'],
};

describe('MarketplacePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getMyCollegeMarketplace).mockResolvedValue(marketplace);
    vi.mocked(addListingToWishlist).mockResolvedValue(undefined);
    vi.mocked(removeListingFromWishlist).mockResolvedValue(undefined);
  });

  it('renders backend listings from the verified college and persists wishlist changes', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <MarketplacePage />
      </MemoryRouter>,
    );

    expect(
      await screen.findByRole('link', {
        name: 'Engineering Mathematics book set',
      }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByText('Rajkiya Engineering College Mainpuri').length,
    ).toBeGreaterThan(0);
    expect(screen.getByText('Priya Verma')).toBeInTheDocument();
    expect(screen.getByText('84 Trust Score')).toBeInTheDocument();
    expect(screen.getByText('₹680')).toBeInTheDocument();
    expect(screen.getByText('1 active listing')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'View details' })).toHaveAttribute(
      'href',
      '/listing/41',
    );

    const wishlistButton = screen.getByRole('button', {
      name: 'Save Engineering Mathematics book set to wishlist',
    });
    await user.click(wishlistButton);

    expect(addListingToWishlist).toHaveBeenCalledWith(41);
    expect(wishlistButton).toHaveAttribute('aria-pressed', 'true');
  });
});
