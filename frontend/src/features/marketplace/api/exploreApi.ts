import { apiClient } from '../../../lib/apiClient';
import type { ProductDetails } from './marketplaceApi';

type ApiEnvelope<T> = {
  success: boolean;
  message: string;
  data: T;
};

export type ExploreViewerContext = {
  verifiedCollegeId: number;
  verifiedCollegeName: string;
  verifiedCollegeCode: string;
};

export type ExploreCollege = {
  id: number;
  name: string;
  code: string;
  emailDomain: string;
  city: string;
  state: string;
  logoUrl: string | null;
  activeListings: number;
  verifiedStudents: number;
  recentlyAddedListings: number;
  popularCategories: string[];
};

export type ExploreColleges = {
  viewerContext: ExploreViewerContext;
  popularColleges: ExploreCollege[];
  colleges: ExploreCollege[];
};

export type ExploreListing = {
  id: number;
  title: string;
  description: string;
  category: string;
  price: number;
  condition: string;
  primaryImageUrl: string | null;
  pickupLocation: string;
  negotiable: boolean;
  createdAt: string;
  college: {
    id: number;
    name: string;
    code: string;
  };
  seller: {
    id: number;
    fullName: string;
    profilePhotoUrl: string | null;
    trustScore: number;
    trustLevel: string;
  };
  availableActions: Array<'VIEW_DETAILS' | 'REPORT'>;
};

export type ExploreMarketplace = {
  viewerContext: ExploreViewerContext & {
    browsingCollegeId: number;
    ownCollege: false;
    crossCollegeBuyingEnabled: false;
  };
  selectedCollege: ExploreCollege;
  listings: ExploreListing[];
  pagination: {
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
    hasMore: boolean;
  };
  pickupLocations: string[];
};

export type ExploreMarketplaceQuery = {
  collegeId: number;
  search?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  condition?: string;
  pickupLocation?: string;
  negotiable?: boolean;
  postedDate?: string;
  minSellerTrust?: number;
  sortBy?: 'newest' | 'priceAsc' | 'priceDesc';
  page?: number;
  size?: number;
};

export async function getExploreColleges(
  search?: string,
  signal?: AbortSignal,
) {
  const response = await apiClient.get<ApiEnvelope<ExploreColleges>>(
    '/colleges/explore',
    { params: { search }, signal },
  );
  return response.data.data;
}

export async function getExploreMarketplace(
  query: ExploreMarketplaceQuery,
  signal?: AbortSignal,
) {
  const response = await apiClient.get<ApiEnvelope<ExploreMarketplace>>(
    '/listings/explore',
    { params: query, signal },
  );
  return response.data.data;
}

export async function getExploreListing(
  listingId: number,
  signal?: AbortSignal,
) {
  const response = await apiClient.get<ApiEnvelope<ProductDetails>>(
    `/listings/explore/${listingId}`,
    { signal },
  );
  return response.data.data;
}
