import {
  ArrowLeft,
  Ban,
  Eye,
  Heart,
  PackageCheck,
  ShieldAlert,
  Trash2,
  Undo2,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { getApiErrorMessage } from '../../auth/api/authApi';
import {
  deleteListing,
  getAdminListing,
  moderateListing,
  type AdminListingDetails,
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

export function AdminListingDetailsPage() {
  const { listingId } = useParams();
  const parsedId = Number(listingId);
  const [data, setData] = useState<AdminListingDetails>();
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [action, setAction] = useState<ConfirmAction>();

  const load = useCallback(
    async (signal: AbortSignal) => {
      if (!Number.isInteger(parsedId) || parsedId < 1) {
        setError('Invalid listing ID.');
        return;
      }
      setError('');
      try {
        setData(await getAdminListing(parsedId, signal));
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

  function openAction(type: 'under-review' | 'block' | 'restore' | 'delete') {
    if (!data) return;
    const copy = {
      'under-review': {
        title: 'Mark listing under review?',
        description:
          'The listing will be hidden and cannot be purchased during the review.',
        label: 'Mark under review',
        tone: 'warning' as const,
      },
      block: {
        title: 'Block this listing?',
        description:
          'The listing will be removed from every marketplace until explicitly restored.',
        label: 'Block listing',
        tone: 'danger' as const,
      },
      restore: {
        title: 'Restore this listing?',
        description:
          'The item will return to the active marketplace for verified students.',
        label: 'Restore listing',
        tone: 'primary' as const,
      },
      delete: {
        title: 'Soft delete this listing?',
        description:
          'The record and related history will be retained, but the item cannot return without a future controlled recovery process.',
        label: 'Delete listing',
        tone: 'danger' as const,
      },
    }[type];
    setAction({
      ...copy,
      confirmLabel: copy.label,
      noteRequired: type !== 'restore',
      onConfirm: async (note) => {
        try {
          if (type === 'delete') {
            await deleteListing(data.listing.id, note);
          } else {
            await moderateListing(data.listing.id, type, note);
          }
          setNotice(`${copy.label} completed successfully.`);
          setReloadKey((value) => value + 1);
        } catch (caught) {
          throw new Error(getApiErrorMessage(caught));
        }
      },
    });
  }

  if (!data && !error) {
    return <AdminLoadingState label="Loading listing details…" />;
  }
  if (!data) {
    return (
      <AdminErrorState
        message={error}
        onRetry={() => setReloadKey((value) => value + 1)}
        title="Unable to load listing"
      />
    );
  }

  const { listing } = data;
  const canModerate = !['SOLD', 'DELETED'].includes(listing.status);
  const canRestore = ['BLOCKED', 'UNDER_REVIEW'].includes(listing.status);

  return (
    <div className="space-y-6">
      <Link
        className="inline-flex items-center gap-2 text-sm font-bold text-cyan-800"
        to="/admin/listings"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to listings
      </Link>

      {notice && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
          {notice}
        </div>
      )}

      <section className="rounded-2xl border border-[#d6d9e2] bg-white p-5 shadow-sm lg:p-7">
        <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
          <div className="flex min-h-52 items-center justify-center rounded-2xl bg-gradient-to-br from-[#edf4ff] to-[#dbe9f7] text-4xl font-black text-[#24496f]">
            {listing.title.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge value={listing.status} />
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-black text-slate-700">
                    {listing.category}
                  </span>
                </div>
                <h1 className="mt-3 font-display text-3xl font-black text-[#031635]">
                  {listing.title}
                </h1>
                <p className="mt-2 text-sm text-[#68707d]">
                  Listing #{listing.id} · Created{' '}
                  {formatAdminDate(listing.createdAt)}
                </p>
              </div>
              <p className="text-3xl font-black text-[#031635]">
                {formatAdminCurrency(listing.price)}
              </p>
            </div>

            <p className="mt-5 max-w-4xl text-sm leading-7 text-[#40546a]">
              {data.description}
            </p>

            {canModerate && (
              <div className="mt-6 flex flex-wrap gap-2">
                {canRestore ? (
                  <ActionButton
                    icon={Undo2}
                    label="Restore"
                    onClick={() => openAction('restore')}
                    tone="green"
                  />
                ) : (
                  <>
                    <ActionButton
                      icon={ShieldAlert}
                      label="Mark under review"
                      onClick={() => openAction('under-review')}
                      tone="amber"
                    />
                    <ActionButton
                      icon={Ban}
                      label="Block"
                      onClick={() => openAction('block')}
                      tone="rose"
                    />
                  </>
                )}
                <ActionButton
                  icon={Trash2}
                  label="Soft delete"
                  onClick={() => openAction('delete')}
                  tone="rose"
                />
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-6">
          <section className="rounded-2xl border border-[#d6d9e2] bg-white p-5 shadow-sm">
            <h2 className="font-display text-lg font-black text-[#031635]">
              Listing details
            </h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Detail
                label="Condition"
                value={formatAdminLabel(listing.condition)}
              />
              <Detail label="Pickup location" value={data.pickupLocation} />
              <Detail
                label="Price flexibility"
                value={data.negotiable ? 'Negotiable' : 'Fixed price'}
              />
              <Detail
                label="Available quantity"
                value={String(data.availableQuantity)}
              />
              <Detail
                label="Additional notes"
                value={data.additionalNotes ?? 'None'}
              />
              <Detail label="Linked orders" value={String(data.linkedOrders)} />
            </div>
          </section>

          <section className="rounded-2xl border border-[#d6d9e2] bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="font-display text-lg font-black text-[#031635]">
                  Seller
                </h2>
                <p className="mt-1 text-xs text-[#68707d]">
                  Account and college context
                </p>
              </div>
              <Link
                className="rounded-xl border border-[#cbd3de] px-3 py-2 text-xs font-bold text-[#334155]"
                to={`/admin/users/${listing.sellerId}`}
              >
                View user
              </Link>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <Detail label="Seller" value={listing.sellerName} />
              <Detail label="College" value={listing.collegeName} />
              <Detail
                label="Account / trust"
                value={`${formatAdminLabel(data.sellerStatus)} · ${data.sellerTrustScore}/100`}
              />
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-2xl border border-[#d6d9e2] bg-white p-5 shadow-sm">
            <h2 className="font-display text-lg font-black text-[#031635]">
              Marketplace signals
            </h2>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <Signal
                icon={ShieldAlert}
                label="Reports"
                value={listing.reportCount}
              />
              <Signal
                icon={Heart}
                label="Wishlists"
                value={listing.wishlistCount}
              />
              <Signal icon={Eye} label="Views" value={listing.views} />
              <Signal
                icon={PackageCheck}
                label="Orders"
                value={data.linkedOrders}
              />
            </div>
            {listing.reportCount > 0 && (
              <Link
                className="mt-4 block rounded-xl bg-[#031635] px-4 py-3 text-center text-sm font-bold text-white"
                to="/admin/reports"
              >
                Open reports queue
              </Link>
            )}
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

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-bold text-[#7b8796]">{label}</p>
      <p className="mt-1 text-sm font-semibold text-[#273b53]">{value}</p>
    </div>
  );
}

function Signal({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Eye;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl bg-[#f5f8fc] p-3">
      <Icon className="h-4 w-4 text-cyan-800" />
      <p className="mt-2 text-xl font-black text-[#031635]">{value}</p>
      <p className="text-xs text-[#68707d]">{label}</p>
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
