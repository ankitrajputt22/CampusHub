import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useParams } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createMarketplaceListing } from '../api/marketplaceApi';
import { SellItemPage } from './SellItemPage';

vi.mock('../api/marketplaceApi', () => ({
  createMarketplaceListing: vi.fn(),
}));

vi.mock('../../student/lib/session', () => ({
  getCampusUser: () => ({
    id: 9,
    fullName: 'Ankit Rajput',
    collegeId: 7,
    collegeName: 'Rajkiya Engineering College Mainpuri',
    email: 'ankit241011@recmainpuri.in',
    role: 'STUDENT',
    accountStatus: 'ACTIVE',
    trustScore: 82,
  }),
}));

describe('SellItemPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createMarketplaceListing).mockResolvedValue({
      id: 101,
      title: 'Casio scientific calculator',
      price: 850,
      category: 'Electronics',
      condition: 'LIKE_NEW',
      pickupLocation: 'Central Library Gate',
      negotiable: true,
      availableQuantity: 1,
      status: 'ACTIVE',
      collegeName: 'Rajkiya Engineering College Mainpuri',
      sellerName: 'Ankit Rajput',
      images: ['/api/listings/images/listing-101-test.png'],
      createdAt: new Date().toISOString(),
    });
  });

  it('validates, previews, and posts a listing without sending seller or college identifiers', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/student/sell']}>
        <Routes>
          <Route element={<SellItemPage />} path="/student/sell" />
          <Route element={<CreatedListing />} path="/listing/:id" />
        </Routes>
      </MemoryRouter>,
    );

    const submitButton = screen.getByRole('button', { name: 'Post Listing' });
    expect(submitButton).toBeDisabled();
    expect(
      screen.getByText(/automatically fixes the seller and college/i),
    ).toBeInTheDocument();
    expect(screen.getByText('Ankit Rajput · 82/100 Trust')).toBeInTheDocument();

    await user.type(
      screen.getByLabelText(/Product title/),
      'Casio scientific calculator',
    );
    await user.selectOptions(screen.getByLabelText(/Category/), 'Electronics');
    await user.selectOptions(screen.getByLabelText(/Condition/), 'LIKE_NEW');
    await user.type(
      screen.getByLabelText(/Description/),
      'Used for one semester and working properly with its original cover.',
    );
    const priceInput = screen.getByLabelText(/Price/);
    await user.clear(priceInput);
    await user.type(priceInput, '850');
    await user.type(
      screen.getByLabelText(/Pickup location/),
      'Central Library Gate',
    );

    const image = new File(['calculator image'], 'calculator.png', {
      type: 'image/png',
    });
    await user.upload(screen.getByLabelText('Add product images'), image);

    await waitFor(() => expect(submitButton).toBeEnabled());
    expect(screen.getByText('1/5 selected')).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /Need pricing help/i }),
    ).toHaveAttribute('href', '/student/marketplace?search=Electronics');
    expect(
      screen.getByRole('heading', {
        name: 'Casio scientific calculator',
      }),
    ).toBeInTheDocument();
    await user.click(submitButton);

    await waitFor(() => {
      expect(createMarketplaceListing).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Casio scientific calculator',
          category: 'Electronics',
          price: 850,
          condition: 'LIKE_NEW',
          pickupLocation: 'Central Library Gate',
          negotiable: true,
          availableQuantity: 1,
          additionalNotes: null,
        }),
        [image],
      );
    });
    const submittedPayload = vi.mocked(createMarketplaceListing).mock
      .calls[0]?.[0];
    expect(submittedPayload).not.toHaveProperty('sellerId');
    expect(submittedPayload).not.toHaveProperty('collegeId');
    expect(await screen.findByText('Created listing 101')).toBeInTheDocument();
  });
});

function CreatedListing() {
  const { id } = useParams();
  return <p>Created listing {id}</p>;
}
