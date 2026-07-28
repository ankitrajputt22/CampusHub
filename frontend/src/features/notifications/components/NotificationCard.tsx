import {
  Bell,
  Check,
  CreditCard,
  Flag,
  Heart,
  ListChecks,
  PackageCheck,
  ShieldAlert,
  Star,
  Store,
} from 'lucide-react';

import type {
  CampusNotification,
  NotificationType,
} from '../api/notificationsApi';
import {
  notificationActionLabel,
  notificationTypeLabel,
  priorityLabel,
  relativeNotificationTime,
} from '../lib/notificationFormat';

export function NotificationCard({
  notification,
  updating = false,
  onMarkRead,
  onOpen,
}: {
  notification: CampusNotification;
  updating?: boolean;
  onMarkRead: (notification: CampusNotification) => void;
  onOpen: (notification: CampusNotification) => void;
}) {
  const important =
    notification.priority === 'HIGH' || notification.priority === 'CRITICAL';
  const PriorityIcon =
    notification.priority === 'CRITICAL' ? ShieldAlert : null;

  return (
    <article
      className={`relative grid gap-4 px-4 py-5 transition sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:px-5 ${
        notification.isRead
          ? 'bg-white hover:bg-[#fbfcff]'
          : important
            ? 'bg-amber-50/70 hover:bg-amber-50'
            : 'bg-cyan-50/55 hover:bg-cyan-50/80'
      }`}
    >
      {!notification.isRead && (
        <span
          aria-label="Unread"
          className={`absolute left-0 top-0 h-full w-1 ${
            important ? 'bg-amber-500' : 'bg-cyan-600'
          }`}
        />
      )}
      <span
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${notificationTone(
          notification.notificationType,
        )}`}
      >
        <NotificationIcon type={notification.notificationType} />
      </span>

      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h2
            className={`text-sm text-[#0b1c30] ${
              notification.isRead ? 'font-bold' : 'font-black'
            }`}
          >
            {notification.title}
          </h2>
          {!notification.isRead && (
            <span className="h-2 w-2 rounded-full bg-cyan-600" />
          )}
          {priorityLabel(notification.priority) && (
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-black uppercase tracking-[0.08em] ${
                notification.priority === 'CRITICAL'
                  ? 'bg-rose-100 text-rose-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {PriorityIcon && (
                <PriorityIcon aria-hidden="true" className="h-3 w-3" />
              )}
              {priorityLabel(notification.priority)}
            </span>
          )}
        </div>
        <p className="mt-1.5 text-sm leading-6 text-[#59687b]">
          {notification.message}
        </p>
        <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#7a8798]">
          <span className="font-bold text-[#466078]">
            {notificationTypeLabel(notification.notificationType)}
          </span>
          <span aria-hidden="true">•</span>
          <time dateTime={notification.createdAt}>
            {relativeNotificationTime(notification.createdAt)}
          </time>
          {notification.relatedEntityId && (
            <>
              <span aria-hidden="true">•</span>
              <span>
                {notification.relatedEntityType.toLowerCase()} #
                {notification.relatedEntityId}
              </span>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 sm:self-center">
        {notification.actionUrl && (
          <button
            className="inline-flex h-9 items-center justify-center rounded-lg bg-[#031635] px-3 text-xs font-bold text-white hover:bg-[#17385e] disabled:opacity-60"
            disabled={updating}
            onClick={() => onOpen(notification)}
            type="button"
          >
            {notificationActionLabel(notification.relatedEntityType)}
          </button>
        )}
        {!notification.isRead && (
          <button
            aria-label={`Mark ${notification.title} as read`}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-[#c9d2df] px-3 text-xs font-bold text-[#46566b] hover:border-cyan-600 hover:bg-white hover:text-[#007b95] disabled:cursor-wait disabled:opacity-60"
            disabled={updating}
            onClick={() => onMarkRead(notification)}
            type="button"
          >
            <Check aria-hidden="true" className="h-3.5 w-3.5" />
            <span className="hidden xl:inline">Mark read</span>
          </button>
        )}
      </div>
    </article>
  );
}

function NotificationIcon({ type }: { type: NotificationType }) {
  switch (type) {
    case 'ORDER':
      return <PackageCheck aria-hidden="true" className="h-5 w-5" />;
    case 'PAYMENT':
      return <CreditCard aria-hidden="true" className="h-5 w-5" />;
    case 'LISTING':
      return <Store aria-hidden="true" className="h-5 w-5" />;
    case 'WISHLIST':
      return <Heart aria-hidden="true" className="h-5 w-5" />;
    case 'REVIEW':
      return <Star aria-hidden="true" className="h-5 w-5" />;
    case 'REPORT':
      return <Flag aria-hidden="true" className="h-5 w-5" />;
    case 'SECURITY':
      return <ShieldAlert aria-hidden="true" className="h-5 w-5" />;
    case 'ACCOUNT':
      return <ListChecks aria-hidden="true" className="h-5 w-5" />;
    default:
      return <Bell aria-hidden="true" className="h-5 w-5" />;
  }
}

function notificationTone(type: NotificationType) {
  switch (type) {
    case 'ORDER':
      return 'bg-blue-100 text-blue-800';
    case 'PAYMENT':
      return 'bg-emerald-100 text-emerald-800';
    case 'LISTING':
      return 'bg-cyan-100 text-cyan-800';
    case 'WISHLIST':
      return 'bg-rose-100 text-rose-800';
    case 'REVIEW':
      return 'bg-amber-100 text-amber-800';
    case 'REPORT':
      return 'bg-violet-100 text-violet-800';
    case 'SECURITY':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-slate-200 text-slate-700';
  }
}
