import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  FileWarning,
  Flag,
  LoaderCircle,
  RefreshCw,
  SearchX,
  ShieldCheck,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import { getApiErrorMessage } from '../../auth/api/authApi';
import { relativeNotificationTime } from '../../notifications/lib/notificationFormat';
import { PageHeader, StatusBadge } from '../../student/components/StudentUi';
import {
  getMyReports,
  type ReportPage,
  type ReportStatus,
  type ReportType,
} from '../api/reportsApi';

const statusTabs: Array<{
  label: string;
  value?: ReportStatus;
}> = [
  { label: 'All' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Under review', value: 'UNDER_REVIEW' },
  { label: 'Action taken', value: 'ACTION_TAKEN' },
  { label: 'Rejected', value: 'REJECTED' },
  { label: 'Closed', value: 'CLOSED' },
];

export function MyReportsPage() {
  const [data, setData] = useState<ReportPage>();
  const [status, setStatus] = useState<ReportStatus>();
  const [type, setType] = useState<ReportType>();
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  const load = useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true);
      setError('');
      try {
        setData(
          await getMyReports(
            { status, type, page, size: 8, sortBy: 'newest' },
            signal,
          ),
        );
      } catch (caught) {
        if (!signal?.aborted) setError(getApiErrorMessage(caught));
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [page, status, type],
  );

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load, reloadKey]);

  function selectStatus(nextStatus?: ReportStatus) {
    setStatus(nextStatus);
    setPage(0);
  }

  if (loading && !data) {
    return (
      <div className="grid min-h-[65vh] place-items-center">
        <LoaderCircle className="h-9 w-9 animate-spin text-cyan-700" />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="grid min-h-[65vh] place-items-center">
        <section className="max-w-md rounded-2xl border border-rose-200 bg-white p-7 text-center">
          <RefreshCw className="mx-auto h-8 w-8 text-rose-600" />
          <h1 className="mt-4 text-xl font-black text-[#031635]">
            Reports could not load
          </h1>
          <p className="mt-2 text-sm leading-6 text-[#68707d]">{error}</p>
          <button
            className="mt-5 rounded-xl bg-[#031635] px-5 py-3 text-sm font-bold text-white"
            onClick={() => setReloadKey((value) => value + 1)}
            type="button"
          >
            Try again
          </button>
        </section>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6 pb-16 md:pb-4">
      <PageHeader
        description="Track safety reports you have submitted. Reports are private between you and the Campus Hub moderation team."
        eyebrow="Safety centre"
        title="My Reports"
      />

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <ReportStat
          icon={Flag}
          label="Total reports"
          value={data.stats.total}
        />
        <ReportStat
          icon={Clock3}
          label="Awaiting review"
          tone="amber"
          value={data.stats.pending + data.stats.underReview}
        />
        <ReportStat
          icon={ShieldCheck}
          label="Action taken"
          tone="green"
          value={data.stats.actionTaken}
        />
        <ReportStat
          icon={CheckCircle2}
          label="Closed"
          tone="blue"
          value={data.stats.closed + data.stats.rejected}
        />
      </section>

      <section className="overflow-hidden rounded-2xl border border-[#d6d9e2] bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-[#e6e8ee] p-4 lg:flex-row lg:items-center lg:justify-between">
          <div
            aria-label="Report status filters"
            className="flex overflow-x-auto"
            role="tablist"
          >
            {statusTabs.map((tab) => (
              <button
                aria-selected={status === tab.value}
                className={`shrink-0 rounded-lg px-3 py-2 text-sm font-bold ${
                  status === tab.value
                    ? 'bg-[#031635] text-white'
                    : 'text-[#68707d] hover:bg-[#eff4ff]'
                }`}
                key={tab.label}
                onClick={() => selectStatus(tab.value)}
                role="tab"
                type="button"
              >
                {tab.label}
              </button>
            ))}
          </div>
          <label className="flex items-center gap-2 text-sm font-semibold text-[#526075]">
            Type
            <select
              className="h-10 rounded-lg border border-[#cbd3de] bg-white px-3 outline-none focus:border-cyan-700"
              onChange={(event) => {
                setType(
                  event.target.value
                    ? (event.target.value as ReportType)
                    : undefined,
                );
                setPage(0);
              }}
              value={type ?? ''}
            >
              <option value="">All types</option>
              <option value="LISTING">Listings</option>
              <option value="USER">Students</option>
              <option value="REVIEW">Reviews</option>
            </select>
          </label>
        </div>

        {error && (
          <div className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {error}
          </div>
        )}

        {loading ? (
          <div className="grid min-h-72 place-items-center">
            <LoaderCircle className="h-8 w-8 animate-spin text-cyan-700" />
          </div>
        ) : data.reports.length ? (
          <div className="divide-y divide-[#edf0f4]">
            {data.reports.map((report) => (
              <article className="p-5 sm:p-6" key={report.id}>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-cyan-50 px-2.5 py-1 text-xs font-black text-cyan-800">
                        {formatLabel(report.type)}
                      </span>
                      <StatusBadge label={report.status} />
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-black ${priorityClass(report.priority)}`}
                      >
                        {formatLabel(report.priority)} priority
                      </span>
                    </div>
                    <h2 className="mt-3 font-display text-lg font-black text-[#031635]">
                      {report.targetTitle}
                    </h2>
                    <p className="mt-1 text-sm text-[#68707d]">
                      {report.targetSubtitle}
                    </p>
                    <p className="mt-3 text-sm font-bold text-[#34465d]">
                      Reason: {formatLabel(report.reason)}
                    </p>
                    {report.description && (
                      <p className="mt-2 max-w-3xl text-sm leading-6 text-[#5f6d80]">
                        {report.description}
                      </p>
                    )}
                    {report.adminResponse && (
                      <div className="mt-4 rounded-xl border border-cyan-100 bg-cyan-50 px-4 py-3">
                        <p className="text-xs font-black uppercase tracking-[0.1em] text-cyan-800">
                          Moderator update
                        </p>
                        <p className="mt-1 text-sm leading-6 text-[#29445a]">
                          {report.adminResponse}
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="shrink-0 text-left text-xs text-[#8a95a4] lg:text-right">
                    <p>Report #{report.id}</p>
                    <p className="mt-1">
                      Submitted {relativeNotificationTime(report.submittedAt)}
                    </p>
                    <p className="mt-1">
                      Target status: {formatLabel(report.targetStatus)}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="px-6 py-16 text-center">
            <SearchX className="mx-auto h-9 w-9 text-[#a7b0bd]" />
            <h2 className="mt-4 text-lg font-black text-[#031635]">
              No reports found
            </h2>
            <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-[#68707d]">
              Reports matching this status and type will appear here.
            </p>
          </div>
        )}

        {data.pagination.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-[#e6e8ee] px-4 py-4">
            <button
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#cbd3de] px-3 text-sm font-bold disabled:opacity-40"
              disabled={page === 0 || loading}
              onClick={() => setPage((value) => Math.max(0, value - 1))}
              type="button"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </button>
            <span className="text-xs font-semibold text-[#68707d]">
              Page {data.pagination.page + 1} of {data.pagination.totalPages}
            </span>
            <button
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#cbd3de] px-3 text-sm font-bold disabled:opacity-40"
              disabled={!data.pagination.hasMore || loading}
              onClick={() => setPage((value) => value + 1)}
              type="button"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

function ReportStat({
  icon: Icon,
  label,
  value,
  tone = 'rose',
}: {
  icon: typeof FileWarning;
  label: string;
  value: number;
  tone?: 'rose' | 'amber' | 'green' | 'blue';
}) {
  const colors = {
    rose: 'bg-rose-100 text-rose-800',
    amber: 'bg-amber-100 text-amber-800',
    green: 'bg-emerald-100 text-emerald-800',
    blue: 'bg-blue-100 text-blue-800',
  };
  return (
    <article className="flex items-center gap-3 rounded-xl border border-[#d6d9e2] bg-white p-4 shadow-sm">
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${colors[tone]}`}
      >
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <p className="text-xl font-black text-[#031635]">{value}</p>
        <p className="text-xs font-semibold text-[#68707d]">{label}</p>
      </div>
    </article>
  );
}

function priorityClass(priority: string) {
  if (priority === 'CRITICAL') return 'bg-rose-100 text-rose-800';
  if (priority === 'HIGH') return 'bg-orange-100 text-orange-800';
  if (priority === 'MEDIUM') return 'bg-amber-100 text-amber-800';
  return 'bg-slate-100 text-slate-700';
}

function formatLabel(value: string) {
  return value
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase());
}
