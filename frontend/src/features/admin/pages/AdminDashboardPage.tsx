import {
  Activity,
  CheckCircle2,
  CreditCard,
  FileWarning,
  PackageCheck,
  PackageX,
  ShoppingBag,
  Star,
  Users,
  UserRoundCheck,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { getApiErrorMessage } from '../../auth/api/authApi';
import { getAdminDashboard, type AdminDashboard } from '../api/adminApi';
import {
  AdminErrorState,
  AdminLoadingState,
  AdminPageHeader,
  StatusBadge,
} from '../components/AdminUi';
import {
  formatAdminCurrency,
  formatAdminDate,
  formatAdminLabel,
} from '../lib/adminFormat';

export function AdminDashboardPage() {
  const [data, setData] = useState<AdminDashboard>();
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  const load = useCallback(async (signal: AbortSignal) => {
    setError('');
    try {
      setData(await getAdminDashboard(signal));
    } catch (caught) {
      if (!signal.aborted) setError(getApiErrorMessage(caught));
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load, reloadKey]);

  if (!data && !error) {
    return <AdminLoadingState label="Loading admin dashboard…" />;
  }

  if (!data) {
    return (
      <AdminErrorState
        message={error}
        onRetry={() => setReloadKey((value) => value + 1)}
        title="Unable to load admin dashboard"
      />
    );
  }

  const stats = [
    {
      label: 'Total users',
      value: data.stats.totalUsers,
      icon: Users,
      tone: 'bg-blue-100 text-blue-800',
    },
    {
      label: 'Active users',
      value: data.stats.activeUsers,
      icon: UserRoundCheck,
      tone: 'bg-emerald-100 text-emerald-800',
    },
    {
      label: 'Total listings',
      value: data.stats.totalListings,
      icon: PackageCheck,
      tone: 'bg-violet-100 text-violet-800',
    },
    {
      label: 'Active listings',
      value: data.stats.activeListings,
      icon: CheckCircle2,
      tone: 'bg-cyan-100 text-cyan-800',
    },
    {
      label: 'Total orders',
      value: data.stats.totalOrders,
      icon: ShoppingBag,
      tone: 'bg-indigo-100 text-indigo-800',
    },
    {
      label: 'Pending reports',
      value: data.stats.pendingReports,
      icon: FileWarning,
      tone: 'bg-amber-100 text-amber-800',
    },
    {
      label: 'Blocked listings',
      value: data.stats.blockedListings,
      icon: PackageX,
      tone: 'bg-rose-100 text-rose-800',
    },
    {
      label: 'Total reviews',
      value: data.stats.totalReviews,
      icon: Star,
      tone: 'bg-orange-100 text-orange-800',
    },
  ];

  return (
    <div className="space-y-7">
      <AdminPageHeader
        actions={
          <div className="flex flex-wrap gap-2">
            <Link
              className="rounded-xl border border-[#cbd3de] bg-white px-4 py-2.5 text-sm font-bold text-[#273b53]"
              to="/admin/users"
            >
              Manage users
            </Link>
            <Link
              className="rounded-xl bg-[#031635] px-4 py-2.5 text-sm font-bold text-white"
              to="/admin/reports?status=PENDING"
            >
              Review reports
            </Link>
          </div>
        }
        description="Monitor marketplace health, review safety signals, and take accountable moderation action across Campus Hub."
        eyebrow="Platform overview"
        title="Admin Dashboard"
      />

      {error && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Latest refresh failed: {error}
        </div>
      )}

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, tone }) => (
          <article
            className="rounded-2xl border border-[#d6d9e2] bg-white p-4 shadow-sm sm:p-5"
            key={label}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-2xl font-black text-[#031635]">{value}</p>
                <p className="mt-1 text-xs font-semibold text-[#68707d]">
                  {label}
                </p>
              </div>
              <span
                className={`flex h-10 w-10 items-center justify-center rounded-xl ${tone}`}
              >
                <Icon className="h-5 w-5" />
              </span>
            </div>
          </article>
        ))}
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.7fr)]">
        <section className="overflow-hidden rounded-2xl border border-[#d6d9e2] bg-white shadow-sm">
          <SectionHeader
            link="/admin/reports?status=PENDING"
            subtitle="Latest safety issues waiting for review"
            title="Pending Reports"
          />
          {data.pendingReports.length ? (
            <div className="divide-y divide-[#edf0f4]">
              {data.pendingReports.map((report) => (
                <Link
                  className="grid gap-3 p-4 transition hover:bg-[#f8fbff] sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
                  key={report.id}
                  to={`/admin/reports/${report.id}`}
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-black text-cyan-800">
                        Report #{report.id}
                      </span>
                      <StatusBadge value={report.priority} />
                      <span className="text-xs font-bold text-[#68707d]">
                        {formatAdminLabel(report.type)}
                      </span>
                    </div>
                    <p className="mt-2 truncate font-bold text-[#031635]">
                      {report.targetTitle}
                    </p>
                    <p className="mt-1 text-xs text-[#68707d]">
                      {formatAdminLabel(report.reason)} · Reported by{' '}
                      {report.reporterName}
                    </p>
                  </div>
                  <div className="text-xs text-[#7b8796] sm:text-right">
                    <p>{formatAdminDate(report.createdAt)}</p>
                    <p className="mt-1 max-w-48 truncate">
                      {report.reporterCollege}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="px-5 py-12 text-center text-sm text-[#68707d]">
              No reports pending review.
            </p>
          )}
        </section>

        <section className="rounded-2xl border border-[#d6d9e2] bg-[#031635] p-5 text-white shadow-sm">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400/15 text-cyan-300">
              <CreditCard className="h-5 w-5" />
            </span>
            <div>
              <h2 className="font-display text-lg font-black">
                Orders & payments
              </h2>
              <p className="text-xs text-slate-300">
                Monitoring only—gateway verification remains authoritative.
              </p>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3">
            {[
              ['Total orders', data.orderPaymentSummary.totalOrders],
              ['Completed', data.orderPaymentSummary.completedOrders],
              ['Successful', data.orderPaymentSummary.successfulPayments],
              ['Pending', data.orderPaymentSummary.pendingPayments],
              ['Failed', data.orderPaymentSummary.failedPayments],
            ].map(([label, value]) => (
              <div
                className="rounded-xl border border-white/10 bg-white/5 p-3"
                key={label}
              >
                <p className="text-xl font-black">{value}</p>
                <p className="mt-1 text-xs text-slate-300">{label}</p>
              </div>
            ))}
          </div>
          <div className="mt-5 flex gap-2">
            <Link
              className="flex-1 rounded-xl bg-white px-3 py-2.5 text-center text-sm font-bold text-[#031635]"
              to="/admin/orders"
            >
              View orders
            </Link>
            <Link
              className="flex-1 rounded-xl border border-white/20 px-3 py-2.5 text-center text-sm font-bold"
              to="/admin/payments"
            >
              View payments
            </Link>
          </div>
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="overflow-hidden rounded-2xl border border-[#d6d9e2] bg-white shadow-sm">
          <SectionHeader
            link="/admin/listings"
            subtitle="Newest items across all verified colleges"
            title="Recent Listings"
          />
          <div className="divide-y divide-[#edf0f4]">
            {data.recentListings.map((listing) => (
              <Link
                className="flex items-center gap-4 p-4 hover:bg-[#f8fbff]"
                key={listing.id}
                to={`/admin/listings/${listing.id}`}
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#edf3fb] text-sm font-black text-[#1f3b5f]">
                  {listing.title.slice(0, 2).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold text-[#031635]">
                    {listing.title}
                  </p>
                  <p className="mt-1 truncate text-xs text-[#68707d]">
                    {listing.sellerName} · {listing.collegeName}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-black text-[#031635]">
                    {formatAdminCurrency(listing.price)}
                  </p>
                  <StatusBadge value={listing.status} />
                </div>
              </Link>
            ))}
            {!data.recentListings.length && (
              <p className="px-5 py-12 text-center text-sm text-[#68707d]">
                No listings available.
              </p>
            )}
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-[#d6d9e2] bg-white shadow-sm">
          <SectionHeader
            link="/admin/users"
            subtitle="Latest verified and pending student accounts"
            title="Recent Users"
          />
          <div className="divide-y divide-[#edf0f4]">
            {data.recentUsers.map((user) => (
              <Link
                className="flex items-center gap-4 p-4 hover:bg-[#f8fbff]"
                key={user.id}
                to={`/admin/users/${user.id}`}
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#d8e2ff] text-xs font-black text-[#081b3a]">
                  {user.fullName
                    .split(' ')
                    .slice(0, 2)
                    .map((part) => part[0])
                    .join('')}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold text-[#031635]">
                    {user.fullName}
                  </p>
                  <p className="mt-1 truncate text-xs text-[#68707d]">
                    {user.collegeName}
                  </p>
                </div>
                <div className="text-right">
                  <StatusBadge value={user.accountStatus} />
                  <p className="mt-1 text-xs font-bold text-cyan-800">
                    Trust {user.trustScore}
                  </p>
                </div>
              </Link>
            ))}
            {!data.recentUsers.length && (
              <p className="px-5 py-12 text-center text-sm text-[#68707d]">
                No users available.
              </p>
            )}
          </div>
        </section>
      </div>

      <section className="overflow-hidden rounded-2xl border border-[#d6d9e2] bg-white shadow-sm">
        <SectionHeader
          icon={<Activity className="h-5 w-5 text-cyan-700" />}
          link="/admin/audit-logs"
          subtitle="Permanent record of recent admin actions"
          title="Moderation Activity"
        />
        {data.moderationActivity.length ? (
          <div className="divide-y divide-[#edf0f4]">
            {data.moderationActivity.map((activity) => (
              <div
                className="grid gap-2 p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
                key={activity.id}
              >
                <div>
                  <p className="text-sm font-bold text-[#031635]">
                    {activity.adminName}{' '}
                    <span className="font-semibold text-[#526075]">
                      {formatAdminLabel(activity.actionType)}
                    </span>
                  </p>
                  <p className="mt-1 text-xs text-[#68707d]">
                    {formatAdminLabel(activity.targetType)} #
                    {activity.targetId ?? '—'} · {activity.previousValue ?? '—'}{' '}
                    → {activity.newValue ?? '—'}
                  </p>
                </div>
                <p className="text-xs text-[#7b8796]">
                  {formatAdminDate(activity.createdAt)}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="px-5 py-12 text-center text-sm text-[#68707d]">
            No audit logs available.
          </p>
        )}
      </section>
    </div>
  );
}

function SectionHeader({
  title,
  subtitle,
  link,
  icon,
}: {
  title: string;
  subtitle: string;
  link: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-[#e6e8ee] px-5 py-4">
      <div className="flex items-center gap-3">
        {icon}
        <div>
          <h2 className="font-display text-lg font-black text-[#031635]">
            {title}
          </h2>
          <p className="mt-0.5 text-xs text-[#68707d]">{subtitle}</p>
        </div>
      </div>
      <Link className="text-xs font-black text-cyan-800" to={link}>
        View all
      </Link>
    </div>
  );
}
