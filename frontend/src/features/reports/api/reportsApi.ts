import { apiClient } from '../../../lib/apiClient';

export type ReportType = 'LISTING' | 'USER' | 'REVIEW';
export type ReportStatus =
  'PENDING' | 'UNDER_REVIEW' | 'ACTION_TAKEN' | 'REJECTED' | 'CLOSED';
export type ReportPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

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

export type UserReportReason =
  | 'SUSPICIOUS_BEHAVIOR'
  | 'FAKE_IDENTITY'
  | 'SCAM_ATTEMPT'
  | 'HARASSMENT'
  | 'REPEATED_FAKE_LISTINGS'
  | 'PAYMENT_RELATED_ISSUE'
  | 'UNSAFE_PICKUP_BEHAVIOR'
  | 'OTHER';

export type ReviewReportReason =
  | 'ABUSIVE_LANGUAGE'
  | 'FAKE_REVIEW'
  | 'SPAM'
  | 'PERSONAL_INFORMATION_EXPOSED'
  | 'IRRELEVANT_REVIEW'
  | 'FALSE_CLAIM'
  | 'OTHER';

export type ReportReason =
  ListingReportReason | UserReportReason | ReviewReportReason;

type ApiEnvelope<T> = {
  success: boolean;
  message: string;
  data: T;
};

export type SubmittedReport = {
  reportId: number;
  type: ReportType;
  entityId: number;
  listingId: number | null;
  reason: ReportReason;
  status: ReportStatus;
  priority: ReportPriority;
  submittedAt: string;
};

export type ReportItem = {
  id: number;
  type: ReportType;
  entityId: number;
  targetTitle: string;
  targetSubtitle: string;
  targetStatus: string;
  reason: ReportReason;
  description: string | null;
  status: ReportStatus;
  priority: ReportPriority;
  adminResponse: string | null;
  submittedAt: string;
  updatedAt: string;
};

export type ReportPage = {
  stats: {
    total: number;
    pending: number;
    underReview: number;
    actionTaken: number;
    rejected: number;
    closed: number;
  };
  reports: ReportItem[];
  pagination: {
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
    hasMore: boolean;
  };
};

export type AdminReportQueue = {
  stats: {
    total: number;
    pending: number;
    underReview: number;
    critical: number;
    resolved: number;
  };
  reports: Array<{
    id: number;
    type: ReportType;
    entityId: number;
    targetTitle: string;
    targetStatus: string;
    reporterName: string;
    reporterCollege: string;
    reason: ReportReason;
    status: ReportStatus;
    priority: ReportPriority;
    submittedAt: string;
    updatedAt: string;
  }>;
  pagination: ReportPage['pagination'];
};

export type AdminReportDetails = {
  id: number;
  type: ReportType;
  entityId: number;
  reason: ReportReason;
  description: string | null;
  status: ReportStatus;
  priority: ReportPriority;
  adminResponse: string | null;
  submittedAt: string;
  updatedAt: string;
  reviewedAt: string | null;
  reporter: {
    id: number;
    fullName: string;
    collegeName: string;
  };
  target: {
    id: number;
    title: string;
    subtitle: string;
    status: string;
    ownerId: number;
    ownerName: string;
  };
  previousReportsForTarget: number;
  moderationHistory: Array<{
    id: number;
    action: string;
    targetType: string;
    targetId: number;
    previousState: string | null;
    newState: string | null;
    note: string | null;
    moderatorName: string;
    createdAt: string;
  }>;
};

export type ModerationResult = {
  reportId: number;
  reportStatus: ReportStatus;
  action: string;
  targetType: string;
  targetId: number;
  targetStatus: string;
  updatedAt: string;
};

export async function reportUser(
  userId: number,
  reason: UserReportReason,
  description: string,
) {
  const response = await apiClient.post<ApiEnvelope<SubmittedReport>>(
    `/reports/user/${userId}`,
    { reason, description },
  );
  return response.data.data;
}

export async function reportReview(
  reviewId: number,
  reason: ReviewReportReason,
  description: string,
) {
  const response = await apiClient.post<ApiEnvelope<SubmittedReport>>(
    `/reports/review/${reviewId}`,
    { reason, description },
  );
  return response.data.data;
}

export async function getMyReports(
  query: {
    type?: ReportType;
    status?: ReportStatus;
    page?: number;
    size?: number;
    sortBy?: 'newest' | 'oldest';
  },
  signal?: AbortSignal,
) {
  const response = await apiClient.get<ApiEnvelope<ReportPage>>('/reports/my', {
    params: query,
    signal,
  });
  return response.data.data;
}

export async function getAdminReports(
  query: {
    type?: ReportType;
    status?: ReportStatus;
    priority?: ReportPriority;
    page?: number;
    size?: number;
    sortBy?: 'newest' | 'oldest' | 'priority';
  },
  signal?: AbortSignal,
) {
  const response = await apiClient.get<ApiEnvelope<AdminReportQueue>>(
    '/admin/reports',
    { params: query, signal },
  );
  return response.data.data;
}

export async function getAdminReport(reportId: number, signal?: AbortSignal) {
  const response = await apiClient.get<ApiEnvelope<AdminReportDetails>>(
    `/admin/reports/${reportId}`,
    { signal },
  );
  return response.data.data;
}

export async function updateReportStatus(
  reportId: number,
  action: 'under-review' | 'reject' | 'close',
  note: string,
) {
  const response = await apiClient.patch<ApiEnvelope<ModerationResult>>(
    `/admin/reports/${reportId}/${action}`,
    { note },
  );
  return response.data.data;
}

export async function moderateTarget(
  report: AdminReportDetails,
  action: string,
  note: string,
) {
  const targetSegment = {
    LISTING: 'listings',
    REVIEW: 'reviews',
    USER: 'users',
  }[report.type];
  const response = await apiClient.patch<ApiEnvelope<ModerationResult>>(
    `/admin/${targetSegment}/${report.entityId}/${action}`,
    { reportId: report.id, note },
  );
  return response.data.data;
}
