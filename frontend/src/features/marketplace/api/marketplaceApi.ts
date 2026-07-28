import { apiClient } from '../../../lib/apiClient';
import {
  createPaymentCheckout,
  type PaymentCheckout,
} from '../../payments/api/paymentsApi';

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
  additionalNotes?: string | null;
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

export type CreateListingPayload = {
  title: string;
  category: string;
  description: string;
  price: number;
  condition: string;
  pickupLocation: string;
  negotiable: boolean;
  availableQuantity: number;
  additionalNotes: string | null;
};

export type CreatedListing = {
  id: number;
  title: string;
  price: number;
  category: string;
  condition: string;
  pickupLocation: string;
  negotiable: boolean;
  availableQuantity: number;
  status: 'ACTIVE';
  collegeName: string;
  sellerName: string;
  images: string[];
  createdAt: string;
};

export type MyListingStatus =
  'ACTIVE' | 'RESERVED' | 'SOLD' | 'INACTIVE' | 'UNDER_REVIEW' | 'BLOCKED';

export type SellerStats = {
  totalListings: number;
  activeListings: number;
  soldListings: number;
  inactiveListings: number;
  totalViews: number;
  totalWishlistSaves: number;
};

export type MyListingSummary = {
  id: number;
  title: string;
  price: number;
  category: string;
  condition: string;
  pickupLocation: string;
  status: MyListingStatus;
  coverImageUrl: string | null;
  views: number;
  wishlistCount: number;
  postedDate: string;
  updatedAt: string;
  negotiable: boolean;
};

export type MyMarketplace = {
  stats: SellerStats;
  listings: MyListingSummary[];
  pagination: {
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
    hasMore: boolean;
  };
};

export type MyMarketplaceQuery = {
  search?: string;
  status?: MyListingStatus;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  condition?: string;
  pickupLocation?: string;
  postedDate?: string;
  sortBy?:
    'newest' | 'priceAsc' | 'priceDesc' | 'mostViewed' | 'mostWishlisted';
  page?: number;
  size?: number;
};

export type MyListingDetails = {
  id: number;
  title: string;
  description: string;
  category: string;
  price: number;
  condition: string;
  pickupLocation: string;
  negotiable: boolean;
  availableQuantity: number;
  additionalNotes: string | null;
  status: MyListingStatus;
  collegeName: string;
  sellerName: string;
  images: string[];
  views: number;
  wishlistCount: number;
  createdAt: string;
  updatedAt: string;
};

export type ListingStatusUpdate = {
  id: number;
  status: MyListingStatus | 'DELETED';
  updatedAt: string;
};

export async function createMarketplaceListing(
  payload: CreateListingPayload,
  images: File[],
) {
  const body = new FormData();
  body.append(
    'listing',
    new Blob([JSON.stringify(payload)], { type: 'application/json' }),
  );
  images.forEach((image) => body.append('images', image));

  const response = await apiClient.post<ApiEnvelope<CreatedListing>>(
    '/listings',
    body,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
    },
  );
  return response.data.data;
}

export async function getMyMarketplace(
  query: MyMarketplaceQuery,
  signal?: AbortSignal,
) {
  const response = await apiClient.get<ApiEnvelope<MyMarketplace>>(
    '/listings/my',
    { params: query, signal },
  );
  return response.data.data;
}

export async function getMyListing(listingId: number, signal?: AbortSignal) {
  const response = await apiClient.get<ApiEnvelope<MyListingDetails>>(
    `/listings/my/${listingId}`,
    { signal },
  );
  return response.data.data;
}

export async function updateMarketplaceListing(
  listingId: number,
  payload: CreateListingPayload,
  replacementImages: File[],
) {
  const body = new FormData();
  body.append(
    'listing',
    new Blob([JSON.stringify(payload)], { type: 'application/json' }),
  );
  replacementImages.forEach((image) => body.append('images', image));

  const response = await apiClient.put<ApiEnvelope<MyListingDetails>>(
    `/listings/${listingId}`,
    body,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
    },
  );
  return response.data.data;
}

export async function updateMarketplaceListingStatus(
  listingId: number,
  action: 'mark-sold' | 'mark-inactive' | 'reactivate',
) {
  const response = await apiClient.patch<ApiEnvelope<ListingStatusUpdate>>(
    `/listings/${listingId}/${action}`,
  );
  return response.data.data;
}

export async function deleteMarketplaceListing(listingId: number) {
  const response = await apiClient.delete<ApiEnvelope<ListingStatusUpdate>>(
    `/listings/${listingId}`,
  );
  return response.data.data;
}

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
  | 'MISLEADING_IMAGES'
  | 'SUSPICIOUS_SELLER'
  | 'STOLEN_ITEM_SUSPICION'
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

export type OrderInitiation = PaymentCheckout;

export async function initiateMarketplaceOrder(listingId: number) {
  return createPaymentCheckout(listingId);
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
