import { Search } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { getApiErrorMessage } from '../../auth/api/authApi';
import {
  deleteListing,
  getAdminListings,
  moderateListing,
  type AdminListing,
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
import {
  formatAdminCurrency,
  formatAdminDate,
  formatAdminLabel,
} from '../lib/adminFormat';

const categories = [
  'Books',
  'Notes',
  'Electronics',
  'Bicycles',
  'Hostel Essentials',
  'Furniture',
  'Lab Equipment',
  'Stationery',
  'Clothing',
  'Others',
];

export function AdminListingsPage() {
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [category, setCategory] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [page, setPage] = useState(0);
  const [data, setData] = useState<PageResponse<AdminListing>>();
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
          await getAdminListings(
            {
              search: search || undefined,
              status: status || undefined,
              category: category || undefined,
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
    [category, page, search, sortBy, status],
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

  function openListingAction(
    listing: AdminListing,
    type: 'under-review' | 'block' | 'restore' | 'delete',
  ) {
    const copy = {
      'under-review': {
        title: 'Mark listing under review?',
        description:
          'The listing will be hidden from buying while the safety concern is checked.',
        label: 'Mark under review',
        tone: 'warning' as const,
      },
      block: {
        title: 'Block this listing?',
        description:
          'The listing will be removed from every marketplace and cannot be purchased.',
        label: 'Block listing',
        tone: 'danger' as const,
      },
      restore: {
        title: 'Restore this listing?',
        description:
          'The listing will return to the active marketplace. Sold and deleted listings remain protected.',
        label: 'Restore listing',
        tone: 'primary' as const,
      },
      delete: {
        title: 'Soft delete this listing?',
        description:
          'The item will be retained for audit and order history but removed from the marketplace.',
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
            await deleteListing(listing.id, note);
          } else {
            await moderateListing(listing.id, type, note);
          }
          setNotice(`${copy.label} completed successfully.`);
          setReloadKey((value) => value + 1);
        } catch (caught) {
          throw new Error(getApiErrorMessage(caught));
        }
      },
    });
  }

  if (loading && !data) {
    return <AdminLoadingState label="Loading listings…" />;
  }
  if (error && !data) {
    return (
      <AdminErrorState
        message={error}
        onRetry={() => setReloadKey((value) => value + 1)}
        title="Unable to load listings"
      />
    );
  }
  if (!data) return null;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        description="Inspect items across colleges, review safety signals, and use soft actions that preserve audit and order history."
        eyebrow="Marketplace operations"
        title="Listing Management"
      />

      {notice && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
          {notice}
        </div>
      )}

      <section className="overflow-hidden rounded-2xl border border-[#d6d9e2] bg-white shadow-sm">
        <div className="grid gap-3 border-b border-[#e6e8ee] p-4 lg:grid-cols-[minmax(260px,1fr)_190px_190px_180px]">
          <form className="relative" onSubmit={submitSearch}>
            <label>
              <span className="sr-only">Search listings</span>
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#68707d]" />
              <input
                className="h-11 w-full rounded-xl border border-[#cbd3de] pl-10 pr-3 text-sm outline-none focus:border-cyan-700"
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Title, seller, college, category, or ID"
                value={searchInput}
              />
            </label>
          </form>
          <Select
            label="Listing status"
            onChange={(value) => updateFilter(setStatus, value)}
            options={[
              'ACTIVE',
              'UNDER_REVIEW',
              'BLOCKED',
              'SOLD',
              'RESERVED',
              'INACTIVE',
              'DELETED',
            ]}
            value={status}
          />
          <Select
            label="Category"
            onChange={(value) => updateFilter(setCategory, value)}
            options={categories}
            value={category}
          />
          <Select
            label="Sort"
            onChange={(value) => updateFilter(setSortBy, value)}
            options={[
              'newest',
              'oldest',
              'price-high',
              'price-low',
              'most-viewed',
            ]}
            value={sortBy}
          />
        </div>

        {error && (
          <div className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {error}
          </div>
        )}

        {loading ? (
          <AdminLoadingState label="Loading listings…" />
        ) : data.items.length ? (
          <div className="overflow-x-auto">
            <table className="min-w-[1180px] w-full text-left">
              <thead className="bg-[#f7f9fc] text-[11px] uppercase tracking-[0.08em] text-[#68707d]">
                <tr>
                  <th className="px-4 py-3">Listing</th>
                  <th className="px-4 py-3">Seller / college</th>
                  <th className="px-4 py-3">Price</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Safety</th>
                  <th className="px-4 py-3">Engagement</th>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#edf0f4]">
                {data.items.map((listing) => (
                  <tr className="align-top hover:bg-[#fbfcfe]" key={listing.id}>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#edf3fb] text-xs font-black text-[#1f3b5f]">
                          {listing.title.slice(0, 2).toUpperCase()}
                        </span>
                        <div className="min-w-0 max-w-64">
                          <Link
                            className="block truncate font-bold text-[#031635] hover:text-cyan-800"
                            to={`/admin/listings/${listing.id}`}
                          >
                            {listing.title}
                          </Link>
                          <p className="mt-1 text-xs text-[#68707d]">
                            #{listing.id} · {listing.category}
                          </p>
                          <p className="mt-1 text-xs text-[#7b8796]">
                            {formatAdminLabel(listing.condition)}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="max-w-60 px-4 py-4 text-sm">
                      <Link
                        className="font-bold text-[#334155] hover:text-cyan-800"
                        to={`/admin/users/${listing.sellerId}`}
                      >
                        {listing.sellerName}
                      </Link>
                      <p className="mt-1 text-xs text-[#68707d]">
                        {listing.collegeName}
                      </p>
                    </td>
                    <td className="px-4 py-4 font-black text-[#031635]">
                      {formatAdminCurrency(listing.price)}
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge value={listing.status} />
                    </td>
                    <td className="px-4 py-4 text-xs">
                      <p
                        className={
                          listing.reportCount
                            ? 'font-black text-rose-700'
                            : 'text-[#68707d]'
                        }
                      >
                        {listing.reportCount} reports
                      </p>
                      {listing.reportCount > 0 && (
                        <Link
                          className="mt-1 inline-block font-bold text-cyan-800"
                          to="/admin/reports"
                        >
                          View reports
                        </Link>
                      )}
                    </td>
                    <td className="px-4 py-4 text-xs text-[#526075]">
                      <p>{listing.views} views</p>
                      <p className="mt-1">{listing.wishlistCount} wishlists</p>
                    </td>
                    <td className="px-4 py-4 text-xs text-[#68707d]">
                      {formatAdminDate(listing.createdAt)}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex justify-end gap-2">
                        <Link
                          className="rounded-lg border border-[#cbd3de] px-3 py-2 text-xs font-bold text-[#334155]"
                          to={`/admin/listings/${listing.id}`}
                        >
                          View
                        </Link>
                        <ListingActions
                          listing={listing}
                          onAction={(type) => openListingAction(listing, type)}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <AdminEmptyState
            description="Try changing the search, status, or category filters."
            title="No listings found for this filter"
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
      {label !== 'Sort' && <option value="">All {label.toLowerCase()}</option>}
      {options.map((option) => (
        <option key={option} value={option}>
          {formatAdminLabel(option.replace(/-/g, '_'))}
        </option>
      ))}
    </select>
  );
}

function ListingActions({
  listing,
  onAction,
}: {
  listing: AdminListing;
  onAction: (type: 'under-review' | 'block' | 'restore' | 'delete') => void;
}) {
  if (listing.status === 'SOLD' || listing.status === 'DELETED') return null;
  if (listing.status === 'BLOCKED' || listing.status === 'UNDER_REVIEW') {
    return (
      <button
        className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-800"
        onClick={() => onAction('restore')}
        type="button"
      >
        Restore
      </button>
    );
  }
  return (
    <>
      <button
        className="rounded-lg bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800"
        onClick={() => onAction('under-review')}
        type="button"
      >
        Review
      </button>
      <button
        className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-bold text-rose-800"
        onClick={() => onAction('block')}
        type="button"
      >
        Block
      </button>
    </>
  );
}
