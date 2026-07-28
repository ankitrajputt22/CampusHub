import {
  AlertOctagon,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  FileWarning,
  LoaderCircle,
  RefreshCw,
  SearchX,
  ShieldCheck,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { getApiErrorMessage } from '../../auth/api/authApi';
import { relativeNotificationTime } from '../../notifications/lib/notificationFormat';
import {
  getAdminReports,
  type AdminReportQueue,
  type ReportPriority,
  type ReportStatus,
  type ReportType,
} from '../api/reportsApi';

export function AdminReportsPage() {
  const [data, setData] = useState<AdminReportQueue>();
  const [type, setType] = useState<ReportType>();
  const [status, setStatus] = useState<ReportStatus>();
  const [priority, setPriority] = useState<ReportPriority>();
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
          await getAdminReports(
            { type, status, priority, page, size: 15, sortBy: 'newest' },
            signal,
          ),
        );
      } catch (caught) {
        if (!signal?.aborted) setError(getApiErrorMessage(caught));
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [page, priority, status, type],
  );

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load, reloadKey]);

  function updateFilter<T>(setter: (value?: T) => void, value: string) {
    setter(value ? (value as T) : undefined);
    setPage(0);
  }

  if (loading && !data) {
    return (
      <div className="grid min-h-[70vh] place-items-center">
        <LoaderCircle className="h-9 w-9 animate-spin text-cyan-700" />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="grid min-h-[70vh] place-items-center">
        <section className="max-w-md rounded-2xl border border-rose-200 bg-white p-7 text-center">
          <RefreshCw className="mx-auto h-8 w-8 text-rose-600" />
          <h1 className="mt-4 text-xl font-black text-[#031635]">
            Moderation queue unavailable
          </h1>
          <p className="mt-2 text-sm text-[#68707d]">{error}</p>
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
    <div className="space-y-6">
      <header>
        <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-700">
          Trust and safety
        </p>
        <h1 className="mt-1 text-3xl font-black text-[#031635]">
          Reports queue
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-[#68707d]">
          Review student reports, inspect prior activity, take proportionate
          action, and leave a permanent moderation audit trail.
        </p>
      </header>

      <section className="grid grid-cols-2 gap-3 xl:grid-cols-5">
        <QueueStat
          icon={FileWarning}
          label="All reports"
          value={data.stats.total}
        />
        <QueueStat
          icon={Clock3}
          label="Pending"
          tone="amber"
          value={data.stats.pending}
        />
        <QueueStat
          icon={ShieldCheck}
          label="Under review"
          tone="blue"
          value={data.stats.underReview}
        />
        <QueueStat
          icon={AlertOctagon}
          label="Critical"
          tone="rose"
          value={data.stats.critical}
        />
        <QueueStat
          icon={CheckCircle2}
          label="Resolved"
          tone="green"
          value={data.stats.resolved}
        />
      </section>

      <section className="overflow-hidden rounded-2xl border border-[#d6d9e2] bg-white shadow-sm">
        <div className="grid gap-3 border-b border-[#e6e8ee] p-4 sm:grid-cols-3">
          <FilterSelect
            label="Report type"
            onChange={(value) => updateFilter(setType, value)}
            options={['LISTING', 'USER', 'REVIEW']}
            value={type}
          />
          <FilterSelect
            label="Status"
            onChange={(value) => updateFilter(setStatus, value)}
            options={[
              'PENDING',
              'UNDER_REVIEW',
              'ACTION_TAKEN',
              'REJECTED',
              'CLOSED',
            ]}
            value={status}
          />
          <FilterSelect
            label="Priority"
            onChange={(value) => updateFilter(setPriority, value)}
            options={['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']}
            value={priority}
          />
        </div>

        {error && (
          <div className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {error}
          </div>
        )}

        {loading ? (
          <div className="grid min-h-80 place-items-center">
            <LoaderCircle className="h-8 w-8 animate-spin text-cyan-700" />
          </div>
        ) : data.reports.length ? (
          <div className="divide-y divide-[#edf0f4]">
            {data.reports.map((report) => (
              <Link
                className="grid gap-4 p-5 transition hover:bg-[#f8fbff] lg:grid-cols-[minmax(0,1fr)_180px_160px] lg:items-center"
                key={report.id}
                to={`/admin/reports/${report.id}`}
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <PriorityBadge value={report.priority} />
                    <span className="rounded-full bg-cyan-50 px-2.5 py-1 text-xs font-black text-cyan-800">
                      {formatLabel(report.type)}
                    </span>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">
                      {formatLabel(report.status)}
                    </span>
                  </div>
                  <h2 className="mt-3 truncate font-display text-lg font-black text-[#031635]">
                    {report.targetTitle}
                  </h2>
                  <p className="mt-1 text-sm font-semibold text-[#4d5f74]">
                    {formatLabel(report.reason)}
                  </p>
                </div>
                <div className="text-sm">
                  <p className="font-bold text-[#273b53]">
                    {report.reporterName}
                  </p>
                  <p className="mt-1 line-clamp-2 text-xs text-[#7b8796]">
                    {report.reporterCollege}
                  </p>
                </div>
                <div className="text-xs text-[#7b8796] lg:text-right">
                  <p>Report #{report.id}</p>
                  <p className="mt-1">
                    {relativeNotificationTime(report.submittedAt)}
                  </p>
                  <p className="mt-1 font-semibold text-[#526075]">
                    Target: {formatLabel(report.targetStatus)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="px-6 py-16 text-center">
            <SearchX className="mx-auto h-9 w-9 text-[#a7b0bd]" />
            <h2 className="mt-4 text-lg font-black text-[#031635]">
              Queue is clear
            </h2>
            <p className="mt-1 text-sm text-[#68707d]">
              No reports match the selected filters.
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

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value?: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label>
      <span className="text-xs font-black uppercase tracking-[0.1em] text-[#64748b]">
        {label}
      </span>
      <select
        className="mt-2 h-11 w-full rounded-xl border border-[#cbd3de] bg-white px-3 text-sm font-semibold outline-none focus:border-cyan-700"
        onChange={(event) => onChange(event.target.value)}
        value={value ?? ''}
      >
        <option value="">All</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {formatLabel(option)}
          </option>
        ))}
      </select>
    </label>
  );
}

function QueueStat({
  icon: Icon,
  label,
  value,
  tone = 'slate',
}: {
  icon: typeof FileWarning;
  label: string;
  value: number;
  tone?: 'slate' | 'amber' | 'blue' | 'rose' | 'green';
}) {
  const colors = {
    slate: 'bg-slate-100 text-slate-700',
    amber: 'bg-amber-100 text-amber-800',
    blue: 'bg-blue-100 text-blue-800',
    rose: 'bg-rose-100 text-rose-800',
    green: 'bg-emerald-100 text-emerald-800',
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

function PriorityBadge({ value }: { value: ReportPriority }) {
  const style = {
    CRITICAL: 'bg-rose-100 text-rose-800',
    HIGH: 'bg-orange-100 text-orange-800',
    MEDIUM: 'bg-amber-100 text-amber-800',
    LOW: 'bg-slate-100 text-slate-700',
  }[value];
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-black ${style}`}>
      {formatLabel(value)}
    </span>
  );
}

function formatLabel(value: string) {
  return value
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase());
}
