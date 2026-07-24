import {
  Bell,
  CheckCircle2,
  GraduationCap,
  Heart,
  ListChecks,
  MapPin,
  PackageCheck,
  PlusSquare,
  RefreshCw,
  ShieldCheck,
  ShoppingBag,
  Store,
  UserRound,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

import { DashboardListingCard } from '../dashboard/components/DashboardListingCard';
import { DashboardSummaryPanel } from '../dashboard/components/DashboardSummaryPanel';
import { useStudentDashboard } from '../dashboard/context/studentDashboardContext';
import { formatRelativeTime } from '../dashboard/lib/format';
import type { DashboardActivity } from '../dashboard/types';

export function StudentDashboardPage() {
  const { data: dashboard, error, loading, refresh } = useStudentDashboard();

  if (loading && !dashboard) return <DashboardSkeleton />;
  if (error && !dashboard) {
    return <DashboardError message={error} retry={() => void refresh()} />;
  }
  if (!dashboard) return null;

  const firstName = dashboard.user.fullName.trim().split(/\s+/)[0] || 'Student';

  return (
    <div className="grid gap-8 pb-20 xl:grid-cols-[minmax(0,1fr)_300px] xl:pb-0 2xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="min-w-0 space-y-8">
        {error && (
          <div className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 sm:flex-row sm:items-center sm:justify-between">
            <span>Dashboard refresh failed. Showing the most recent data.</span>
            <button
              className="font-bold underline"
              onClick={() => void refresh()}
              type="button"
            >
              Try again
            </button>
          </div>
        )}

        <section className="relative overflow-hidden rounded-2xl bg-[#1a3153] px-6 py-8 text-white shadow-[0_4px_12px_rgba(3,22,53,0.08)] sm:px-8">
          <GraduationCap
            aria-hidden="true"
            className="absolute -right-7 -top-5 h-56 w-56 text-white/[0.035]"
            strokeWidth={1}
          />
          <div className="relative">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-display text-3xl font-extrabold tracking-[-0.025em] sm:text-4xl">
                Welcome, {firstName} <span aria-hidden="true">👋</span>
              </h1>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#6ffbbe] px-3 py-1.5 text-xs font-bold text-[#002113]">
                <ShieldCheck aria-hidden="true" className="h-4 w-4" />
                Verified Student
              </span>
            </div>
            <p className="mt-3 flex items-start gap-2 text-sm text-[#d3e4fe] sm:items-center sm:text-lg">
              <MapPin aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0" />
              <span>
                You are browsing:{' '}
                <strong className="text-white">
                  {dashboard.user.collegeName} Campus Hub
                </strong>
              </span>
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link
                className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-[#00ccf9] px-6 text-sm font-bold text-[#003846] hover:brightness-105"
                to="/student/sell"
              >
                <PlusSquare aria-hidden="true" className="h-[18px] w-[18px]" />
                Sell an Item
              </Link>
              <Link
                className="inline-flex h-12 items-center justify-center rounded-lg border border-[#d3e4fe] px-6 text-sm font-bold text-white hover:bg-white/10"
                to="/student/marketplace"
              >
                Browse Marketplace
              </Link>
            </div>
          </div>
        </section>

        <section
          aria-label="Dashboard statistics"
          className="grid grid-cols-2 gap-3 sm:grid-cols-3 2xl:grid-cols-6"
        >
          <QuickStat
            icon={ShieldCheck}
            label="Trust Score"
            tone="red"
            value={`${dashboard.trustScore.score}/100`}
          />
          <QuickStat
            icon={ListChecks}
            label="Active Listings"
            tone="cyan"
            value={dashboard.stats.activeListings}
          />
          <QuickStat
            icon={Heart}
            label="Wishlist"
            tone="rose"
            value={dashboard.stats.wishlistItems}
          />
          <QuickStat
            icon={ShoppingBag}
            label="Orders"
            tone="navy"
            value={dashboard.stats.ordersPlaced}
          />
          <QuickStat
            icon={PackageCheck}
            label="Items Sold"
            tone="green"
            value={dashboard.stats.itemsSold}
          />
          <QuickStat
            accent={dashboard.stats.unreadNotifications > 0}
            icon={Bell}
            label="Notifications"
            tone="red"
            value={dashboard.stats.unreadNotifications}
          />
        </section>

        <section>
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-2xl font-bold text-[#031635]">
                Latest in {dashboard.user.collegeName}
              </h2>
              <p className="mt-1 text-sm text-[#5d6470]">
                Fresh items listed by verified students on your campus
              </p>
            </div>
            <Link
              className="shrink-0 text-sm font-semibold text-[#00677f] hover:underline"
              to="/student/marketplace"
            >
              View All <span aria-hidden="true">→</span>
            </Link>
          </div>
          {dashboard.latestListings.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
              {dashboard.latestListings.slice(0, 4).map((listing) => (
                <DashboardListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          ) : (
            <DashboardEmptyState
              action="List the first item"
              description="There are no active listings in your college yet."
              icon={Store}
              to="/student/sell"
            />
          )}
        </section>

        <section>
          <h2 className="mb-4 font-display text-2xl font-bold text-[#031635]">
            Recent Activity
          </h2>
          {dashboard.recentActivity.length > 0 ? (
            <div className="overflow-hidden rounded-2xl border border-[#c5c6cf] bg-white">
              {dashboard.recentActivity.map((activity, index) => (
                <ActivityRow
                  activity={activity}
                  key={activity.id}
                  last={index === dashboard.recentActivity.length - 1}
                />
              ))}
            </div>
          ) : (
            <DashboardEmptyState
              description="Your marketplace actions will appear here."
              icon={ListChecks}
            />
          )}
        </section>
      </div>

      <DashboardSummaryPanel dashboard={dashboard} />
    </div>
  );
}

function QuickStat({
  label,
  value,
  icon: Icon,
  tone,
  accent = false,
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  tone: 'cyan' | 'red' | 'rose' | 'navy' | 'green';
  accent?: boolean;
}) {
  const toneClass = {
    cyan: 'text-[#00677f]',
    red: 'text-[#ba1a1a]',
    rose: 'text-[#df7681]',
    navy: 'text-[#6f7d94]',
    green: 'text-[#4edea3]',
  }[tone];

  return (
    <article
      className={`relative min-w-0 overflow-hidden rounded-xl border border-[#c5c6cf] bg-white p-4 shadow-[0_2px_5px_rgba(3,22,53,0.04)] transition hover:border-[#8293b8] ${accent ? 'pr-5' : ''}`}
    >
      <p className="min-h-8 text-xs font-medium leading-4 text-[#44474e]">
        {label}
      </p>
      <div className="mt-1 flex items-end justify-between gap-2">
        <p
          className={`truncate font-display text-2xl font-bold ${tone === 'red' && accent ? 'text-[#ba1a1a]' : 'text-[#031635]'}`}
        >
          {value}
        </p>
        <Icon
          aria-hidden="true"
          className={`h-5 w-5 shrink-0 ${toneClass}`}
          strokeWidth={1.8}
        />
      </div>
      {accent && (
        <span className="absolute inset-y-0 right-0 w-1 bg-[#ba1a1a]" />
      )}
    </article>
  );
}

function ActivityRow({
  activity,
  last,
}: {
  activity: DashboardActivity;
  last: boolean;
}) {
  const { icon: Icon, tone } = activityStyle(activity.type);
  return (
    <div
      className={`flex items-center gap-4 px-4 py-4 transition hover:bg-[#eff4ff] sm:px-5 ${last ? '' : 'border-b border-[#d6d9e2]'}`}
    >
      <span
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${tone}`}
      >
        <Icon aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm leading-5 text-[#0b1c30]">{activity.message}</p>
        <p className="mt-1 text-xs text-[#5d6470]">
          {formatRelativeTime(activity.createdAt)}
        </p>
      </div>
    </div>
  );
}

function activityStyle(type: string) {
  if (type.includes('ORDER')) {
    return {
      icon: ShoppingBag,
      tone: 'bg-[#00ccf9] text-[#003846]',
    };
  }
  if (type.includes('LISTING')) {
    return {
      icon: Store,
      tone: 'bg-[#6ffbbe] text-[#002113]',
    };
  }
  if (type.includes('PROFILE')) {
    return {
      icon: UserRound,
      tone: 'bg-[#d8e2ff] text-[#081b3a]',
    };
  }
  return {
    icon: CheckCircle2,
    tone: 'bg-[#e5eeff] text-[#364768]',
  };
}

function DashboardEmptyState({
  icon: Icon,
  description,
  action,
  to,
}: {
  icon: LucideIcon;
  description: string;
  action?: string;
  to?: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-[#c5c6cf] bg-white px-6 py-12 text-center">
      <Icon aria-hidden="true" className="mx-auto h-9 w-9 text-[#8293b8]" />
      <p className="mt-3 text-sm text-[#5d6470]">{description}</p>
      {action && to && (
        <Link
          className="mt-4 inline-flex h-10 items-center rounded-lg bg-[#031635] px-4 text-sm font-bold text-white"
          to={to}
        >
          {action}
        </Link>
      )}
    </div>
  );
}

function DashboardError({
  message,
  retry,
}: {
  message: string;
  retry: () => void;
}) {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg items-center justify-center pb-16">
      <section className="w-full rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">
        <RefreshCw
          aria-hidden="true"
          className="mx-auto h-9 w-9 text-red-600"
        />
        <h1 className="mt-4 font-display text-2xl font-bold text-[#031635]">
          Dashboard could not load
        </h1>
        <p className="mt-2 text-sm leading-6 text-[#5d6470]">{message}</p>
        <button
          className="mt-6 h-11 rounded-lg bg-[#031635] px-5 text-sm font-bold text-white"
          onClick={retry}
          type="button"
        >
          Try again
        </button>
      </section>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div aria-label="Loading student dashboard" className="animate-pulse pb-20">
      <div className="h-56 rounded-2xl bg-[#dce9ff]" />
      <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }, (_, index) => (
          <div
            className="h-28 rounded-xl border border-[#dce1ea] bg-white"
            key={index}
          />
        ))}
      </div>
      <div className="mt-8 h-7 w-64 rounded bg-[#dce9ff]" />
      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div
            className="h-80 rounded-xl border border-[#dce1ea] bg-white"
            key={index}
          />
        ))}
      </div>
    </div>
  );
}
