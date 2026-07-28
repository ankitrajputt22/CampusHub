import { Bell, ChevronRight, LoaderCircle } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import {
  broadcastNotificationCount,
  getNotificationPreview,
  getUnreadNotificationCount,
  isAllowedNotificationAction,
  markNotificationRead,
  notificationsUpdatedEvent,
} from '../api/notificationsApi';
import type {
  CampusNotification,
  NotificationPreview,
} from '../api/notificationsApi';
import {
  notificationTypeLabel,
  relativeNotificationTime,
} from '../lib/notificationFormat';

const EMPTY_PREVIEW: NotificationPreview = {
  unreadCount: 0,
  notifications: [],
};

export function NotificationBell({
  initialUnreadCount,
}: {
  initialUnreadCount: number;
}) {
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const [preview, setPreview] = useState<NotificationPreview>(EMPTY_PREVIEW);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [openingId, setOpeningId] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const loadCount = useCallback(async (signal?: AbortSignal) => {
    try {
      const result = await getUnreadNotificationCount(signal);
      setUnreadCount(result.unreadCount);
    } catch {
      // The dashboard count remains a useful fallback during a temporary outage.
    }
  }, []);

  const loadPreview = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const result = await getNotificationPreview(5);
      setPreview(result);
      setUnreadCount(result.unreadCount);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setUnreadCount(initialUnreadCount);
  }, [initialUnreadCount]);

  useEffect(() => {
    const controller = new AbortController();
    void loadCount(controller.signal);
    const interval = window.setInterval(() => void loadCount(), 45_000);

    function handleNotificationUpdate(event: Event) {
      const detail = (event as CustomEvent<{ unreadCount?: number }>).detail;
      if (typeof detail?.unreadCount === 'number') {
        setUnreadCount(detail.unreadCount);
      } else {
        void loadCount();
      }
      if (open) void loadPreview();
    }

    window.addEventListener(
      notificationsUpdatedEvent,
      handleNotificationUpdate,
    );
    return () => {
      controller.abort();
      window.clearInterval(interval);
      window.removeEventListener(
        notificationsUpdatedEvent,
        handleNotificationUpdate,
      );
    };
  }, [loadCount, loadPreview, open]);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }

    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleEscape);
    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleEscape);
    };
  }, []);

  async function openNotification(notification: CampusNotification) {
    if (openingId !== null) return;
    setOpeningId(notification.id);
    try {
      if (!notification.isRead) {
        const result = await markNotificationRead(notification.id);
        setUnreadCount(result.unreadCount);
        broadcastNotificationCount(result.unreadCount);
      }
      setOpen(false);
      navigate(
        isAllowedNotificationAction(notification.actionUrl)
          ? notification.actionUrl!
          : '/student/notifications',
      );
    } catch {
      setError(true);
    } finally {
      setOpeningId(null);
    }
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
        className="relative flex h-10 w-10 items-center justify-center rounded-full text-[#27374c] hover:bg-[#eff4ff]"
        onClick={() => {
          const nextOpen = !open;
          setOpen(nextOpen);
          if (nextOpen) void loadPreview();
        }}
        title="Notifications"
        type="button"
      >
        <Bell aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />
        {unreadCount > 0 && (
          <span className="absolute right-0 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#ba1a1a] px-1 text-[9px] font-bold text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <section
          aria-label="Recent notifications"
          className="fixed inset-x-3 top-[66px] z-50 overflow-hidden rounded-2xl border border-[#d6d9e2] bg-white shadow-[0_18px_45px_rgba(3,22,53,0.2)] sm:absolute sm:inset-x-auto sm:right-0 sm:top-12 sm:w-[390px]"
          role="dialog"
        >
          <header className="flex items-center justify-between border-b border-[#e6e8ee] px-4 py-3.5">
            <div>
              <h2 className="text-sm font-black text-[#031635]">
                Notifications
              </h2>
              <p className="mt-0.5 text-xs text-[#68707d]">
                {unreadCount > 0
                  ? `${unreadCount} unread update${unreadCount === 1 ? '' : 's'}`
                  : 'You are all caught up'}
              </p>
            </div>
            <span className="rounded-full bg-cyan-50 px-2.5 py-1 text-xs font-bold text-cyan-800">
              Latest 5
            </span>
          </header>

          <div className="max-h-[min(430px,65vh)] overflow-y-auto">
            {loading ? (
              <div className="flex min-h-44 items-center justify-center gap-2 text-sm font-semibold text-[#68707d]">
                <LoaderCircle
                  aria-hidden="true"
                  className="h-4 w-4 animate-spin"
                />
                Loading updates…
              </div>
            ) : error ? (
              <div className="px-5 py-9 text-center">
                <p className="text-sm font-bold text-[#8f1d1d]">
                  Unable to load notifications.
                </p>
                <button
                  className="mt-3 text-xs font-bold text-cyan-800 hover:underline"
                  onClick={() => void loadPreview()}
                  type="button"
                >
                  Try again
                </button>
              </div>
            ) : preview.notifications.length === 0 ? (
              <div className="px-6 py-10 text-center">
                <Bell
                  aria-hidden="true"
                  className="mx-auto h-7 w-7 text-[#9aa5b3]"
                />
                <p className="mt-3 text-sm font-bold text-[#27374c]">
                  No notifications yet
                </p>
                <p className="mt-1 text-xs leading-5 text-[#68707d]">
                  Your important campus updates will appear here.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-[#edf0f4]">
                {preview.notifications.map((notification) => (
                  <button
                    className={`flex w-full gap-3 px-4 py-3.5 text-left transition hover:bg-[#f4f8ff] ${
                      notification.isRead ? 'bg-white' : 'bg-cyan-50/65'
                    }`}
                    disabled={openingId !== null}
                    key={notification.id}
                    onClick={() => void openNotification(notification)}
                    type="button"
                  >
                    <span
                      className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${
                        notification.isRead
                          ? 'bg-[#cbd3de]'
                          : notification.priority === 'CRITICAL'
                            ? 'bg-red-600'
                            : notification.priority === 'HIGH'
                              ? 'bg-amber-500'
                              : 'bg-cyan-600'
                      }`}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-start justify-between gap-3">
                        <strong className="line-clamp-1 text-xs text-[#0b1c30]">
                          {notification.title}
                        </strong>
                        <time
                          className="shrink-0 text-[10px] text-[#87919f]"
                          dateTime={notification.createdAt}
                        >
                          {relativeNotificationTime(notification.createdAt)}
                        </time>
                      </span>
                      <span className="mt-1 line-clamp-2 text-xs leading-5 text-[#59687b]">
                        {notification.message}
                      </span>
                      <span className="mt-1.5 block text-[10px] font-bold uppercase tracking-wider text-[#577085]">
                        {notificationTypeLabel(notification.notificationType)}
                      </span>
                    </span>
                    {openingId === notification.id ? (
                      <LoaderCircle
                        aria-hidden="true"
                        className="mt-3 h-4 w-4 shrink-0 animate-spin text-cyan-700"
                      />
                    ) : (
                      <ChevronRight
                        aria-hidden="true"
                        className="mt-3 h-4 w-4 shrink-0 text-[#87919f]"
                      />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <Link
            className="flex h-12 items-center justify-center border-t border-[#e6e8ee] text-sm font-black text-[#00677f] hover:bg-cyan-50"
            onClick={() => setOpen(false)}
            to="/student/notifications"
          >
            View all notifications
            <ChevronRight aria-hidden="true" className="ml-1 h-4 w-4" />
          </Link>
        </section>
      )}
    </div>
  );
}
