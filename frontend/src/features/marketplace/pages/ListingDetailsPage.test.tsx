import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  addListingToWishlist,
  getMarketplaceListing,
  initiateMarketplaceOrder,
  removeListingFromWishlist,
  reportMarketplaceListing,
  type ProductDetails,
} from '../api/marketplaceApi';
import { getExploreListing } from '../api/exploreApi';
import { openRazorpayCheckout } from '../../payments/lib/razorpayCheckout';
import { ListingDetailsPage } from './ListingDetailsPage';

vi.mock('../api/marketplaceApi', () => ({
  addListingToWishlist: vi.fn(),
  getMarketplaceListing: vi.fn(),
  initiateMarketplaceOrder: vi.fn(),
  removeListingFromWishlist: vi.fn(),
  reportMarketplaceListing: vi.fn(),
}));

vi.mock('../api/exploreApi', () => ({
  getExploreListing: vi.fn(),
}));

vi.mock('../../payments/api/paymentsApi', () => ({
  recordRazorpayFailure: vi.fn(),
  verifyRazorpayPayment: vi.fn(),
}));

vi.mock('../../payments/lib/razorpayCheckout', () => ({
  openRazorpayCheckout: vi.fn(),
}));

vi.mock('../../student/dashboard/context/studentDashboardContext', () => ({
  useStudentDashboard: () => ({ refresh: vi.fn() }),
}));

const product: ProductDetails = {
  id: 41,
  title: 'Casio scientific calculator',
  description: 'Lightly used calculator with its cover and manual.',
  additionalNotes: 'Inspect the calculator before campus handover.',
  category: 'Electronics',
  price: 1850,
  condition: 'LIKE_NEW',
  primaryImageUrl: null,
  pickupLocation: 'Central Library',
  negotiable: true,
  createdAt: new Date().toISOString(),
  seller: {
    id: 12,
    fullName: 'Priya Verma',
    profilePhotoUrl: null,
    trustScore: 86,
    verifiedStudent: true,
    collegeName: 'Rajkiya Engineering College Mainpuri',
    department: 'Computer Science Engineering',
    yearOfStudy: '3rd Year',
    trustLevel: 'Highly trusted',
    averageRating: 4.8,
    totalReviews: 12,
    successfulDeals: 9,
    memberSince: '2025-01-15T00:00:00Z',
  },
  availableQuantity: 1,
  status: 'ACTIVE',
  college: {
    id: 7,
    name: 'Rajkiya Engineering College Mainpuri',
    code: 'RECM',
  },
  images: [],
  wishlisted: false,
  ownListing: false,
  canBuy: true,
  canReport: true,
  similarListings: [
    {
      id: 42,
      title: 'Engineering drawing kit',
      description: 'Complete geometry and drafting set.',
      category: 'Electronics',
      price: 600,
      condition: 'GOOD',
      primaryImageUrl: null,
      pickupLocation: 'Academic Block',
      negotiable: false,
      createdAt: new Date().toISOString(),
      seller: {
        id: 18,
        fullName: 'Aman Singh',
        profilePhotoUrl: null,
        trustScore: 78,
      },
      wishlisted: false,
      ownListing: false,
    },
  ],
};

describe('ListingDetailsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getMarketplaceListing).mockResolvedValue(product);
    vi.mocked(getExploreListing).mockResolvedValue({
      ...product,
      college: {
        id: 2,
        name: 'IIT Bombay',
        code: 'IITB',
      },
      wishlisted: false,
      canBuy: false,
    });
    vi.mocked(addListingToWishlist).mockResolvedValue(undefined);
    vi.mocked(removeListingFromWishlist).mockResolvedValue(undefined);
    vi.mocked(reportMarketplaceListing).mockResolvedValue({
      reportId: 3,
      listingId: 41,
      reason: 'WRONG_PRODUCT_DETAILS',
      status: 'PENDING_REVIEW',
      submittedAt: new Date().toISOString(),
    });
    vi.mocked(initiateMarketplaceOrder).mockResolvedValue({
      order: {
        id: 81,
        orderNumber: 'CH-ORDER-81',
        listingId: 41,
        listingTitle: product.title,
        amount: product.price,
        orderStatus: 'PENDING_PAYMENT',
        paymentStatus: 'PENDING',
      },
      razorpay: {
        keyId: 'rzp_test_campus_hub',
        razorpayOrderId: 'order_test_81',
        amount: 185000,
        currency: 'INR',
        name: 'Campus Hub',
        description: `Payment for ${product.title}`,
      },
      prefill: {
        name: 'Marketplace Buyer',
        email: 'buyer@iitd.ac.in',
        contact: '+919800001001',
      },
    });
    vi.mocked(openRazorpayCheckout).mockResolvedValue({ type: 'dismissed' });
  });

  it('renders trust details and completes wishlist, report, and order-entry actions', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/listing/41']}>
        <Routes>
          <Route element={<ListingDetailsPage />} path="/listing/:id" />
        </Routes>
      </MemoryRouter>,
    );

    expect(
      await screen.findByRole('heading', {
        name: 'Casio scientific calculator',
      }),
    ).toBeInTheDocument();
    expect(screen.getByText('Priya Verma')).toBeInTheDocument();
    expect(screen.getByText('Verified Student')).toBeInTheDocument();
    expect(
      screen.getByRole('img', {
        name: 'Campus Trust Score 86 out of 100',
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Electronics' })).toHaveAttribute(
      'href',
      '/student/marketplace?search=Electronics',
    );
    expect(screen.getByText('Verified college listing')).toBeInTheDocument();
    expect(screen.getByText('Campus pickup')).toBeInTheDocument();
    expect(
      screen.getByText('Inspect the calculator before campus handover.'),
    ).toBeInTheDocument();
    expect(screen.getByText('Engineering drawing kit')).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'View seller profile' }),
    ).toHaveAttribute('href', '/user/public-profile/12');

    await user.click(screen.getByRole('button', { name: 'Add to wishlist' }));
    expect(addListingToWishlist).toHaveBeenCalledWith(41);
    expect(screen.getByRole('button', { name: 'Wishlisted' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );

    await user.click(screen.getByRole('button', { name: 'Report listing' }));
    await user.selectOptions(
      screen.getByRole('combobox'),
      'WRONG_PRODUCT_DETAILS',
    );
    await user.type(
      screen.getByPlaceholderText(
        'Briefly explain what seems wrong or unsafe.',
      ),
      'The model number does not match the description.',
    );
    await user.click(screen.getByRole('button', { name: 'Submit report' }));

    expect(reportMarketplaceListing).toHaveBeenCalledWith(
      41,
      'WRONG_PRODUCT_DETAILS',
      'The model number does not match the description.',
    );
    expect(
      await screen.findByText(/Campus Hub administrators can now review/i),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Buy now' }));
    await user.click(
      screen.getByRole('button', { name: 'Create order and pay securely' }),
    );

    expect(initiateMarketplaceOrder).toHaveBeenCalledWith(41);
    expect(openRazorpayCheckout).toHaveBeenCalledWith(
      expect.objectContaining({
        order: expect.objectContaining({ id: 81, amount: product.price }),
        razorpay: expect.objectContaining({
          amount: 185000,
          razorpayOrderId: 'order_test_81',
        }),
      }),
    );
    expect(
      await screen.findByRole('heading', { name: 'Order ready for payment' }),
    ).toBeInTheDocument();
    expect(screen.getByText('CH-ORDER-81')).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Continue to payments' }),
    ).toHaveAttribute('href', '/student/payments?orderId=81');
  });

  it('renders cross-college details as browse-only', async () => {
    render(
      <MemoryRouter initialEntries={['/student/explore-colleges/listing/41']}>
        <Routes>
          <Route
            element={<ListingDetailsPage exploreMode />}
            path="/student/explore-colleges/listing/:id"
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(
      await screen.findByRole('heading', {
        name: 'Casio scientific calculator',
      }),
    ).toBeInTheDocument();
    expect(getExploreListing).toHaveBeenCalledWith(41, expect.any(AbortSignal));
    expect(getMarketplaceListing).not.toHaveBeenCalled();
    expect(
      screen.getByText(/Browsing another verified college/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', {
        name: /Buying from other colleges is not available yet/i,
      }),
    ).toBeDisabled();
    expect(
      screen.queryByRole('button', { name: 'Add to wishlist' }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Report listing' }),
    ).toBeEnabled();
    expect(
      screen.getByRole('link', { name: 'Engineering drawing kit' }),
    ).toHaveAttribute('href', '/student/explore-colleges/listing/42');
  });
});
