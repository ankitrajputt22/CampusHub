import { apiClient } from '../../../lib/apiClient';

export type WishlistListingStatus =
  | 'ACTIVE'
  | 'RESERVED'
  | 'SOLD'
  | 'INACTIVE'
  | 'DELETED'
  | 'BLOCKED'
  | 'UNDER_REVIEW';

export type WishlistStats = {
  totalItems: number;
  availableItems: number;
  unavailableItems: number;
};

export type WishlistItem = {
  wishlistId: number;
  savedAt: string;
  listing: {
    id: number;
    title: string;
    price: number;
    category: string;
    condition: string;
    pickupLocation: string;
    status: WishlistListingStatus;
    coverImageUrl: string | null;
    available: boolean;
    seller: {
      id: number;
      fullName: string;
      trustScore: number;
      trustLevel: string;
    };
  };
};

export type WishlistPageData = {
  stats: WishlistStats;
  items: WishlistItem[];
  pagination: {
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
    hasMore: boolean;
  };
};

export type WishlistQuery = {
  search?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  condition?: string;
  status?: WishlistListingStatus | 'AVAILABLE' | 'UNAVAILABLE';
  minSellerTrust?: number;
  savedDate?: 'today' | 'week' | 'month';
  sortBy?: 'recent' | 'oldest' | 'priceAsc' | 'priceDesc' | 'trusted';
  page?: number;
  size?: number;
};

type ApiEnvelope<T> = {
  success: boolean;
  message: string;
  data: T;
};

export async function getWishlist(query: WishlistQuery, signal?: AbortSignal) {
  const response = await apiClient.get<ApiEnvelope<WishlistPageData>>(
    '/wishlist',
    { params: query, signal },
  );
  return response.data.data;
}

export async function removeWishlistItem(listingId: number) {
  const response = await apiClient.delete<
    ApiEnvelope<{ listingId: number; wishlisted: false }>
  >(`/wishlist/${listingId}`);
  return response.data.data;
}

export async function getWishlistCount(signal?: AbortSignal) {
  const response = await apiClient.get<ApiEnvelope<{ count: number }>>(
    '/wishlist/count',
    { signal },
  );
  return response.data.data.count;
}
