import {
  ArrowLeft,
  Ban,
  CircleAlert,
  MailCheck,
  PhoneCall,
  ShieldCheck,
  UserRoundCheck,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { getApiErrorMessage } from '../../auth/api/authApi';
import {
  getAdminUser,
  moderateUser,
  type AdminUserDetails,
} from '../api/adminApi';
import {
  AdminErrorState,
  AdminLoadingState,
  ConfirmActionDialog,
  StatusBadge,
  type ConfirmAction,
} from '../components/AdminUi';
import {
  formatAdminCurrency,
  formatAdminDate,
  formatAdminLabel,
} from '../lib/adminFormat';

export function AdminUserDetailsPage() {
  const { userId } = useParams();
  const parsedId = Number(userId);
  const [data, setData] = useState<AdminUserDetails>();
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [action, setAction] = useState<ConfirmAction>();

  const load = useCallback(
    async (signal: AbortSignal) => {
      if (!Number.isInteger(parsedId) || parsedId < 1) {
        setError('Invalid user ID.');
        return;
      }
      setError('');
      try {
        setData(await getAdminUser(parsedId, signal));
      } catch (caught) {
        if (!signal.aborted) setError(getApiErrorMessage(caught));
      }
    },
    [parsedId],
  );

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load, reloadKey]);

  function openAction(type: 'warn' | 'suspend' | 'block' | 'reactivate') {
    if (!data) return;
    const copy = {
      warn: {
        title: 'Warn this user?',
        description:
          'The user will receive your guidance. Their access is unchanged.',
        label: 'Send warning',
        tone: 'warning' as const,
      },
      suspend: {
        title: 'Suspend this user?',
        description:
          'Protected marketplace access will be removed and active sessions revoked.',
        label: 'Suspend user',
        tone: 'warning' as const,
      },
      block: {
        title: 'Block this user?',
        description:
          'Login will be blocked and all active listings will be hidden automatically.',
        label: 'Block user',
        tone: 'danger' as const,
      },
      reactivate: {
        title: 'Reactivate this user?',
        description:
          'Account access will be restored. Listings remain subject to their own status.',
        label: 'Reactivate user',
        tone: 'primary' as const,
      },
    }[type];
    setAction({
      title: copy.title,
      description: copy.description,
      confirmLabel: copy.label,
      tone: copy.tone,
      noteRequired: type !== 'reactivate',
      onConfirm: async (note) => {
        try {
          await moderateUser(data.user.id, type, note);
          setNotice(`${copy.label} completed successfully.`);
          setReloadKey((value) => value + 1);
        } catch (caught) {
          throw new Error(getApiErrorMessage(caught));
        }
      },
    });
  }

  if (!data && !error) {
    return <AdminLoadingState label="Loading user details…" />;
  }
  if (!data) {
    return (
      <AdminErrorState
        message={error}
        onRetry={() => setReloadKey((value) => value + 1)}
        title="Unable to load user"
      />
    );
  }

  const { user } = data;
  const isRestricted =
    user.accountStatus === 'SUSPENDED' || user.accountStatus === 'BLOCKED';

  return (
    <div className="space-y-6">
      <Link
        className="inline-flex items-center gap-2 text-sm font-bold text-cyan-800"
        to="/admin/users"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to users
      </Link>

      {notice && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
          {notice}
        </div>
      )}

      <section className="rounded-2xl border border-[#d6d9e2] bg-white p-5 shadow-sm lg:p-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-4">
            <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#d8e2ff] text-lg font-black text-[#081b3a]">
              {user.fullName
                .split(' ')
                .slice(0, 2)
                .map((part) => part[0])
                .join('')}
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-display text-2xl font-black text-[#031635]">
                  {user.fullName}
                </h1>
                <StatusBadge value={user.accountStatus} />
              </div>
              <p className="mt-1 text-sm text-[#526075]">
                User #{user.id} · {user.role.replace('_', ' ')}
              </p>
              <p className="mt-2 text-sm font-semibold text-[#334155]">
                {user.collegeName}
              </p>
            </div>
          </div>
          {user.role === 'STUDENT' && (
            <div className="flex flex-wrap gap-2">
              <ActionButton
                icon={CircleAlert}
                label="Warn"
                onClick={() => openAction('warn')}
                tone="amber"
              />
              {!isRestricted && (
                <ActionButton
                  icon={ShieldCheck}
                  label="Suspend"
                  onClick={() => openAction('suspend')}
                  tone="amber"
                />
              )}
              {user.accountStatus !== 'BLOCKED' && (
                <ActionButton
                  icon={Ban}
                  label="Block"
                  onClick={() => openAction('block')}
                  tone="rose"
                />
              )}
              {isRestricted && (
                <ActionButton
                  icon={UserRoundCheck}
                  label="Reactivate"
                  onClick={() => openAction('reactivate')}
                  tone="green"
                />
              )}
            </div>
          )}
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Metric label="Campus Trust Score" value={`${user.trustScore}/100`} />
          <Metric
            label="Average Rating"
            value={`${user.averageRating.toFixed(1)} / 5`}
          />
          <Metric label="Listings" value={String(user.totalListings)} />
          <Metric label="Orders" value={String(user.totalOrders)} />
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <section className="rounded-2xl border border-[#d6d9e2] bg-white p-5 shadow-sm">
            <h2 className="font-display text-lg font-black text-[#031635]">
              Identity & verification
            </h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Detail
                icon={MailCheck}
                label="College email"
                value={user.collegeEmail}
                verified={user.emailVerified}
              />
              <Detail
                icon={PhoneCall}
                label="Phone"
                value={user.phoneNumber}
                verified={user.phoneVerified}
              />
              <PlainDetail label="Department" value={data.department} />
              <PlainDetail label="Course" value={data.course} />
              <PlainDetail label="Year of study" value={data.yearOfStudy} />
              <PlainDetail
                label="Roll number"
                value={data.rollNumber ?? 'Not provided'}
              />
              <PlainDetail label="Campus area" value={data.campusArea} />
              <PlainDetail
                label="Last login"
                value={formatAdminDate(user.lastLoginAt)}
              />
            </div>
          </section>

          <section className="overflow-hidden rounded-2xl border border-[#d6d9e2] bg-white shadow-sm">
            <div className="border-b border-[#e6e8ee] px-5 py-4">
              <h2 className="font-display text-lg font-black text-[#031635]">
                Recent listings
              </h2>
              <p className="mt-1 text-xs text-[#68707d]">
                Latest items created by this user
              </p>
            </div>
            {data.recentListings.length ? (
              <div className="divide-y divide-[#edf0f4]">
                {data.recentListings.map((listing) => (
                  <Link
                    className="flex items-center justify-between gap-4 p-4 hover:bg-[#f8fbff]"
                    key={listing.id}
                    to={`/admin/listings/${listing.id}`}
                  >
                    <div className="min-w-0">
                      <p className="truncate font-bold text-[#031635]">
                        {listing.title}
                      </p>
                      <p className="mt-1 text-xs text-[#68707d]">
                        {formatAdminDate(listing.createdAt)}
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
              </div>
            ) : (
              <p className="px-5 py-10 text-center text-sm text-[#68707d]">
                This user has no listings.
              </p>
            )}
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-2xl border border-[#d6d9e2] bg-white p-5 shadow-sm">
            <h2 className="font-display text-lg font-black text-[#031635]">
              Safety summary
            </h2>
            <div className="mt-4 space-y-3">
              <MetricRow
                label="Reports submitted"
                value={data.reportsSubmitted}
              />
              <MetricRow
                label="Reports received"
                value={data.reportsReceived}
              />
              <MetricRow
                label="Joined"
                value={formatAdminDate(user.createdAt)}
              />
            </div>
          </section>

          <section className="overflow-hidden rounded-2xl border border-[#d6d9e2] bg-white shadow-sm">
            <div className="border-b border-[#e6e8ee] px-5 py-4">
              <h2 className="font-display text-lg font-black text-[#031635]">
                Moderation history
              </h2>
            </div>
            {data.moderationHistory.length ? (
              <div className="divide-y divide-[#edf0f4]">
                {data.moderationHistory.map((entry) => (
                  <div className="p-4" key={entry.id}>
                    <p className="text-sm font-bold text-[#031635]">
                      {formatAdminLabel(entry.actionType)}
                    </p>
                    <p className="mt-1 text-xs text-[#68707d]">
                      {entry.adminName} · {formatAdminDate(entry.createdAt)}
                    </p>
                    {entry.note && (
                      <p className="mt-2 text-xs leading-5 text-[#526075]">
                        {entry.note}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="px-5 py-10 text-center text-sm text-[#68707d]">
                No moderation actions recorded.
              </p>
            )}
          </section>
        </div>
      </div>

      <ConfirmActionDialog
        action={action}
        onClose={() => setAction(undefined)}
      />
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-[#f5f8fc] p-4">
      <p className="text-xl font-black text-[#031635]">{value}</p>
      <p className="mt-1 text-xs font-semibold text-[#68707d]">{label}</p>
    </div>
  );
}

function Detail({
  icon: Icon,
  label,
  value,
  verified,
}: {
  icon: typeof MailCheck;
  label: string;
  value: string;
  verified: boolean;
}) {
  return (
    <div className="rounded-xl border border-[#e0e5ed] p-4">
      <div className="flex items-center gap-2 text-[#526075]">
        <Icon className="h-4 w-4" />
        <span className="text-xs font-bold">{label}</span>
      </div>
      <p className="mt-2 break-all text-sm font-semibold text-[#031635]">
        {value}
      </p>
      <p
        className={`mt-1 text-xs font-bold ${verified ? 'text-emerald-700' : 'text-amber-700'}`}
      >
        {verified ? 'Verified' : 'Pending verification'}
      </p>
    </div>
  );
}

function PlainDetail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-bold text-[#7b8796]">{label}</p>
      <p className="mt-1 text-sm font-semibold text-[#273b53]">{value}</p>
    </div>
  );
}

function MetricRow({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-[#f7f9fc] px-4 py-3">
      <span className="text-sm text-[#526075]">{label}</span>
      <span className="text-sm font-black text-[#031635]">{value}</span>
    </div>
  );
}

function ActionButton({
  icon: Icon,
  label,
  onClick,
  tone,
}: {
  icon: typeof Ban;
  label: string;
  onClick: () => void;
  tone: 'amber' | 'rose' | 'green';
}) {
  const style = {
    amber: 'border-amber-200 bg-amber-50 text-amber-800',
    rose: 'border-rose-200 bg-rose-50 text-rose-800',
    green: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  }[tone];
  return (
    <button
      className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-bold ${style}`}
      onClick={onClick}
      type="button"
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}
