import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  getExploreColleges,
  getExploreMarketplace,
  type ExploreCollege,
} from '../api/exploreApi';
import { reportMarketplaceListing } from '../api/marketplaceApi';
import { ExploreCollegesPage } from './ExploreCollegesPage';

vi.mock('../api/exploreApi', () => ({
  getExploreColleges: vi.fn(),
  getExploreMarketplace: vi.fn(),
}));

vi.mock('../api/marketplaceApi', () => ({
  reportMarketplaceListing: vi.fn(),
}));

const bombay: ExploreCollege = {
  id: 2,
  name: 'IIT Bombay',
  code: 'IITB',
  emailDomain: 'iitb.ac.in',
  city: 'Mumbai',
  state: 'Maharashtra',
  logoUrl: null,
  activeListings: 1,
  verifiedStudents: 42,
  recentlyAddedListings: 1,
  popularCategories: ['Electronics'],
};

describe('ExploreCollegesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getExploreColleges).mockResolvedValue({
      viewerContext: {
        verifiedCollegeId: 1,
        verifiedCollegeName: 'IIT Delhi',
        verifiedCollegeCode: 'IITD',
      },
      popularColleges: [bombay],
      colleges: [bombay],
    });
    vi.mocked(getExploreMarketplace).mockResolvedValue({
      viewerContext: {
        verifiedCollegeId: 1,
        verifiedCollegeName: 'IIT Delhi',
        verifiedCollegeCode: 'IITD',
        browsingCollegeId: 2,
        ownCollege: false,
        crossCollegeBuyingEnabled: false,
      },
      selectedCollege: bombay,
      listings: [
        {
          id: 84,
          title: 'Robotics starter kit',
          description: 'Complete kit for a first-year robotics project.',
          category: 'Electronics',
          price: 2450,
          condition: 'LIKE_NEW',
          primaryImageUrl: null,
          pickupLocation: 'Main Gate',
          negotiable: true,
          createdAt: '2026-07-26T09:00:00Z',
          college: { id: 2, name: 'IIT Bombay', code: 'IITB' },
          seller: {
            id: 19,
            fullName: 'Aarav Mehta',
            profilePhotoUrl: null,
            trustScore: 87,
            trustLevel: 'Trusted Student',
          },
          availableActions: ['VIEW_DETAILS', 'REPORT'],
        },
      ],
      pagination: {
        page: 0,
        size: 12,
        totalElements: 1,
        totalPages: 1,
        hasMore: false,
      },
      pickupLocations: ['Main Gate'],
    });
    vi.mocked(reportMarketplaceListing).mockResolvedValue({
      reportId: 7,
      listingId: 84,
      reason: 'OTHER',
      status: 'PENDING_REVIEW',
      submittedAt: '2026-07-27T09:00:00Z',
    });
  });

  it('keeps the verified college fixed and opens a browse-only marketplace', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/student/explore-colleges']}>
        <Routes>
          <Route
            element={<ExploreCollegesPage />}
            path="/student/explore-colleges"
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(
      await screen.findByText(/Your verified college remains IIT Delhi/i),
    ).toBeInTheDocument();
    expect(screen.getAllByText('IIT Bombay').length).toBeGreaterThan(0);

    await user.click(
      screen.getAllByRole('button', { name: /Explore 1 listings/i })[0],
    );

    await waitFor(() =>
      expect(getExploreMarketplace).toHaveBeenCalledWith(
        expect.objectContaining({
          collegeId: 2,
          sortBy: 'newest',
          page: 0,
          size: 12,
        }),
        expect.any(AbortSignal),
      ),
    );
    expect(
      await screen.findByRole('link', { name: 'Robotics starter kit' }),
    ).toHaveAttribute('href', '/student/explore-colleges/listing/84');
    expect(
      screen.getByText(/Buying from other colleges is not available yet/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/View and report only — buying is disabled/i),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /wishlist/i })).toBeNull();
  });
});
