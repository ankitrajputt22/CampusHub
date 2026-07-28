import { apiClient } from '../../../lib/apiClient';

type ApiEnvelope<T> = {
  success: boolean;
  message: string;
  data: T;
};

export type NotificationType =
  | 'ACCOUNT'
  | 'ORDER'
  | 'PAYMENT'
  | 'LISTING'
  | 'WISHLIST'
  | 'REVIEW'
  | 'REPORT'
  | 'SYSTEM'
  | 'SECURITY'
  | 'ADMIN';

export type NotificationPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type CampusNotification = {
  id: number;
  title: string;
  message: string;
  notificationType: NotificationType;
  priority: NotificationPriority;
  relatedEntityType: string;
  relatedEntityId: number | null;
  actionUrl: string | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
};

export type NotificationStats = {
  totalNotifications: number;
  unreadNotifications: number;
  orderNotifications: number;
  paymentNotifications: number;
  reviewNotifications: number;
  systemNotifications: number;
};

export type NotificationsData = {
  stats: NotificationStats;
  notifications: CampusNotification[];
  pagination: {
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
    hasMore: boolean;
  };
};

export type NotificationQuery = {
  type?: 'ORDER' | 'PAYMENT' | 'REVIEW' | 'SYSTEM';
  isRead?: boolean;
  priority?: NotificationPriority;
  page?: number;
  size?: number;
  sortBy?: 'newest' | 'oldest';
};

export type NotificationPreview = {
  unreadCount: number;
  notifications: CampusNotification[];
};

export const notificationsUpdatedEvent =
  'campusHub:notifications-updated' as const;

export async function getNotifications(
  query: NotificationQuery,
  signal?: AbortSignal,
) {
  const response = await apiClient.get<ApiEnvelope<NotificationsData>>(
    '/notifications',
    { params: query, signal },
  );
  return response.data.data;
}

export async function getNotificationPreview(size = 5, signal?: AbortSignal) {
  const response = await apiClient.get<ApiEnvelope<NotificationPreview>>(
    '/notifications/preview',
    { params: { size }, signal },
  );
  return response.data.data;
}

export async function getUnreadNotificationCount(signal?: AbortSignal) {
  const response = await apiClient.get<ApiEnvelope<{ unreadCount: number }>>(
    '/notifications/unread-count',
    { signal },
  );
  return response.data.data;
}

export async function markNotificationRead(notificationId: number) {
  const response = await apiClient.patch<
    ApiEnvelope<{
      id: number;
      isRead: boolean;
      readAt: string;
      unreadCount: number;
    }>
  >(`/notifications/${notificationId}/read`);
  return response.data.data;
}

export async function markAllNotificationsRead() {
  const response = await apiClient.patch<
    ApiEnvelope<{
      updatedCount: number;
      unreadCount: number;
      updatedAt: string;
    }>
  >('/notifications/mark-all-read');
  return response.data.data;
}

export function broadcastNotificationCount(unreadCount: number) {
  window.dispatchEvent(
    new CustomEvent(notificationsUpdatedEvent, {
      detail: { unreadCount },
    }),
  );
}

export function isAllowedNotificationAction(actionUrl: string | null) {
  if (!actionUrl) return false;
  return (
    /^\/student\/orders\/\d+$/.test(actionUrl) ||
    /^\/listing\/\d+$/.test(actionUrl) ||
    [
      '/student/reviews',
      '/student/payments',
      '/student/profile',
      '/student/wishlist',
      '/student/my-marketplace',
      '/student/reports',
      '/student/notifications',
    ].includes(actionUrl)
  );
}
