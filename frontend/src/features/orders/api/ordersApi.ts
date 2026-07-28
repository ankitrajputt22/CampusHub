import { apiClient } from '../../../lib/apiClient';

export type OrderRole = 'BUYER' | 'SELLER';
export type OrderStatus =
  | 'PENDING_PAYMENT'
  | 'PAID'
  | 'READY_FOR_PICKUP'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'REFUNDED'
  | 'PAYMENT_FAILED'
  | 'EXPIRED'
  | 'PENDING'
  | 'CONFIRMED';
export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED';
export type OrderAction =
  | 'VIEW_DETAILS'
  | 'PAY_NOW'
  | 'CANCEL_ORDER'
  | 'CONFIRM_PICKUP'
  | 'WRITE_REVIEW'
  | 'MARK_READY_FOR_PICKUP';

export type OrderListing = {
  id: number;
  title: string;
  category: string;
  condition: string;
  coverImageUrl: string | null;
};

export type OrderParty = {
  id: number;
  fullName: string;
  profilePhotoUrl: string | null;
  trustScore: number;
  trustLevel: string;
};

export type OrderSummary = {
  id: number;
  orderNumber: string;
  role: OrderRole;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  amount: number;
  createdAt: string;
  updatedAt: string;
  pickupLocation: string;
  listing: OrderListing;
  otherParty: OrderParty;
  availableActions: OrderAction[];
};

export type OrdersPageData = {
  stats: {
    totalOrders: number;
    pendingPayment: number;
    paidOrders: number;
    readyForPickup: number;
    completedOrders: number;
    cancelledOrders: number;
  };
  orders: OrderSummary[];
  pagination: {
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
    hasMore: boolean;
  };
};

export type OrderDetails = Omit<OrderSummary, 'availableActions'> & {
  paidAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  timeline: {
    status: OrderStatus;
    note: string;
    createdAt: string;
  }[];
  availableActions: OrderAction[];
};

export type OrdersQuery = {
  search?: string;
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  dateRange?: 'today' | 'week' | 'month';
  sortBy?: 'recent' | 'oldest' | 'priceAsc' | 'priceDesc';
  page?: number;
  size?: number;
};

type ApiEnvelope<T> = {
  success: boolean;
  message: string;
  data: T;
};

export async function getOrders(
  role: OrderRole,
  query: OrdersQuery,
  signal?: AbortSignal,
) {
  const endpoint = role === 'BUYER' ? '/orders/buyer' : '/orders/seller';
  const response = await apiClient.get<ApiEnvelope<OrdersPageData>>(endpoint, {
    params: query,
    signal,
  });
  return response.data.data;
}

export async function getOrderDetails(orderId: number, signal?: AbortSignal) {
  const response = await apiClient.get<ApiEnvelope<OrderDetails>>(
    `/orders/${orderId}`,
    { signal },
  );
  return response.data.data;
}

export async function cancelOrder(orderId: number) {
  const response = await apiClient.patch<ApiEnvelope<OrderActionResult>>(
    `/orders/${orderId}/cancel`,
  );
  return response.data.data;
}

export async function markOrderReady(orderId: number) {
  const response = await apiClient.patch<ApiEnvelope<OrderActionResult>>(
    `/orders/${orderId}/ready-for-pickup`,
  );
  return response.data.data;
}

export async function confirmOrderPickup(orderId: number) {
  const response = await apiClient.patch<ApiEnvelope<OrderActionResult>>(
    `/orders/${orderId}/confirm-pickup`,
  );
  return response.data.data;
}

export type OrderActionResult = {
  orderId: number;
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  updatedAt: string;
  message: string;
};
