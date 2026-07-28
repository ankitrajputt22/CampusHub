import { apiClient } from '../../../lib/apiClient';

type ApiEnvelope<T> = {
  success: boolean;
  message: string;
  data: T;
};

export type PendingReview = {
  orderId: number;
  orderNumber: string;
  listingId: number;
  listingTitle: string;
  coverImageUrl: string | null;
  sellerId: number;
  sellerName: string;
  completedAt: string;
};

export type ReviewItem = {
  id: number;
  orderId: number;
  orderNumber: string;
  listingId: number;
  listingTitle: string;
  reviewerName: string;
  revieweeName: string;
  rating: number;
  message: string;
  createdAt: string;
};

export type ReviewWorkspace = {
  stats: {
    averageRating: number;
    receivedReviews: number;
    givenReviews: number;
    pendingReviews: number;
  };
  pendingReviews: PendingReview[];
  receivedReviews: ReviewItem[];
  givenReviews: ReviewItem[];
};

export async function getReviewWorkspace(signal?: AbortSignal) {
  const response = await apiClient.get<ApiEnvelope<ReviewWorkspace>>(
    '/reviews/my',
    { signal },
  );
  return response.data.data;
}

export async function submitOrderReview(
  orderId: number,
  payload: { rating: number; message: string },
) {
  const response = await apiClient.post<ApiEnvelope<ReviewItem>>(
    `/reviews/orders/${orderId}`,
    payload,
  );
  return response.data.data;
}
