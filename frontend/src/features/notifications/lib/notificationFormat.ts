import type {
  NotificationPriority,
  NotificationType,
} from '../api/notificationsApi';

export function notificationTypeLabel(type: NotificationType) {
  if (type === 'ACCOUNT') return 'Account';
  return type.charAt(0) + type.slice(1).toLowerCase();
}

export function notificationActionLabel(relatedEntityType: string) {
  switch (relatedEntityType) {
    case 'ORDER':
      return 'View order';
    case 'PAYMENT':
      return 'View payment';
    case 'LISTING':
      return 'View listing';
    case 'REVIEW':
      return 'View review';
    case 'REPORT':
      return 'View report';
    case 'PROFILE':
    case 'USER':
      return 'View profile';
    default:
      return 'View related page';
  }
}

export function relativeNotificationTime(value: string) {
  const timestamp = new Date(value).getTime();
  const seconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year:
      new Date(value).getFullYear() === new Date().getFullYear()
        ? undefined
        : 'numeric',
  }).format(new Date(value));
}

export function priorityLabel(priority: NotificationPriority) {
  if (priority === 'CRITICAL') return 'Critical';
  if (priority === 'HIGH') return 'Important';
  return null;
}
