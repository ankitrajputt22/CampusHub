import {
  ArrowRight,
  CircleAlert,
  Clock3,
  LifeBuoy,
  Search,
  TicketCheck,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { getAdminSupportTickets, supportCategories } from '../api/supportApi';
import type {
  SupportCategory,
  SupportPriority,
  SupportStatus,
  SupportTicketPage,
} from '../api/supportApi';
import {
  AdminErrorState,
  AdminLoadingState,
  AdminPageHeader,
} from '../../admin/components/AdminUi';
import {
  SupportEmpty,
  SupportPriorityBadge,
  SupportStatusBadge,
} from '../components/SupportUi';
import { formatSupportDate } from '../lib/supportUtils';

export function AdminSupportPage() {
  const [data, setData] = useState<SupportTicketPage | null>(null);
  const [status, setStatus] = useState<SupportStatus | ''>('');
  const [priority, setPriority] = useState<SupportPriority | ''>('');
  const [category, setCategory] = useState<SupportCategory | ''>('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
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
          await getAdminSupportTickets(
            {
              status: status || undefined,
              priority: priority || undefined,
              category: category || undefined,
              search: search || undefined,
              page,
              size: 20,
            },
            signal,
          ),
        );
      } catch {
        if (!signal?.aborted) setError('Unable to load support tickets.');
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [category, page, priority, search, status],
  );

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load, reloadKey]);

  if (loading && !data)
    return <AdminLoadingState label="Loading support tickets..." />;
  if (error && !data) {
    return (
      <AdminErrorState
        message="Unable to load the support queue. Please try again."
        onRetry={() => setReloadKey((value) => value + 1)}
        title="Support queue could not load"
      />
    );
  }

  const stats = data?.stats ?? {
    total: 0,
    open: 0,
    inProgress: 0,
    resolved: 0,
    closed: 0,
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        description="Review student and public support requests, prioritize urgent issues, reply securely, and maintain a complete status history."
        eyebrow="Help and issue tracking"
        title="Support Tickets"
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStat
          icon={TicketCheck}
          label="Total tickets"
          value={stats.total}
        />
        <AdminStat
          icon={CircleAlert}
          label="Open"
          tone="cyan"
          value={stats.open}
        />
        <AdminStat
          icon={Clock3}
          label="In progress"
          tone="blue"
          value={stats.inProgress}
        />
        <AdminStat
          icon={LifeBuoy}
          label="Resolved"
          tone="green"
          value={stats.resolved}
        />
      </section>

      <section className="overflow-hidden rounded-2xl border border-[#d6d9e2] bg-white shadow-sm">
        <div className="grid gap-3 border-b border-[#e6e8ee] p-4 md:grid-cols-2 xl:grid-cols-[1.5fr_repeat(3,0.75fr)]">
          <form
            className="relative"
            onSubmit={(event) => {
              event.preventDefault();
              setSearch(searchInput.trim());
              setPage(0);
            }}
          >
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#68707d]" />
            <input
              aria-label="Search support queue"
              className={filterClass + ' pl-10'}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Ticket, subject, name, or email"
              value={searchInput}
            />
          </form>
          <select
            aria-label="Filter by status"
            className={filterClass}
            onChange={(event) => {
              setStatus(event.target.value as SupportStatus | '');
              setPage(0);
            }}
            value={status}
          >
            <option value="">All statuses</option>
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="WAITING_FOR_USER">Waiting for User</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
            <option value="REJECTED">Rejected</option>
            <option value="SPAM">Spam</option>
          </select>
          <select
            aria-label="Filter by priority"
            className={filterClass}
            onChange={(event) => {
              setPriority(event.target.value as SupportPriority | '');
              setPage(0);
            }}
            value={priority}
          >
            <option value="">All priorities</option>
            <option value="URGENT">Urgent</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
          <select
            aria-label="Filter by category"
            className={filterClass}
            onChange={(event) => {
              setCategory(event.target.value as SupportCategory | '');
              setPage(0);
            }}
            value={category}
          >
            <option value="">All categories</option>
            {supportCategories.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {error && (
          <div className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Unable to refresh the queue. Showing the latest available results.
          </div>
        )}

        {data?.tickets.length ? (
          <div className="overflow-x-auto">
            <table className="min-w-[1050px] w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-[0.08em] text-[#68707d]">
                <tr>
                  <th className="px-5 py-3 font-black">Ticket</th>
                  <th className="px-5 py-3 font-black">Submitted by</th>
                  <th className="px-5 py-3 font-black">Status</th>
                  <th className="px-5 py-3 font-black">Priority</th>
                  <th className="px-5 py-3 font-black">Updated</th>
                  <th className="px-5 py-3 font-black">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#edf0f4]">
                {data.tickets.map((ticket) => (
                  <tr className="hover:bg-slate-50/70" key={ticket.id}>
                    <td className="px-5 py-4">
                      <p className="font-black text-cyan-800">
                        {ticket.ticketNumber}
                      </p>
                      <p className="mt-1 max-w-sm truncate font-bold text-[#13233a]">
                        {ticket.subject}
                      </p>
                      <p className="mt-1 text-xs text-[#778294]">
                        {
                          supportCategories.find(
                            (item) => item.value === ticket.category,
                          )?.label
                        }
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-bold text-[#25364d]">
                        {ticket.submittedBy}
                      </p>
                      <p className="mt-1 text-xs text-[#778294]">
                        {ticket.userEmail}
                      </p>
                      <p className="mt-1 max-w-48 truncate text-xs text-[#778294]">
                        {ticket.collegeName ?? 'Public support request'}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <SupportStatusBadge status={ticket.status} />
                    </td>
                    <td className="px-5 py-4">
                      <SupportPriorityBadge priority={ticket.priority} />
                    </td>
                    <td className="px-5 py-4 text-xs text-[#68707d]">
                      {formatSupportDate(ticket.updatedAt)}
                    </td>
                    <td className="px-5 py-4">
                      <Link
                        className="inline-flex items-center gap-1.5 font-black text-cyan-800 hover:text-cyan-600"
                        to={`/admin/support/${ticket.id}`}
                      >
                        View
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <SupportEmpty
            description="New student and public support requests will appear here."
            title="No support tickets available."
          />
        )}

        {data && data.pagination.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-[#e6e8ee] px-4 py-4">
            <button
              className="rounded-lg border border-[#cbd3de] px-4 py-2 text-sm font-bold disabled:opacity-40"
              disabled={page === 0 || loading}
              onClick={() => setPage((value) => Math.max(0, value - 1))}
              type="button"
            >
              Previous
            </button>
            <span className="text-xs font-semibold text-[#68707d]">
              Page {data.pagination.page + 1} of {data.pagination.totalPages}
            </span>
            <button
              className="rounded-lg border border-[#cbd3de] px-4 py-2 text-sm font-bold disabled:opacity-40"
              disabled={!data.pagination.hasMore || loading}
              onClick={() => setPage((value) => value + 1)}
              type="button"
            >
              Next
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

const filterClass =
  'h-11 w-full rounded-xl border border-[#cbd3de] bg-white px-3 text-sm text-[#27374c] outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100';

function AdminStat({
  icon: Icon,
  label,
  value,
  tone = 'slate',
}: {
  icon: typeof TicketCheck;
  label: string;
  value: number;
  tone?: 'slate' | 'cyan' | 'blue' | 'green';
}) {
  const style = {
    slate: 'bg-slate-100 text-slate-700',
    cyan: 'bg-cyan-100 text-cyan-800',
    blue: 'bg-blue-100 text-blue-800',
    green: 'bg-emerald-100 text-emerald-800',
  }[tone];
  return (
    <article className="flex items-center gap-4 rounded-2xl border border-[#d6d9e2] bg-white p-4 shadow-sm">
      <span className={`grid h-11 w-11 place-items-center rounded-xl ${style}`}>
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <p className="text-2xl font-black text-[#031635]">{value}</p>
        <p className="text-xs font-semibold text-[#68707d]">{label}</p>
      </div>
    </article>
  );
}
