import { Search, ShieldAlert, UserRoundCheck } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import { getApiErrorMessage } from '../../auth/api/authApi';
import {
  getAdminUsers,
  moderateUser,
  type AdminUser,
  type PageResponse,
} from '../api/adminApi';
import {
  AdminEmptyState,
  AdminErrorState,
  AdminLoadingState,
  AdminPageHeader,
  ConfirmActionDialog,
  PaginationControls,
  StatusBadge,
  type ConfirmAction,
} from '../components/AdminUi';
import { formatAdminDate } from '../lib/adminFormat';

export function AdminUsersPage() {
  const [searchParams] = useSearchParams();
  const [searchInput, setSearchInput] = useState(
    searchParams.get('search') ?? '',
  );
  const [search, setSearch] = useState(searchParams.get('search') ?? '');
  const [status, setStatus] = useState('');
  const [role, setRole] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [page, setPage] = useState(0);
  const [data, setData] = useState<PageResponse<AdminUser>>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [action, setAction] = useState<ConfirmAction>();

  const load = useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true);
      setError('');
      try {
        setData(
          await getAdminUsers(
            {
              search: search || undefined,
              status: status || undefined,
              role: role || undefined,
              sortBy,
              page,
              size: 20,
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
    [page, role, search, sortBy, status],
  );

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load, reloadKey]);

  function updateFilter(setter: (value: string) => void, value: string) {
    setter(value);
    setPage(0);
  }

  function submitSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSearch(searchInput.trim());
    setPage(0);
  }

  function confirmUserAction(
    user: AdminUser,
    type: 'warn' | 'suspend' | 'block' | 'reactivate',
  ) {
    const labels = {
      warn: ['Warn user', 'Send policy guidance without changing access.'],
      suspend: [
        'Suspend user',
        'The user will lose protected marketplace access and all sessions will be revoked.',
      ],
      block: [
        'Block user',
        'The user will be unable to sign in and all active listings will be hidden.',
      ],
      reactivate: [
        'Reactivate user',
        'Marketplace access will be restored. Listings remain moderated separately.',
      ],
    } as const;
    setAction({
      title: `${labels[type][0]} — ${user.fullName}?`,
      description: labels[type][1],
      confirmLabel: labels[type][0],
      tone:
        type === 'block'
          ? 'danger'
          : type === 'reactivate'
            ? 'primary'
            : 'warning',
      noteRequired: type !== 'reactivate',
      onConfirm: async (note) => {
        try {
          await moderateUser(user.id, type, note);
          setNotice(`${labels[type][0]} completed successfully.`);
          setReloadKey((value) => value + 1);
        } catch (caught) {
          throw new Error(getApiErrorMessage(caught));
        }
      },
    });
  }

  if (loading && !data) {
    return <AdminLoadingState label="Loading users…" />;
  }

  if (error && !data) {
    return (
      <AdminErrorState
        message={error}
        onRetry={() => setReloadKey((value) => value + 1)}
        title="Unable to load users"
      />
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        description="Search verified college accounts, review trust and activity signals, and apply proportionate access controls."
        eyebrow="Account operations"
        title="User Management"
      />

      {notice && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
          {notice}
        </div>
      )}

      <section className="overflow-hidden rounded-2xl border border-[#d6d9e2] bg-white shadow-sm">
        <div className="grid gap-3 border-b border-[#e6e8ee] p-4 lg:grid-cols-[minmax(260px,1fr)_180px_170px_190px]">
          <form className="relative" onSubmit={submitSearch}>
            <label>
              <span className="sr-only">Search users</span>
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#68707d]" />
              <input
                className="h-11 w-full rounded-xl border border-[#cbd3de] pl-10 pr-3 text-sm outline-none focus:border-cyan-700"
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Name, email, phone, college, or ID"
                value={searchInput}
              />
            </label>
          </form>
          <Filter
            label="Account status"
            onChange={(value) => updateFilter(setStatus, value)}
            options={[
              'ACTIVE',
              'PENDING_VERIFICATION',
              'SUSPENDED',
              'BLOCKED',
              'DEACTIVATION_REQUESTED',
            ]}
            value={status}
          />
          <Filter
            label="Role"
            onChange={(value) => updateFilter(setRole, value)}
            options={['STUDENT', 'ADMIN', 'SUPER_ADMIN']}
            value={role}
          />
          <Filter
            label="Sort"
            onChange={(value) => updateFilter(setSortBy, value)}
            options={['newest', 'oldest', 'trust-high']}
            value={sortBy}
          />
        </div>

        {error && (
          <div className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {error}
          </div>
        )}

        {loading ? (
          <AdminLoadingState label="Loading users…" />
        ) : data.items.length ? (
          <div className="overflow-x-auto">
            <table className="min-w-[1120px] w-full text-left">
              <thead className="bg-[#f7f9fc] text-[11px] uppercase tracking-[0.08em] text-[#68707d]">
                <tr>
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">College</th>
                  <th className="px-4 py-3">Verification</th>
                  <th className="px-4 py-3">Role / status</th>
                  <th className="px-4 py-3">Trust</th>
                  <th className="px-4 py-3">Activity</th>
                  <th className="px-4 py-3">Joined</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#edf0f4]">
                {data.items.map((user) => (
                  <tr className="align-top hover:bg-[#fbfcfe]" key={user.id}>
                    <td className="px-4 py-4">
                      <Link
                        className="font-bold text-[#031635] hover:text-cyan-800"
                        to={`/admin/users/${user.id}`}
                      >
                        {user.fullName}
                      </Link>
                      <p className="mt-1 text-xs text-[#68707d]">
                        #{user.id} · {user.collegeEmail}
                      </p>
                      <p className="mt-1 text-xs text-[#7b8796]">
                        {user.phoneNumber}
                      </p>
                    </td>
                    <td className="max-w-60 px-4 py-4 text-sm text-[#40546a]">
                      {user.collegeName}
                    </td>
                    <td className="px-4 py-4 text-xs">
                      <p
                        className={
                          user.emailVerified
                            ? 'text-emerald-700'
                            : 'text-amber-700'
                        }
                      >
                        Email {user.emailVerified ? 'verified' : 'pending'}
                      </p>
                      <p
                        className={`mt-1 ${user.phoneVerified ? 'text-emerald-700' : 'text-amber-700'}`}
                      >
                        Phone {user.phoneVerified ? 'verified' : 'pending'}
                      </p>
                    </td>
                    <td className="space-y-2 px-4 py-4">
                      <span className="block text-xs font-black text-[#40546a]">
                        {user.role.replace('_', ' ')}
                      </span>
                      <StatusBadge value={user.accountStatus} />
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-black text-[#031635]">
                        {user.trustScore}/100
                      </p>
                      <p className="mt-1 text-xs text-[#68707d]">
                        {user.averageRating.toFixed(1)}★ rating
                      </p>
                    </td>
                    <td className="px-4 py-4 text-xs text-[#526075]">
                      <p>{user.totalListings} listings</p>
                      <p className="mt-1">{user.totalOrders} orders</p>
                    </td>
                    <td className="px-4 py-4 text-xs text-[#68707d]">
                      {formatAdminDate(user.createdAt)}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex justify-end gap-2">
                        <Link
                          className="rounded-lg border border-[#cbd3de] px-3 py-2 text-xs font-bold text-[#334155]"
                          to={`/admin/users/${user.id}`}
                        >
                          View
                        </Link>
                        {user.role === 'STUDENT' && (
                          <UserActions
                            onAction={(type) => confirmUserAction(user, type)}
                            status={user.accountStatus}
                          />
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <AdminEmptyState
            description="Try changing the search or account filters."
            title="No users found for this filter"
          />
        )}

        <PaginationControls
          disabled={loading}
          onPageChange={setPage}
          pagination={data.pagination}
        />
      </section>

      <ConfirmActionDialog
        action={action}
        onClose={() => setAction(undefined)}
      />
    </div>
  );
}

function Filter({
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
    <label>
      <span className="sr-only">{label}</span>
      <select
        aria-label={label}
        className="h-11 w-full rounded-xl border border-[#cbd3de] bg-white px-3 text-sm font-semibold outline-none focus:border-cyan-700"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {label !== 'Sort' && (
          <option value="">All {label.toLowerCase()}es</option>
        )}
        {options.map((option) => (
          <option key={option} value={option}>
            {option
              .replace(/-/g, ' ')
              .replace(/_/g, ' ')
              .replace(/\b\w/g, (character) => character.toUpperCase())}
          </option>
        ))}
      </select>
    </label>
  );
}

function UserActions({
  status,
  onAction,
}: {
  status: string;
  onAction: (type: 'warn' | 'suspend' | 'block' | 'reactivate') => void;
}) {
  if (status === 'SUSPENDED' || status === 'BLOCKED') {
    return (
      <button
        aria-label="Reactivate user"
        className="rounded-lg bg-emerald-50 p-2 text-emerald-800 hover:bg-emerald-100"
        onClick={() => onAction('reactivate')}
        title="Reactivate user"
        type="button"
      >
        <UserRoundCheck className="h-4 w-4" />
      </button>
    );
  }
  return (
    <>
      <button
        className="rounded-lg border border-amber-200 px-2.5 py-2 text-xs font-bold text-amber-800"
        onClick={() => onAction('warn')}
        type="button"
      >
        Warn
      </button>
      <button
        aria-label="Suspend or block user"
        className="rounded-lg bg-rose-50 p-2 text-rose-800 hover:bg-rose-100"
        onClick={() => onAction(status === 'ACTIVE' ? 'suspend' : 'block')}
        title={status === 'ACTIVE' ? 'Suspend user' : 'Block user'}
        type="button"
      >
        <ShieldAlert className="h-4 w-4" />
      </button>
    </>
  );
}
