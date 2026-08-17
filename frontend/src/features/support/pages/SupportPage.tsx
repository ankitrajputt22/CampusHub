import {
  ArrowRight,
  CheckCircle2,
  CircleDot,
  Clock3,
  LifeBuoy,
  Plus,
  Search,
  TicketCheck,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { getSupportTickets, supportCategories } from '../api/supportApi';
import type { SupportStatus, SupportTicketPage } from '../api/supportApi';
import {
  SupportEmpty,
  SupportError,
  SupportLoading,
  SupportPriorityBadge,
  SupportStatusBadge,
} from '../components/SupportUi';
import { formatSupportDate } from '../lib/supportUtils';

const tabs: Array<{ label: string; value?: SupportStatus }> = [
  { label: 'All Tickets' },
  { label: 'Open', value: 'OPEN' },
  { label: 'In Progress', value: 'IN_PROGRESS' },
  { label: 'Resolved', value: 'RESOLVED' },
  { label: 'Closed', value: 'CLOSED' },
];

export function SupportPage() {
  const [data, setData] = useState<SupportTicketPage | null>(null);
  const [status, setStatus] = useState<SupportStatus | undefined>();
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
          await getSupportTickets(
            { status, search: search || undefined, page, size: 12 },
            signal,
          ),
        );
      } catch (caught) {
        if (signal?.aborted) return;
        setError(
          caught instanceof Error
            ? caught.message
            : 'Unable to load support tickets.',
        );
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [page, search, status],
  );

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load, reloadKey]);

  if (loading && !data)
    return <SupportLoading label="Loading support tickets..." />;
  if (error && !data) {
    return (
      <SupportError
        message="Unable to load support tickets. Please try again."
        onRetry={() => setReloadKey((value) => value + 1)}
        title="Support tickets could not load"
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
      <header className="overflow-hidden rounded-2xl bg-[#031635] px-5 py-7 text-white shadow-sm sm:px-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.15em] text-cyan-300">
              <LifeBuoy className="h-4 w-4" />
              Campus Hub Help Centre
            </div>
            <h1 className="mt-3 font-display text-3xl font-black">
              Contact Support
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
              Need help? Submit a support request and our team will review it.
              Track every update and reply from one secure place.
            </p>
          </div>
          <Link
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-cyan-400 px-5 text-sm font-black text-[#003846] hover:bg-cyan-300"
            to="/student/support/new"
          >
            <Plus className="h-4 w-4" />
            Create Support Ticket
          </Link>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SupportStat
          icon={TicketCheck}
          label="All tickets"
          value={stats.total}
        />
        <SupportStat
          icon={CircleDot}
          label="Open"
          tone="cyan"
          value={stats.open}
        />
        <SupportStat
          icon={Clock3}
          label="In progress"
          tone="blue"
          value={stats.inProgress}
        />
        <SupportStat
          icon={CheckCircle2}
          label="Resolved"
          tone="green"
          value={stats.resolved}
        />
      </section>

      <section className="overflow-hidden rounded-2xl border border-[#d6d9e2] bg-white shadow-sm">
        <div className="border-b border-[#e6e8ee] p-4 sm:p-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex max-w-full gap-2 overflow-x-auto pb-1">
              {tabs.map((tab) => (
                <button
                  className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold ${status === tab.value ? 'bg-[#031635] text-white' : 'border border-[#d6d9e2] text-[#44536a] hover:bg-slate-50'}`}
                  key={tab.label}
                  onClick={() => {
                    setStatus(tab.value);
                    setPage(0);
                  }}
                  type="button"
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <form
              className="relative w-full xl:max-w-sm"
              onSubmit={(event) => {
                event.preventDefault();
                setSearch(searchInput.trim());
                setPage(0);
              }}
            >
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#68707d]" />
              <input
                aria-label="Search support tickets"
                className="h-11 w-full rounded-xl border border-[#cbd3de] pl-10 pr-4 text-sm outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100"
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Search ticket ID or subject"
                value={searchInput}
              />
            </form>
          </div>
        </div>

        {error && (
          <div className="border-b border-amber-200 bg-amber-50 px-5 py-3 text-sm text-amber-900">
            Unable to refresh tickets. Showing the latest available results.
          </div>
        )}

        {data?.tickets.length ? (
          <div className="divide-y divide-[#edf0f4]">
            {data.tickets.map((ticket) => {
              const category =
                supportCategories.find((item) => item.value === ticket.category)
                  ?.label ?? ticket.category;
              return (
                <article className="p-5 sm:p-6" key={ticket.id}>
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-black uppercase tracking-[0.1em] text-cyan-800">
                          {ticket.ticketNumber}
                        </span>
                        <SupportStatusBadge status={ticket.status} />
                        <SupportPriorityBadge priority={ticket.priority} />
                      </div>
                      <h2 className="mt-3 truncate font-display text-lg font-black text-[#031635]">
                        {ticket.subject}
                      </h2>
                      <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-[#68707d]">
                        <span>{category}</span>
                        <span>
                          Created {formatSupportDate(ticket.createdAt)}
                        </span>
                        <span>
                          Last reply: {ticket.lastReplyBy.toLowerCase()}
                        </span>
                      </div>
                    </div>
                    <Link
                      className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-[#cbd3de] px-4 text-sm font-bold text-[#031635] hover:border-cyan-600 hover:text-cyan-800"
                      to={`/student/support/${ticket.id}`}
                    >
                      View Details
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <SupportEmpty
            action={
              !status && !search ? (
                <Link
                  className="inline-flex rounded-xl bg-[#031635] px-5 py-3 text-sm font-bold text-white"
                  to="/student/support/new"
                >
                  Create your first ticket
                </Link>
              ) : undefined
            }
            description={
              status || search
                ? 'Try another status or search term.'
                : 'When you need help with your account, marketplace, orders, or payments, your tickets will appear here.'
            }
            title={
              status || search
                ? 'No support tickets found for this filter.'
                : 'You have not submitted any support tickets yet.'
            }
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

      <aside className="flex flex-col gap-3 rounded-2xl border border-[#d6d9e2] bg-[#f8f9fc] p-4 text-sm text-[#68707d] sm:flex-row sm:items-center sm:justify-between">
        <p>Review Campus Hub rules and how support information is handled.</p>
        <nav
          aria-label="Support legal resources"
          className="flex flex-wrap gap-x-4 gap-y-2 font-bold text-[#00677f]"
        >
          <Link to="/privacy-policy">Privacy Policy</Link>
          <Link to="/terms-and-conditions">Terms</Link>
          <Link to="/refund-policy">Refund Policy</Link>
          <Link to="/safety-guidelines">Safety Guidelines</Link>
        </nav>
      </aside>
    </div>
  );
}

function SupportStat({
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
