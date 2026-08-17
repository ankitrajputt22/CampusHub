import { apiClient } from '../../../lib/apiClient';

type ApiEnvelope<T> = {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
};

export type Pagination = {
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
};

export type PageResponse<T> = {
  items: T[];
  pagination: Pagination;
};

export type AuditLogItem = {
  id: number;
  actorId: number;
  actorName: string;
  actorRole: 'ADMIN' | 'SUPER_ADMIN' | 'STUDENT';
  actionType: string;
  targetType: string;
  targetId: number | null;
  oldValue: string | null;
  newValue: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
};

export type AdminItem = {
  id: number;
  fullName: string;
  email: string;
  username: string;
  role: 'ADMIN' | 'SUPER_ADMIN';
  status: string;
  lastLoginAt: string | null;
  createdAt: string;
  createdByName: string | null;
};

export type CollegeItem = {
  id: number;
  name: string;
  code: string;
  emailDomain: string | null;
  city: string;
  state: string;
  country: string;
  description: string | null;
  status: 'ACTIVE' | 'INACTIVE' | 'BLOCKED' | 'UNDER_REVIEW';
  verifiedStudentsCount: number;
  activeListingsCount: number;
  createdAt: string | null;
  updatedAt: string | null;
};

export type CategoryItem = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  iconUrl: string | null;
  status: 'ACTIVE' | 'INACTIVE';
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type PlatformSetting = {
  key: string;
  value: string;
  type: 'BOOLEAN' | 'STRING' | 'NUMBER' | 'JSON';
  description: string | null;
  updatedAt: string;
};

export type SuperAdminDashboard = {
  stats: {
    totalStudents: number;
    totalAdmins: number;
    totalColleges: number;
    activeListings: number;
    totalOrders: number;
    pendingReports: number;
    openSupportTickets: number;
    recentAdminActions: number;
  };
  recentAdminActions: AuditLogItem[];
  recentCollegeUpdates: CollegeItem[];
  highPriorityReports: Array<{
    id: number;
    type: string;
    status: string;
    reason: string;
    reporterName: string;
    reporterCollege: string;
    createdAt: string;
  }>;
  openSupportTickets: Array<{
    id: number;
    ticketNumber: string;
    subject: string;
    status: string;
    priority: string;
    submitterName: string;
    createdAt: string;
  }>;
  systemAlerts: string[];
};

export type AdminDetails = {
  admin: AdminItem;
  recentAuditLogs: AuditLogItem[];
  moderationActionsTaken: number;
};

export type CollegeDetails = {
  college: CollegeItem;
  totalUsers: number;
  activeUsers: number;
  totalOrders: number;
  reportsCount: number;
  supportTicketsCount: number;
  recentUsers: AdminItem[];
  auditHistory: AuditLogItem[];
};

export type SystemHealth = {
  backendStatus: string;
  databaseStatus: string;
  storageStatus: string;
  paymentGatewayStatus: string;
  checkedAt: string;
};

async function unwrap<T>(promise: Promise<{ data: ApiEnvelope<T> }>) {
  const response = await promise;
  return response.data.data;
}

export function getSuperAdminDashboard() {
  return unwrap(
    apiClient.get<ApiEnvelope<SuperAdminDashboard>>('/super-admin/dashboard'),
  );
}

export function getSuperAdminAdmins(params?: Record<string, string | number>) {
  return unwrap(
    apiClient.get<ApiEnvelope<PageResponse<AdminItem>>>('/super-admin/admins', {
      params,
    }),
  );
}

export function createSuperAdminAdmin(payload: {
  fullName: string;
  email: string;
  username: string;
}) {
  return unwrap(
    apiClient.post<ApiEnvelope<AdminItem>>('/super-admin/admins', payload),
  );
}

export function getSuperAdminAdmin(adminId: string | number) {
  return unwrap(
    apiClient.get<ApiEnvelope<AdminDetails>>(`/super-admin/admins/${adminId}`),
  );
}

export function suspendSuperAdminAdmin(adminId: string | number) {
  return unwrap(
    apiClient.patch<ApiEnvelope<AdminItem>>(
      `/super-admin/admins/${adminId}/suspend`,
    ),
  );
}

export function reactivateSuperAdminAdmin(adminId: string | number) {
  return unwrap(
    apiClient.patch<ApiEnvelope<AdminItem>>(
      `/super-admin/admins/${adminId}/reactivate`,
    ),
  );
}

export function removeSuperAdminAdminRole(adminId: string | number) {
  return unwrap(
    apiClient.patch<ApiEnvelope<AdminItem>>(
      `/super-admin/admins/${adminId}/remove-admin-role`,
    ),
  );
}

export function getSuperAdminColleges(
  params?: Record<string, string | number>,
) {
  return unwrap(
    apiClient.get<ApiEnvelope<PageResponse<CollegeItem>>>(
      '/super-admin/colleges',
      { params },
    ),
  );
}

export function createSuperAdminCollege(payload: CollegePayload) {
  return unwrap(
    apiClient.post<ApiEnvelope<CollegeItem>>('/super-admin/colleges', payload),
  );
}

export function updateSuperAdminCollege(
  collegeId: string | number,
  payload: CollegePayload,
) {
  return unwrap(
    apiClient.put<ApiEnvelope<CollegeItem>>(
      `/super-admin/colleges/${collegeId}`,
      payload,
    ),
  );
}

export function getSuperAdminCollege(collegeId: string | number) {
  return unwrap(
    apiClient.get<ApiEnvelope<CollegeDetails>>(
      `/super-admin/colleges/${collegeId}`,
    ),
  );
}

export function activateSuperAdminCollege(collegeId: string | number) {
  return unwrap(
    apiClient.patch<ApiEnvelope<CollegeItem>>(
      `/super-admin/colleges/${collegeId}/activate`,
    ),
  );
}

export function deactivateSuperAdminCollege(collegeId: string | number) {
  return unwrap(
    apiClient.patch<ApiEnvelope<CollegeItem>>(
      `/super-admin/colleges/${collegeId}/deactivate`,
    ),
  );
}

export function blockSuperAdminCollege(collegeId: string | number) {
  return unwrap(
    apiClient.patch<ApiEnvelope<CollegeItem>>(
      `/super-admin/colleges/${collegeId}/block`,
    ),
  );
}

export type CollegePayload = {
  collegeName: string;
  collegeCode: string;
  emailDomain?: string;
  city: string;
  state: string;
  country: string;
  description?: string;
  status: string;
};

export function getSuperAdminCategories(
  params?: Record<string, string | number>,
) {
  return unwrap(
    apiClient.get<ApiEnvelope<PageResponse<CategoryItem>>>(
      '/super-admin/categories',
      { params },
    ),
  );
}

export function createSuperAdminCategory(payload: CategoryPayload) {
  return unwrap(
    apiClient.post<ApiEnvelope<CategoryItem>>(
      '/super-admin/categories',
      payload,
    ),
  );
}

export function updateSuperAdminCategory(
  categoryId: string | number,
  payload: CategoryPayload,
) {
  return unwrap(
    apiClient.put<ApiEnvelope<CategoryItem>>(
      `/super-admin/categories/${categoryId}`,
      payload,
    ),
  );
}

export function enableSuperAdminCategory(categoryId: string | number) {
  return unwrap(
    apiClient.patch<ApiEnvelope<CategoryItem>>(
      `/super-admin/categories/${categoryId}/enable`,
    ),
  );
}

export function disableSuperAdminCategory(categoryId: string | number) {
  return unwrap(
    apiClient.patch<ApiEnvelope<CategoryItem>>(
      `/super-admin/categories/${categoryId}/disable`,
    ),
  );
}

export type CategoryPayload = {
  name: string;
  slug?: string;
  description?: string;
  iconUrl?: string;
  status: string;
  sortOrder: number;
};

export function getSuperAdminAuditLogs(
  params?: Record<string, string | number>,
) {
  return unwrap(
    apiClient.get<ApiEnvelope<PageResponse<AuditLogItem>>>(
      '/super-admin/audit-logs',
      { params },
    ),
  );
}

export function getSuperAdminPlatformSettings() {
  return unwrap(
    apiClient.get<ApiEnvelope<{ settings: PlatformSetting[] }>>(
      '/super-admin/platform-settings',
    ),
  );
}

export function updateSuperAdminPlatformSettings(
  settings: Record<string, string>,
) {
  return unwrap(
    apiClient.put<ApiEnvelope<{ settings: PlatformSetting[] }>>(
      '/super-admin/platform-settings',
      { settings },
    ),
  );
}

export function getSuperAdminSystemHealth() {
  return unwrap(
    apiClient.get<ApiEnvelope<SystemHealth>>('/super-admin/system-health'),
  );
}
