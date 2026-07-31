import { EyeOff, RotateCcw, Star } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { getApiErrorMessage } from '../../auth/api/authApi';
import {
  getAdminReviews,
  moderateReview,
  type AdminReview,
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

export function AdminReviewsPage() {
  const [rating, setRating] = useState('');
  const [status, setStatus] = useState('');
  const [reported, setReported] = useState('');
  const [page, setPage] = useState(0);
  const [data, setData] = useState<PageResponse<AdminReview>>();
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
          await getAdminReviews(
            {
              rating: rating ? Number(rating) : undefined,
              status: status || undefined,
              reported: reported === '' ? undefined : reported === 'reported',
              page,
              size: 20,
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
    [page, rating, reported, status],
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

  function openReviewAction(review: AdminReview, type: 'hide' | 'restore') {
    const hide = type === 'hide';
    setAction({
      title: hide ? 'Hide this review?' : 'Restore this review?',
      description: hide
        ? 'The original text remains unchanged for the audit record but will no longer appear publicly.'
        : 'The original review will become visible again on the seller profile.',
      confirmLabel: hide ? 'Hide review' : 'Restore review',
      tone: hide ? 'danger' : 'primary',
      noteRequired: hide,
      onConfirm: async (note) => {
        try {
          await moderateReview(review.id, type, note);
          setNotice(
            hide
              ? 'Review hidden successfully.'
              : 'Review restored successfully.',
          );
          setReloadKey((value) => value + 1);
        } catch (caught) {
          throw new Error(getApiErrorMessage(caught));
        }
      },
    });
  }

  if (loading && !data) {
    return <AdminLoadingState label="Loading reviews…" />;
  }
  if (error && !data) {
    return (
      <AdminErrorState
        message={error}
        onRetry={() => setReloadKey((value) => value + 1)}
        title="Unable to load reviews"
      />
    );
  }
  if (!data) return null;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        description="Review reported feedback and hide abusive content without editing or destroying the original record."
        eyebrow="Content safety"
        title="Review Management"
      />

      {notice && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
          {notice}
        </div>
      )}

      <section className="overflow-hidden rounded-2xl border border-[#d6d9e2] bg-white shadow-sm">
        <div className="grid gap-3 border-b border-[#e6e8ee] p-4 sm:grid-cols-3">
          <Filter
            label="Rating"
            onChange={(value) => updateFilter(setRating, value)}
            options={[
              ['5', '5 stars'],
              ['4', '4 stars'],
              ['3', '3 stars'],
              ['2', '2 stars'],
              ['1', '1 star'],
            ]}
            value={rating}
          />
          <Filter
            label="Review status"
            onChange={(value) => updateFilter(setStatus, value)}
            options={[
              ['VISIBLE', 'Visible'],
              ['UNDER_REVIEW', 'Under review'],
              ['HIDDEN', 'Hidden'],
              ['DELETED', 'Deleted'],
            ]}
            value={status}
          />
          <Filter
            label="Reports"
            onChange={(value) => updateFilter(setReported, value)}
            options={[
              ['reported', 'Reported only'],
              ['not-reported', 'Not reported'],
            ]}
            value={reported}
          />
        </div>

        {error && (
          <div className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {error}
          </div>
        )}

        {loading ? (
          <AdminLoadingState label="Loading reviews…" />
        ) : data.items.length ? (
          <div className="divide-y divide-[#edf0f4]">
            {data.items.map((review) => (
              <article
                className="grid gap-4 p-5 lg:grid-cols-[minmax(0,1fr)_260px_170px] lg:items-center"
                key={review.id}
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-black text-amber-800">
                      <Star className="h-3.5 w-3.5 fill-current" />
                      {review.rating}/5
                    </span>
                    <StatusBadge value={review.status} />
                    {review.reportCount > 0 && (
                      <span className="rounded-full bg-rose-100 px-2.5 py-1 text-xs font-black text-rose-800">
                        {review.reportCount} report
                        {review.reportCount === 1 ? '' : 's'}
                      </span>
                    )}
                  </div>
                  <p className="mt-3 line-clamp-3 text-sm leading-6 text-[#334155]">
                    “{review.comment}”
                  </p>
                  <p className="mt-2 text-xs text-[#68707d]">
                    Review #{review.id} · {formatAdminDate(review.createdAt)}
                  </p>
                </div>
                <div className="text-sm">
                  <p>
                    <span className="text-[#7b8796]">Buyer: </span>
                    <Link
                      className="font-bold text-[#273b53] hover:text-cyan-800"
                      to={`/admin/users/${review.buyerId}`}
                    >
                      {review.buyerName}
                    </Link>
                  </p>
                  <p className="mt-1">
                    <span className="text-[#7b8796]">Seller: </span>
                    <Link
                      className="font-bold text-[#273b53] hover:text-cyan-800"
                      to={`/admin/users/${review.sellerId}`}
                    >
                      {review.sellerName}
                    </Link>
                  </p>
                  <Link
                    className="mt-2 block truncate text-xs font-bold text-cyan-800"
                    to={`/admin/listings/${review.listingId}`}
                  >
                    {review.listingTitle}
                  </Link>
                  <p className="mt-1 text-xs text-[#68707d]">
                    {review.collegeName}
                  </p>
                </div>
                <div className="flex flex-wrap justify-start gap-2 lg:justify-end">
                  <Link
                    className="rounded-lg border border-[#cbd3de] px-3 py-2 text-xs font-bold text-[#334155]"
                    to={`/admin/orders/${review.orderId}`}
                  >
                    View order
                  </Link>
                  {review.status === 'HIDDEN' ? (
                    <button
                      className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-800"
                      onClick={() => openReviewAction(review, 'restore')}
                      type="button"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      Restore
                    </button>
                  ) : review.status !== 'DELETED' ? (
                    <button
                      className="inline-flex items-center gap-1.5 rounded-lg bg-rose-50 px-3 py-2 text-xs font-bold text-rose-800"
                      onClick={() => openReviewAction(review, 'hide')}
                      type="button"
                    >
                      <EyeOff className="h-3.5 w-3.5" />
                      Hide
                    </button>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <AdminEmptyState
            description="Try changing the rating, status, or report filter."
            title="No reviews found"
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
  options: Array<[string, string]>;
  onChange: (value: string) => void;
}) {
  return (
    <select
      aria-label={label}
      className="h-11 rounded-xl border border-[#cbd3de] bg-white px-3 text-sm font-semibold outline-none focus:border-cyan-700"
      onChange={(event) => onChange(event.target.value)}
      value={value}
    >
      <option value="">All {label.toLowerCase()}</option>
      {options.map(([optionValue, optionLabel]) => (
        <option key={optionValue} value={optionValue}>
          {optionLabel}
        </option>
      ))}
    </select>
  );
}
