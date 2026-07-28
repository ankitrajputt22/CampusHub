import { apiClient } from '../../../lib/apiClient';

export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED';

export type PaymentCheckout = {
  order: {
    id: number;
    orderNumber: string;
    listingId: number;
    listingTitle: string;
    amount: number;
    orderStatus: string;
    paymentStatus: PaymentStatus;
  };
  razorpay: {
    keyId: string;
    razorpayOrderId: string;
    amount: number;
    currency: 'INR';
    name: string;
    description: string;
  };
  prefill: {
    name: string;
    email: string;
    contact: string;
  };
};

export type RazorpaySuccess = {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
};

export type RazorpayFailure = {
  error?: {
    code?: string;
    description?: string;
    metadata?: {
      order_id?: string;
      payment_id?: string;
    };
  };
};

export type CheckoutOutcome =
  | { type: 'success'; response: RazorpaySuccess }
  | { type: 'failed'; response: RazorpayFailure }
  | { type: 'dismissed' };

export type PaymentSummary = {
  id: number;
  orderId: number;
  orderNumber: string;
  role: 'BUYER' | 'SELLER';
  listingId: number;
  productTitle: string;
  coverImageUrl: string | null;
  amount: number;
  currency: string;
  paymentStatus: PaymentStatus;
  orderStatus: string;
  paymentMethod: string;
  razorpayPaymentId: string | null;
  refundStatus: string;
  failureReason: string | null;
  paymentDate: string | null;
  createdAt: string;
  canRetry: boolean;
};

export type PaymentsPageData = {
  stats: {
    totalPayments: number;
    successfulPayments: number;
    pendingPayments: number;
    failedPayments: number;
    refundedPayments: number;
    totalSpent: number;
  };
  payments: PaymentSummary[];
  pagination: {
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
    hasMore: boolean;
  };
};

type ApiEnvelope<T> = {
  success: boolean;
  message: string;
  data: T;
};

export async function createPaymentCheckout(listingId: number) {
  const response = await apiClient.post<ApiEnvelope<PaymentCheckout>>(
    `/orders/create-from-listing/${listingId}`,
  );
  return response.data.data;
}

export async function retryPaymentCheckout(orderId: number) {
  const response = await apiClient.post<ApiEnvelope<PaymentCheckout>>(
    `/payments/razorpay/retry/${orderId}`,
  );
  return response.data.data;
}

export async function verifyRazorpayPayment(
  checkout: PaymentCheckout,
  success: RazorpaySuccess,
) {
  const response = await apiClient.post<
    ApiEnvelope<{
      verified: true;
      order: {
        id: number;
        orderNumber: string;
        orderStatus: 'PAID';
        paymentStatus: 'SUCCESS';
        amount: number;
      };
      payment: {
        id: number;
        razorpayPaymentId: string;
        razorpayOrderId: string;
        status: 'SUCCESS';
        paidAt: string;
      };
      listing: { id: number; status: string };
    }>
  >('/payments/razorpay/verify', {
    campusHubOrderId: checkout.order.id,
    razorpayOrderId: success.razorpay_order_id,
    razorpayPaymentId: success.razorpay_payment_id,
    razorpaySignature: success.razorpay_signature,
  });
  return response.data.data;
}

export async function recordRazorpayFailure(
  checkout: PaymentCheckout,
  failure: RazorpayFailure,
) {
  const response = await apiClient.post<
    ApiEnvelope<{
      orderId: number;
      paymentId: number;
      orderStatus: string;
      paymentStatus: PaymentStatus;
      failureReason: string;
      updatedAt: string;
    }>
  >('/payments/razorpay/failure', {
    campusHubOrderId: checkout.order.id,
    razorpayOrderId: checkout.razorpay.razorpayOrderId,
    errorCode: failure.error?.code ?? 'PAYMENT_FAILED',
    errorDescription:
      failure.error?.description ?? 'Razorpay Checkout reported a failure.',
  });
  return response.data.data;
}

export async function getMyPayments(
  query: {
    search?: string;
    status?: PaymentStatus;
    page?: number;
    size?: number;
  },
  signal?: AbortSignal,
) {
  const response = await apiClient.get<ApiEnvelope<PaymentsPageData>>(
    '/payments/my',
    { params: query, signal },
  );
  return response.data.data;
}
