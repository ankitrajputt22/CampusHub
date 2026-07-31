import { apiClient } from '../../../lib/apiClient';

type ApiEnvelope<T> = {
  success: boolean;
  message: string;
  data: T;
};

export type Pagination = {
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  hasMore: boolean;
};

export type PageResponse<T> = {
  items: T[];
  pagination: Pagination;
};

export type AuditLogItem = {
  id: number;
  adminId: number;
  adminName: string;
  actionType: string;
  targetType: string;
  targetId: number | null;
  previousValue: string | null;
  newValue: string | null;
  note: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
};

export type AdminDashboard = {
  stats: {
    totalUsers: number;
    activeUsers: number;
    totalListings: number;
    activeListings: number;
    totalOrders: number;
    pendingReports: number;
    blockedListings: number;
    totalReviews: number;
  };
  pendingReports: Array<{
    id: number;
    type: string;
    reason: string;
    priority: string;
    targetTitle: string;
    reporterName: string;
    reporterCollege: string;
    createdAt: string;
  }>;
  recentListings: RecentListing[];
  recentUsers: Array<{
    id: number;
    fullName: string;
    collegeName: string;
    emailVerified: boolean;
    phoneVerified: boolean;
    accountStatus: string;
    trustScore: number;
    createdAt: string;
  }>;
  orderPaymentSummary: {
    totalOrders: number;
    completedOrders: number;
    successfulPayments: number;
    failedPayments: number;
    pendingPayments: number;
  };
  moderationActivity: AuditLogItem[];
};

export type RecentListing = {
  id: number;
  title: string;
  imageUrl: string | null;
  sellerName: string;
  collegeName: string;
  status: string;
  price: number;
  createdAt: string;
};

export type AdminUser = {
  id: number;
  fullName: string;
  collegeName: string;
  collegeId: number;
  collegeEmail: string;
  phoneNumber: string;
  phoneVerified: boolean;
  emailVerified: boolean;
  role: 'STUDENT' | 'ADMIN' | 'SUPER_ADMIN';
  accountStatus: string;
  trustScore: number;
  averageRating: number;
  totalListings: number;
  totalOrders: number;
  lastLoginAt: string | null;
  createdAt: string;
};

export type AdminUserDetails = {
  user: AdminUser;
  department: string;
  course: string;
  yearOfStudy: string;
  rollNumber: string | null;
  campusArea: string;
  reportsSubmitted: number;
  reportsReceived: number;
  recentListings: RecentListing[];
  moderationHistory: AuditLogItem[];
};

export type AdminListing = {
  id: number;
  title: string;
  imageUrl: string | null;
  sellerId: number;
  sellerName: string;
  collegeId: number;
  collegeName: string;
  category: string;
  price: number;
  condition: string;
  status: string;
  reportCount: number;
  wishlistCount: number;
  views: number;
  createdAt: string;
};

export type AdminListingDetails = {
  listing: AdminListing;
  description: string;
  pickupLocation: string;
  negotiable: boolean;
  availableQuantity: number;
  additionalNotes: string | null;
  sellerStatus: string;
  sellerTrustScore: number;
  linkedOrders: number;
  moderationHistory: AuditLogItem[];
};

export type AdminReview = {
  id: number;
  rating: number;
  comment: string;
  buyerId: number;
  buyerName: string;
  sellerId: number;
  sellerName: string;
  listingId: number;
  listingTitle: string;
  orderId: number;
  orderNumber: string;
  collegeName: string;
  status: string;
  reportCount: number;
  createdAt: string;
};

export type AdminOrder = {
  id: number;
  orderNumber: string;
  buyerId: number;
  buyerName: string;
  sellerId: number;
  sellerName: string;
  listingId: number;
  listingTitle: string;
  collegeName: string;
  amount: number;
  orderStatus: string;
  paymentStatus: string;
  pickupLocation: string;
  paidAt: string | null;
  completedAt: string | null;
  createdAt: string;
};

export type AdminPayment = {
  id: number;
  orderId: number;
  orderNumber: string;
  buyerId: number;
  buyerName: string;
  sellerId: number;
  sellerName: string;
  collegeName: string;
  amount: number;
  currency: string;
  paymentStatus: string;
  refundStatus: string;
  razorpayOrderId: string;
  razorpayPaymentId: string | null;
  paymentMethod: string | null;
  failureReason: string | null;
  paidAt: string | null;
  createdAt: string;
};

export type ModerationResult = {
  reportId: number | null;
  reportStatus: string | null;
  action: string;
  targetType: string;
  targetId: number;
  targetStatus: string;
  updatedAt: string;
};

export async function getAdminDashboard(signal?: AbortSignal) {
  const response = await apiClient.get<ApiEnvelope<AdminDashboard>>(
    '/admin/dashboard',
    { signal },
  );
  return response.data.data;
}

export async function getAdminUsers(
  params: Record<string, string | number | boolean | undefined>,
  signal?: AbortSignal,
) {
  const response = await apiClient.get<ApiEnvelope<PageResponse<AdminUser>>>(
    '/admin/users',
    { params, signal },
  );
  return response.data.data;
}

export async function getAdminUser(userId: number, signal?: AbortSignal) {
  const response = await apiClient.get<ApiEnvelope<AdminUserDetails>>(
    `/admin/users/${userId}`,
    { signal },
  );
  return response.data.data;
}

export async function getAdminListings(
  params: Record<string, string | number | undefined>,
  signal?: AbortSignal,
) {
  const response = await apiClient.get<ApiEnvelope<PageResponse<AdminListing>>>(
    '/admin/listings',
    { params, signal },
  );
  return response.data.data;
}

export async function getAdminListing(listingId: number, signal?: AbortSignal) {
  const response = await apiClient.get<ApiEnvelope<AdminListingDetails>>(
    `/admin/listings/${listingId}`,
    { signal },
  );
  return response.data.data;
}

export async function getAdminReviews(
  params: Record<string, string | number | boolean | undefined>,
  signal?: AbortSignal,
) {
  const response = await apiClient.get<ApiEnvelope<PageResponse<AdminReview>>>(
    '/admin/reviews',
    { params, signal },
  );
  return response.data.data;
}

export async function getAdminReview(reviewId: number, signal?: AbortSignal) {
  const response = await apiClient.get<ApiEnvelope<AdminReview>>(
    `/admin/reviews/${reviewId}`,
    { signal },
  );
  return response.data.data;
}

export async function getAdminOrders(
  params: Record<string, string | number | undefined>,
  signal?: AbortSignal,
) {
  const response = await apiClient.get<ApiEnvelope<PageResponse<AdminOrder>>>(
    '/admin/orders',
    { params, signal },
  );
  return response.data.data;
}

export async function getAdminOrder(orderId: number, signal?: AbortSignal) {
  const response = await apiClient.get<ApiEnvelope<AdminOrder>>(
    `/admin/orders/${orderId}`,
    { signal },
  );
  return response.data.data;
}

export async function getAdminPayments(
  params: Record<string, string | number | undefined>,
  signal?: AbortSignal,
) {
  const response = await apiClient.get<ApiEnvelope<PageResponse<AdminPayment>>>(
    '/admin/payments',
    { params, signal },
  );
  return response.data.data;
}

export async function getAdminPayment(paymentId: number, signal?: AbortSignal) {
  const response = await apiClient.get<ApiEnvelope<AdminPayment>>(
    `/admin/payments/${paymentId}`,
    { signal },
  );
  return response.data.data;
}

export async function getAdminAuditLogs(
  params: Record<string, string | number | undefined>,
  signal?: AbortSignal,
) {
  const response = await apiClient.get<ApiEnvelope<PageResponse<AuditLogItem>>>(
    '/admin/audit-logs',
    { params, signal },
  );
  return response.data.data;
}

export async function moderateUser(
  userId: number,
  action: 'warn' | 'suspend' | 'block' | 'reactivate',
  note: string,
) {
  const response = await apiClient.patch<ApiEnvelope<ModerationResult>>(
    `/admin/users/${userId}/${action}`,
    { note },
  );
  return response.data.data;
}

export async function moderateListing(
  listingId: number,
  action: 'under-review' | 'block' | 'restore',
  note: string,
) {
  const response = await apiClient.patch<ApiEnvelope<ModerationResult>>(
    `/admin/listings/${listingId}/${action}`,
    { note },
  );
  return response.data.data;
}

export async function deleteListing(listingId: number, note: string) {
  const response = await apiClient.delete<ApiEnvelope<ModerationResult>>(
    `/admin/listings/${listingId}`,
    { data: { note } },
  );
  return response.data.data;
}

export async function moderateReview(
  reviewId: number,
  action: 'hide' | 'restore',
  note: string,
) {
  const response = await apiClient.patch<ApiEnvelope<ModerationResult>>(
    `/admin/reviews/${reviewId}/${action}`,
    { note },
  );
  return response.data.data;
}
