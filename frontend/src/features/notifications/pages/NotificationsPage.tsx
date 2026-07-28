import {
  Bell,
  CheckCheck,
  CreditCard,
  Inbox,
  LoaderCircle,
  PackageCheck,
  RefreshCw,
  Star,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { PageHeader } from '../../student/components/StudentUi';
import {
  broadcastNotificationCount,
  getNotifications,
  isAllowedNotificationAction,
  markAllNotificationsRead,
  markNotificationRead,
} from '../api/notificationsApi';
import type {
  CampusNotification,
  NotificationQuery,
  NotificationsData,
} from '../api/notificationsApi';
import { NotificationCard } from '../components/NotificationCard';

type NotificationTab =
  'all' | 'unread' | 'orders' | 'payments' | 'reviews' | 'system';

const tabs: { id: NotificationTab; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'unread', label: 'Unread' },
  { id: 'orders', label: 'Orders' },
  { id: 'payments', label: 'Payments' },
  { id: 'reviews', label: 'Reviews' },
  { id: 'system', label: 'System' },
];

export function NotificationsPage() {
  const [activeTab, setActiveTab] = useState<NotificationTab>('all');
  const [data, setData] = useState<NotificationsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [updatingIds, setUpdatingIds] = useState<Set<number>>(new Set());
  const [markingAll, setMarkingAll] = useState(false);
  const navigate = useNavigate();

  const loadNotifications = useCallback(
    async (page = 0, append = false) => {
      if (append) setLoadingMore(true);
      else setLoading(true);
      setError(false);
      const query = queryForTab(activeTab, page);
      try {
        const result = await getNotifications(query);
        setData((current) =>
          append && current
            ? {
                ...result,
                notifications: [
                  ...current.notifications,
                  ...result.notifications,
                ],
              }
            : result,
        );
        broadcastNotificationCount(result.stats.unreadNotifications);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [activeTab],
  );

  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications]);

  async function markRead(notification: CampusNotification) {
    if (notification.isRead || updatingIds.has(notification.id)) return true;
    setUpdatingIds((current) => new Set(current).add(notification.id));
    setFeedback('');
    try {
      const result = await markNotificationRead(notification.id);
      setData((current) =>
        current
          ? {
              ...current,
              stats: {
                ...current.stats,
                unreadNotifications: result.unreadCount,
              },
              notifications:
                activeTab === 'unread'
                  ? current.notifications.filter(
                      (item) => item.id !== notification.id,
                    )
                  : current.notifications.map((item) =>
                      item.id === notification.id
                        ? {
                            ...item,
                            isRead: true,
                            readAt: result.readAt,
                          }
                        : item,
                    ),
            }
          : current,
      );
      broadcastNotificationCount(result.unreadCount);
      setFeedback('Notification marked as read.');
      return true;
    } catch {
      setFeedback('Unable to update notification. Please try again.');
      return false;
    } finally {
      setUpdatingIds((current) => {
        const next = new Set(current);
        next.delete(notification.id);
        return next;
      });
    }
  }

  async function openNotification(notification: CampusNotification) {
    const updated = await markRead(notification);
    if (
      updated &&
      isAllowedNotificationAction(notification.actionUrl) &&
      notification.actionUrl !== '/student/notifications'
    ) {
      navigate(notification.actionUrl!);
    }
  }

  async function markAllRead() {
    if (markingAll || !data?.stats.unreadNotifications) return;
    setMarkingAll(true);
    setFeedback('');
    try {
      const result = await markAllNotificationsRead();
      setData((current) =>
        current
          ? {
              ...current,
              stats: {
                ...current.stats,
                unreadNotifications: result.unreadCount,
              },
              notifications:
                activeTab === 'unread'
                  ? []
                  : current.notifications.map((item) => ({
                      ...item,
                      isRead: true,
                      readAt: item.readAt ?? result.updatedAt,
                    })),
            }
          : current,
      );
      broadcastNotificationCount(result.unreadCount);
      setFeedback('All notifications marked as read.');
    } catch {
      setFeedback('Unable to update notifications. Please try again.');
    } finally {
      setMarkingAll(false);
    }
  }

  const unreadCount = data?.stats.unreadNotifications ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader
        action={
          <button
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#b9c4d2] bg-white px-4 text-sm font-bold text-[#27374c] shadow-sm transition hover:border-cyan-700 hover:text-cyan-800 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={markingAll || unreadCount === 0}
            onClick={() => void markAllRead()}
            type="button"
          >
            {markingAll ? (
              <LoaderCircle
                aria-hidden="true"
                className="h-4 w-4 animate-spin"
              />
            ) : (
              <CheckCheck aria-hidden="true" className="h-4 w-4" />
            )}
            {markingAll ? 'Updating…' : 'Mark all as read'}
          </button>
        }
        description="Stay updated with your orders, payments, listings, and reviews."
        eyebrow="Update center"
        title="Notifications"
      />

      {feedback && (
        <div
          className={`rounded-lg border px-4 py-3 text-sm font-semibold ${
            feedback.startsWith('Unable')
              ? 'border-red-200 bg-red-50 text-red-800'
              : 'border-emerald-200 bg-emerald-50 text-emerald-800'
          }`}
          role="status"
        >
          {feedback}
        </div>
      )}

      <section
        aria-label="Notification statistics"
        className="grid grid-cols-2 gap-3 lg:grid-cols-5"
      >
        <NotificationStat
          icon={Inbox}
          label="Total"
          tone="slate"
          value={data?.stats.totalNotifications ?? 0}
        />
        <NotificationStat
          icon={Bell}
          label="Unread"
          tone="cyan"
          value={unreadCount}
        />
        <NotificationStat
          icon={PackageCheck}
          label="Order updates"
          tone="blue"
          value={data?.stats.orderNotifications ?? 0}
        />
        <NotificationStat
          icon={CreditCard}
          label="Payment updates"
          tone="green"
          value={data?.stats.paymentNotifications ?? 0}
        />
        <NotificationStat
          icon={Star}
          label="Review updates"
          tone="amber"
          value={data?.stats.reviewNotifications ?? 0}
        />
      </section>

      <section className="overflow-hidden rounded-xl border border-[#dce1e8] bg-white shadow-sm">
        <div className="overflow-x-auto border-b border-[#e4e8ee] px-2 sm:px-4">
          <div
            aria-label="Notification filters"
            className="flex"
            role="tablist"
          >
            {tabs.map((tab) => (
              <button
                aria-selected={activeTab === tab.id}
                className={`relative h-14 shrink-0 px-3 text-sm font-bold transition sm:px-4 ${
                  activeTab === tab.id
                    ? 'text-[#031635]'
                    : 'text-[#68707d] hover:text-[#27374c]'
                }`}
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setFeedback('');
                }}
                role="tab"
                type="button"
              >
                {tab.label}
                {tab.id === 'unread' && unreadCount > 0 && (
                  <span className="ml-1.5 rounded-full bg-[#ba1a1a] px-1.5 py-0.5 text-[10px] text-white">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
                {activeTab === tab.id && (
                  <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-cyan-700" />
                )}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <NotificationsLoading />
        ) : error ? (
          <NotificationsError onRetry={() => void loadNotifications()} />
        ) : data && data.notifications.length > 0 ? (
          <>
            <div className="divide-y divide-[#edf0f4]">
              {data.notifications.map((notification) => (
                <NotificationCard
                  key={notification.id}
                  notification={notification}
                  onMarkRead={(item) => void markRead(item)}
                  onOpen={(item) => void openNotification(item)}
                  updating={updatingIds.has(notification.id)}
                />
              ))}
            </div>
            {data.pagination.hasMore && (
              <div className="border-t border-[#e4e8ee] px-4 py-4 text-center">
                <button
                  className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#b9c4d2] px-5 text-sm font-bold text-[#27374c] hover:border-cyan-700 hover:text-cyan-800 disabled:opacity-60"
                  disabled={loadingMore}
                  onClick={() =>
                    void loadNotifications(data.pagination.page + 1, true)
                  }
                  type="button"
                >
                  {loadingMore && (
                    <LoaderCircle
                      aria-hidden="true"
                      className="h-4 w-4 animate-spin"
                    />
                  )}
                  {loadingMore ? 'Loading…' : 'Load more'}
                </button>
              </div>
            )}
          </>
        ) : (
          <NotificationsEmpty tab={activeTab} />
        )}
      </section>
    </div>
  );
}

function queryForTab(tab: NotificationTab, page: number): NotificationQuery {
  const base: NotificationQuery = { page, size: 20, sortBy: 'newest' };
  if (tab === 'unread') return { ...base, isRead: false };
  if (tab === 'orders') return { ...base, type: 'ORDER' };
  if (tab === 'payments') return { ...base, type: 'PAYMENT' };
  if (tab === 'reviews') return { ...base, type: 'REVIEW' };
  if (tab === 'system') return { ...base, type: 'SYSTEM' };
  return base;
}

function NotificationStat({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Bell;
  label: string;
  value: number;
  tone: 'slate' | 'cyan' | 'blue' | 'green' | 'amber';
}) {
  const tones = {
    slate: 'bg-slate-100 text-slate-700',
    cyan: 'bg-cyan-100 text-cyan-800',
    blue: 'bg-blue-100 text-blue-800',
    green: 'bg-emerald-100 text-emerald-800',
    amber: 'bg-amber-100 text-amber-800',
  };
  return (
    <article className="flex min-w-0 items-center gap-3 rounded-xl border border-[#dce1e8] bg-white p-4 shadow-sm">
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tones[tone]}`}
      >
        <Icon aria-hidden="true" className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <p className="text-xl font-black text-[#0b1c30]">{value}</p>
        <p className="truncate text-xs font-semibold text-[#68707d]">{label}</p>
      </div>
    </article>
  );
}

function NotificationsLoading() {
  return (
    <div
      aria-label="Loading notifications"
      className="divide-y divide-slate-100"
    >
      {[1, 2, 3, 4].map((item) => (
        <div className="flex animate-pulse gap-4 p-5" key={item}>
          <span className="h-11 w-11 rounded-xl bg-slate-200" />
          <span className="flex-1 space-y-3">
            <span className="block h-3 w-44 rounded bg-slate-200" />
            <span className="block h-3 max-w-xl rounded bg-slate-100" />
            <span className="block h-2 w-24 rounded bg-slate-100" />
          </span>
        </div>
      ))}
      <span className="sr-only">Loading notifications...</span>
    </div>
  );
}

function NotificationsError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="px-6 py-16 text-center">
      <RefreshCw aria-hidden="true" className="mx-auto h-8 w-8 text-red-600" />
      <h2 className="mt-4 text-lg font-black text-[#0b1c30]">
        Unable to load notifications
      </h2>
      <p className="mt-1 text-sm text-[#68707d]">
        Something went wrong. Please try again.
      </p>
      <button
        className="mt-5 h-10 rounded-lg bg-[#031635] px-5 text-sm font-bold text-white hover:bg-[#17385e]"
        onClick={onRetry}
        type="button"
      >
        Try again
      </button>
    </div>
  );
}

function NotificationsEmpty({ tab }: { tab: NotificationTab }) {
  const title =
    tab === 'unread'
      ? 'You are all caught up'
      : tab === 'all'
        ? 'No notifications yet'
        : 'No notifications found for this category';
  const description =
    tab === 'unread'
      ? 'No unread notifications.'
      : tab === 'all'
        ? 'Important updates about your orders, payments, listings, and reviews will appear here.'
        : 'New updates in this category will appear here when they happen.';

  return (
    <div className="px-6 py-16 text-center">
      <Bell aria-hidden="true" className="mx-auto h-8 w-8 text-[#9aa5b3]" />
      <h2 className="mt-4 text-lg font-black text-[#0b1c30]">{title}</h2>
      <p className="mx-auto mt-1 max-w-lg text-sm leading-6 text-[#68707d]">
        {description}
      </p>
    </div>
  );
}
