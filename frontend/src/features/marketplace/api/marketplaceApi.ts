import { apiClient } from '../../../lib/apiClient';

export type MarketplaceSeller = {
  id: number;
  fullName: string;
  profilePhotoUrl: string | null;
  trustScore: number;
};

export type MarketplaceListing = {
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
  seller: MarketplaceSeller;
  wishlisted: boolean;
  ownListing: boolean;
};

export type ProductSeller = MarketplaceSeller & {
  verifiedStudent: boolean;
  collegeName: string;
  department: string | null;
  yearOfStudy: string | null;
  trustLevel: string;
  averageRating: number;
  totalReviews: number;
  successfulDeals: number;
  memberSince: string;
};

export type ProductDetails = Omit<MarketplaceListing, 'seller'> & {
  seller: ProductSeller;
  availableQuantity: number;
  status: string;
  college: {
    id: number;
    name: string;
    code: string;
  };
  images: string[];
  canBuy: boolean;
  canReport: boolean;
  similarListings: MarketplaceListing[];
};

export type CollegeMarketplace = {
  college: {
    id: number;
    name: string;
    code: string;
  };
  listings: MarketplaceListing[];
  pagination: {
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
    hasMore: boolean;
  };
  pickupLocations: string[];
};

export type MarketplaceQuery = {
  search?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  condition?: string;
  pickupLocation?: string;
  negotiable?: boolean;
  postedDate?: string;
  minSellerTrust?: number;
  sortBy?: 'newest' | 'priceAsc' | 'priceDesc' | 'trusted';
  page?: number;
  size?: number;
};

type ApiEnvelope<T> = {
  success: boolean;
  message: string;
  data: T;
};

export async function getMyCollegeMarketplace(
  query: MarketplaceQuery,
  signal?: AbortSignal,
) {
  const response = await apiClient.get<ApiEnvelope<CollegeMarketplace>>(
    '/listings/my-college',
    { params: query, signal },
  );
  return response.data.data;
}

export async function getMarketplaceListing(
  listingId: number,
  signal?: AbortSignal,
) {
  const response = await apiClient.get<ApiEnvelope<ProductDetails>>(
    `/listings/my-college/${listingId}`,
    { signal },
  );
  return response.data.data;
}

export async function addListingToWishlist(listingId: number) {
  await apiClient.post(`/wishlist/${listingId}`);
}

export async function removeListingFromWishlist(listingId: number) {
  await apiClient.delete(`/wishlist/${listingId}`);
}

export type ListingReportReason =
  | 'FAKE_LISTING'
  | 'WRONG_PRODUCT_DETAILS'
  | 'SUSPICIOUS_SELLER'
  | 'PROHIBITED_ITEM'
  | 'ABUSIVE_CONTENT'
  | 'DUPLICATE_LISTING'
  | 'PRICE_SCAM'
  | 'OTHER';

export async function reportMarketplaceListing(
  listingId: number,
  reason: ListingReportReason,
  description: string,
) {
  const response = await apiClient.post<
    ApiEnvelope<{
      reportId: number;
      listingId: number;
      reason: ListingReportReason;
      status: string;
      submittedAt: string;
    }>
  >(`/reports/listing/${listingId}`, { reason, description });
  return response.data.data;
}

export type OrderInitiation = {
  orderId: number;
  listingId: number;
  listingTitle: string;
  amount: number;
  status: 'PENDING_PAYMENT';
  paymentRequired: boolean;
  nextStep: string;
  createdAt: string;
};

export async function initiateMarketplaceOrder(listingId: number) {
  const response = await apiClient.post<ApiEnvelope<OrderInitiation>>(
    `/orders/listings/${listingId}`,
  );
  return response.data.data;
}

export type PublicSellerProfile = {
  id: number;
  fullName: string;
  collegeName: string;
  profilePhotoUrl: string | null;
  department: string | null;
  yearOfStudy: string | null;
  bio: string | null;
  linkedinUrl: string | null;
  githubUrl: string | null;
  hostelArea: string | null;
  isVerifiedStudent: boolean;
  trustScore: number;
  trustLevel: string;
  averageRating: number;
  totalReviews: number;
  successfulDeals: number;
  activeListings: number;
};

export async function getPublicSellerProfile(
  sellerId: number,
  signal?: AbortSignal,
) {
  const response = await apiClient.get<ApiEnvelope<PublicSellerProfile>>(
    `/user/public-profile/${sellerId}`,
    { signal },
  );
  return response.data.data;
}
