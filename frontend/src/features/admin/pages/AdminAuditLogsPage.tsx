import { LockKeyhole, Search } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import { getApiErrorMessage } from '../../auth/api/authApi';
import {
  getAdminAuditLogs,
  type AuditLogItem,
  type PageResponse,
} from '../api/adminApi';
import {
  AdminEmptyState,
  AdminErrorState,
  AdminLoadingState,
  AdminPageHeader,
  PaginationControls,
  StatusBadge,
} from '../components/AdminUi';
import { formatAdminDate, formatAdminLabel } from '../lib/adminFormat';

export function AdminAuditLogsPage() {
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [actionType, setActionType] = useState('');
  const [targetType, setTargetType] = useState('');
  const [page, setPage] = useState(0);
  const [data, setData] = useState<PageResponse<AuditLogItem>>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  const load = useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true);
      setError('');
      try {
        setData(
          await getAdminAuditLogs(
            {
              search: search || undefined,
              actionType: actionType || undefined,
              targetType: targetType || undefined,
              page,
              size: 25,
              sortBy: 'newest',
            },
            signal,
          ),
        );
      } catch (caught) {
        if (!signal?.aborted) setError(getApiErrorMessage(caught));
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [actionType, page, search, targetType],
  );

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load, reloadKey]);

  function submitSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSearch(searchInput.trim());
    setPage(0);
  }

  if (loading && !data) {
    return <AdminLoadingState label="Loading audit logs…" />;
  }
  if (error && !data) {
    return (
      <AdminErrorState
        message={error}
        onRetry={() => setReloadKey((value) => value + 1)}
        title="Unable to load audit logs"
      />
    );
  }
  if (!data) return null;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        actions={
          <span className="inline-flex items-center gap-2 rounded-xl border border-[#cbd3de] bg-white px-3 py-2 text-xs font-bold text-[#526075]">
            <LockKeyhole className="h-4 w-4 text-cyan-800" />
            Immutable, view-only records
          </span>
        }
        description="Trace who took each moderation action, what changed, and the request context that produced it."
        eyebrow="Accountability"
        title="Audit Logs"
      />

      <section className="overflow-hidden rounded-2xl border border-[#d6d9e2] bg-white shadow-sm">
        <div className="grid gap-3 border-b border-[#e6e8ee] p-4 lg:grid-cols-[minmax(280px,1fr)_230px_190px]">
          <form className="relative" onSubmit={submitSearch}>
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#68707d]" />
            <input
              aria-label="Search audit logs"
              className="h-11 w-full rounded-xl border border-[#cbd3de] pl-10 pr-3 text-sm outline-none focus:border-cyan-700"
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Admin, action, target, or moderation note"
              value={searchInput}
            />
          </form>
          <Select
            label="Action type"
            onChange={(value) => {
              setActionType(value);
              setPage(0);
            }}
            options={[
              'USER_WARNED',
              'USER_SUSPENDED',
              'USER_BLOCKED',
              'USER_REACTIVATED',
              'LISTING_UNDER_REVIEW',
              'LISTING_BLOCKED',
              'LISTING_RESTORED',
              'LISTING_DELETED',
              'REVIEW_HIDDEN',
              'REVIEW_RESTORED',
              'REPORT_UNDER_REVIEW',
              'REPORT_REJECTED',
              'REPORT_CLOSED',
            ]}
            value={actionType}
          />
          <Select
            label="Target type"
            onChange={(value) => {
              setTargetType(value);
              setPage(0);
            }}
            options={['USER', 'LISTING', 'REVIEW', 'REPORT']}
            value={targetType}
          />
        </div>

        {error && (
          <div className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {error}
          </div>
        )}

        {loading ? (
          <AdminLoadingState label="Loading audit logs…" />
        ) : data.items.length ? (
          <div className="overflow-x-auto">
            <table className="min-w-[1160px] w-full text-left">
              <thead className="bg-[#f7f9fc] text-[11px] uppercase tracking-[0.08em] text-[#68707d]">
                <tr>
                  <th className="px-4 py-3">Log</th>
                  <th className="px-4 py-3">Administrator</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Target</th>
                  <th className="px-4 py-3">State change</th>
                  <th className="px-4 py-3">Note</th>
                  <th className="px-4 py-3">Request context</th>
                  <th className="px-4 py-3">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#edf0f4]">
                {data.items.map((entry) => (
                  <tr className="align-top hover:bg-[#fbfcfe]" key={entry.id}>
                    <td className="px-4 py-4 text-sm font-black text-[#031635]">
                      #{entry.id}
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-sm font-bold text-[#334155]">
                        {entry.adminName}
                      </p>
                      <p className="mt-1 text-xs text-[#68707d]">
                        Admin #{entry.adminId}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge value={entry.actionType} />
                    </td>
                    <td className="px-4 py-4 text-sm">
                      <p className="font-bold text-[#334155]">
                        {formatAdminLabel(entry.targetType)}
                      </p>
                      <p className="mt-1 text-xs text-[#68707d]">
                        #{entry.targetId ?? '—'}
                      </p>
                    </td>
                    <td className="px-4 py-4 text-xs text-[#526075]">
                      <p>{entry.previousValue ?? '—'}</p>
                      <p className="my-1 text-[#a0a8b5]">↓</p>
                      <p className="font-bold text-[#273b53]">
                        {entry.newValue ?? '—'}
                      </p>
                    </td>
                    <td className="max-w-64 px-4 py-4 text-xs leading-5 text-[#526075]">
                      {entry.note ?? 'No note provided'}
                    </td>
                    <td className="max-w-56 px-4 py-4 text-xs text-[#68707d]">
                      <p>{entry.ipAddress ?? 'IP unavailable'}</p>
                      <p
                        className="mt-1 truncate"
                        title={entry.userAgent ?? ''}
                      >
                        {entry.userAgent ?? 'User agent unavailable'}
                      </p>
                    </td>
                    <td className="px-4 py-4 text-xs text-[#68707d]">
                      {formatAdminDate(entry.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <AdminEmptyState
            description="Moderation actions matching these filters will appear here."
            title="No audit logs available"
          />
        )}

        <PaginationControls
          disabled={loading}
          onPageChange={setPage}
          pagination={data.pagination}
        />
      </section>
    </div>
  );
}

function Select({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <select
      aria-label={label}
      className="h-11 rounded-xl border border-[#cbd3de] bg-white px-3 text-sm font-semibold outline-none focus:border-cyan-700"
      onChange={(event) => onChange(event.target.value)}
      value={value}
    >
      <option value="">All {label.toLowerCase()}s</option>
      {options.map((option) => (
        <option key={option} value={option}>
          {formatAdminLabel(option)}
        </option>
      ))}
    </select>
  );
}
