import {
  CheckCircle2,
  Flag,
  Inbox,
  LoaderCircle,
  MessageSquareText,
  PackageCheck,
  RefreshCw,
  Send,
  Star,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { getApiErrorMessage } from '../../auth/api/authApi';
import { relativeNotificationTime } from '../../notifications/lib/notificationFormat';
import {
  reportReview,
  type ReportReason,
  type ReviewReportReason,
} from '../../reports/api/reportsApi';
import { ReportEntityModal } from '../../reports/components/ReportEntityModal';
import { PageHeader } from '../../student/components/StudentUi';
import { getReviewWorkspace, submitOrderReview } from '../api/reviewsApi';
import type {
  PendingReview,
  ReviewItem,
  ReviewWorkspace,
} from '../api/reviewsApi';

type ReviewTab = 'pending' | 'received' | 'given';

export function ReviewsPage() {
  const [workspace, setWorkspace] = useState<ReviewWorkspace>();
  const [activeTab, setActiveTab] = useState<ReviewTab>('pending');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [reportingReview, setReportingReview] = useState<ReviewItem>();

  const load = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError('');
    try {
      setWorkspace(await getReviewWorkspace(signal));
    } catch (caught) {
      if (!signal?.aborted) setError(getApiErrorMessage(caught));
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);

  async function submit(orderId: number, rating: number, message: string) {
    await submitOrderReview(orderId, { rating, message });
    setNotice(
      'Review submitted successfully. Thank you for helping campus trust.',
    );
    await load();
  }

  async function submitReport(reason: ReportReason, description: string) {
    if (!reportingReview) return;
    try {
      await reportReview(
        reportingReview.id,
        reason as ReviewReportReason,
        description,
      );
      setNotice('Review report submitted. Track updates in My Reports.');
    } catch (caught) {
      throw new Error(getApiErrorMessage(caught));
    }
  }

  if (loading && !workspace) return <ReviewsLoading />;
  if (error || !workspace) {
    return <ReviewsError error={error} retry={() => void load()} />;
  }

  return (
    <div className="space-y-6 pb-16 md:pb-4">
      <PageHeader
        description="Share order-based feedback and review the reputation you have built through completed campus deals."
        eyebrow="Community reputation"
        title="Reviews"
      />

      {notice && (
        <div
          className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800"
          role="status"
        >
          <CheckCircle2
            aria-hidden="true"
            className="mt-0.5 h-4 w-4 shrink-0"
          />
          {notice}
        </div>
      )}

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <ReviewStat
          icon={Star}
          label="Average rating"
          tone="amber"
          value={
            workspace.stats.receivedReviews
              ? `${workspace.stats.averageRating.toFixed(1)} / 5`
              : 'New'
          }
        />
        <ReviewStat
          icon={Inbox}
          label="Reviews received"
          tone="blue"
          value={workspace.stats.receivedReviews.toString()}
        />
        <ReviewStat
          icon={MessageSquareText}
          label="Reviews given"
          tone="green"
          value={workspace.stats.givenReviews.toString()}
        />
        <ReviewStat
          icon={PackageCheck}
          label="Pending reviews"
          tone="cyan"
          value={workspace.stats.pendingReviews.toString()}
        />
      </section>

      <section className="overflow-hidden rounded-2xl border border-[#d6d9e2] bg-white shadow-sm">
        <div
          aria-label="Review categories"
          className="flex overflow-x-auto border-b border-[#e6e8ee] px-2 sm:px-4"
          role="tablist"
        >
          <ReviewTabButton
            active={activeTab === 'pending'}
            count={workspace.stats.pendingReviews}
            label="Pending"
            onClick={() => setActiveTab('pending')}
          />
          <ReviewTabButton
            active={activeTab === 'received'}
            count={workspace.stats.receivedReviews}
            label="Received"
            onClick={() => setActiveTab('received')}
          />
          <ReviewTabButton
            active={activeTab === 'given'}
            count={workspace.stats.givenReviews}
            label="Given"
            onClick={() => setActiveTab('given')}
          />
        </div>

        {activeTab === 'pending' &&
          (workspace.pendingReviews.length ? (
            <div className="divide-y divide-[#edf0f4]">
              {workspace.pendingReviews.map((review) => (
                <PendingReviewCard
                  key={review.orderId}
                  onSubmit={submit}
                  review={review}
                />
              ))}
            </div>
          ) : (
            <ReviewEmpty
              description="Completed purchases that are ready for feedback will appear here."
              title="No reviews waiting"
            />
          ))}
        {activeTab === 'received' &&
          (workspace.receivedReviews.length ? (
            <ReviewHistory
              items={workspace.receivedReviews}
              onReport={setReportingReview}
              perspective="received"
            />
          ) : (
            <ReviewEmpty
              description="Reviews from buyers will appear after successful handovers."
              title="No reviews received yet"
            />
          ))}
        {activeTab === 'given' &&
          (workspace.givenReviews.length ? (
            <ReviewHistory items={workspace.givenReviews} perspective="given" />
          ) : (
            <ReviewEmpty
              description="Reviews you submit for completed purchases will appear here."
              title="No reviews submitted yet"
            />
          ))}
      </section>
      <ReportEntityModal
        onClose={() => setReportingReview(undefined)}
        onSubmit={submitReport}
        open={Boolean(reportingReview)}
        targetName={
          reportingReview
            ? `${reportingReview.reviewerName}: “${reportingReview.message}”`
            : ''
        }
        type="REVIEW"
      />
    </div>
  );
}

function PendingReviewCard({
  review,
  onSubmit,
}: {
  review: PendingReview;
  onSubmit: (orderId: number, rating: number, message: string) => Promise<void>;
}) {
  const [rating, setRating] = useState(0);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function submit() {
    if (!rating || !message.trim() || submitting) return;
    setSubmitting(true);
    setError('');
    try {
      await onSubmit(review.orderId, rating, message.trim());
    } catch (caught) {
      setError(getApiErrorMessage(caught));
      setSubmitting(false);
    }
  }

  return (
    <article className="grid gap-5 p-5 lg:grid-cols-[minmax(0,0.8fr)_minmax(360px,1.2fr)] lg:p-6">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.12em] text-amber-700">
          Review pending
        </p>
        <Link
          className="mt-2 block font-display text-lg font-black text-[#031635] hover:text-cyan-800"
          to={`/listing/${review.listingId}`}
        >
          {review.listingTitle}
        </Link>
        <p className="mt-2 text-sm text-[#68707d]">
          Purchased from{' '}
          <strong className="text-[#34465d]">{review.sellerName}</strong>
        </p>
        <Link
          className="mt-3 inline-flex text-xs font-bold text-cyan-800 hover:underline"
          to={`/student/orders/${review.orderId}`}
        >
          {review.orderNumber}
        </Link>
        <p className="mt-2 text-xs text-[#8a95a4]">
          Completed {relativeNotificationTime(review.completedAt)}
        </p>
      </div>

      <div className="rounded-xl border border-[#e1e5eb] bg-[#f8f9ff] p-4">
        <fieldset>
          <legend className="text-sm font-bold text-[#263346]">
            Rate your experience
          </legend>
          <div className="mt-2 flex gap-1" role="radiogroup">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                aria-label={`${value} star${value === 1 ? '' : 's'}`}
                aria-pressed={rating === value}
                className="rounded-lg p-1.5 hover:bg-amber-50"
                key={value}
                onClick={() => setRating(value)}
                type="button"
              >
                <Star
                  aria-hidden="true"
                  className={`h-7 w-7 ${
                    value <= rating
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-[#c7ced8]'
                  }`}
                />
              </button>
            ))}
          </div>
        </fieldset>
        <label className="mt-3 block">
          <span className="text-sm font-bold text-[#263346]">
            Share useful feedback
          </span>
          <textarea
            className="mt-2 min-h-24 w-full resize-y rounded-lg border border-[#cbd3de] bg-white p-3 text-sm outline-none focus:border-cyan-700 focus:ring-2 focus:ring-cyan-100"
            maxLength={1000}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Describe the item accuracy, communication, and handover experience."
            value={message}
          />
          <span className="mt-1 block text-right text-[10px] text-[#8a95a4]">
            {message.length}/1000
          </span>
        </label>
        {error && (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
            {error}
          </p>
        )}
        <button
          className="mt-3 inline-flex h-10 items-center gap-2 rounded-lg bg-[#031635] px-4 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!rating || !message.trim() || submitting}
          onClick={() => void submit()}
          type="button"
        >
          {submitting ? (
            <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />
          ) : (
            <Send aria-hidden="true" className="h-4 w-4" />
          )}
          {submitting ? 'Submitting…' : 'Submit review'}
        </button>
      </div>
    </article>
  );
}

function ReviewHistory({
  items,
  perspective,
  onReport,
}: {
  items: ReviewItem[];
  perspective: 'received' | 'given';
  onReport?: (review: ReviewItem) => void;
}) {
  return (
    <div className="divide-y divide-[#edf0f4]">
      {items.map((review) => (
        <article className="p-5 sm:p-6" key={review.id}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <Link
                className="font-display font-black text-[#031635] hover:text-cyan-800"
                to={`/listing/${review.listingId}`}
              >
                {review.listingTitle}
              </Link>
              <p className="mt-1 text-xs text-[#68707d]">
                {perspective === 'received'
                  ? `From ${review.reviewerName}`
                  : `For ${review.revieweeName}`}{' '}
                · {review.orderNumber}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <div
                aria-label={`${review.rating} out of 5 stars`}
                className="flex gap-0.5"
              >
                {[1, 2, 3, 4, 5].map((value) => (
                  <Star
                    aria-hidden="true"
                    className={`h-4 w-4 ${
                      value <= review.rating
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-[#d5dbe3]'
                    }`}
                    key={value}
                  />
                ))}
              </div>
              {onReport && (
                <button
                  aria-label={`Report review from ${review.reviewerName}`}
                  className="rounded-lg p-2 text-[#7d8795] hover:bg-rose-50 hover:text-rose-700"
                  onClick={() => onReport(review)}
                  title="Report review"
                  type="button"
                >
                  <Flag aria-hidden="true" className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
          <p className="mt-3 text-sm leading-6 text-[#526174]">
            {review.message}
          </p>
          <time
            className="mt-3 block text-xs text-[#8a95a4]"
            dateTime={review.createdAt}
          >
            {relativeNotificationTime(review.createdAt)}
          </time>
        </article>
      ))}
    </div>
  );
}

function ReviewTabButton({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      aria-selected={active}
      className={`relative h-14 shrink-0 px-4 text-sm font-bold ${
        active ? 'text-[#031635]' : 'text-[#68707d] hover:text-[#263346]'
      }`}
      onClick={onClick}
      role="tab"
      type="button"
    >
      {label}
      <span className="ml-2 rounded-full bg-[#edf1f7] px-2 py-0.5 text-[10px]">
        {count}
      </span>
      {active && (
        <span className="absolute inset-x-2 bottom-0 h-0.5 rounded bg-cyan-700" />
      )}
    </button>
  );
}

function ReviewStat({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Star;
  label: string;
  value: string;
  tone: 'amber' | 'blue' | 'green' | 'cyan';
}) {
  const tones = {
    amber: 'bg-amber-100 text-amber-800',
    blue: 'bg-blue-100 text-blue-800',
    green: 'bg-emerald-100 text-emerald-800',
    cyan: 'bg-cyan-100 text-cyan-800',
  };
  return (
    <article className="flex items-center gap-3 rounded-xl border border-[#d6d9e2] bg-white p-4 shadow-sm">
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tones[tone]}`}
      >
        <Icon aria-hidden="true" className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <p className="text-xl font-black text-[#031635]">{value}</p>
        <p className="truncate text-xs font-semibold text-[#68707d]">{label}</p>
      </div>
    </article>
  );
}

function ReviewEmpty({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="px-6 py-16 text-center">
      <Star aria-hidden="true" className="mx-auto h-8 w-8 text-[#a7b0bd]" />
      <h2 className="mt-4 text-lg font-black text-[#031635]">{title}</h2>
      <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-[#68707d]">
        {description}
      </p>
    </div>
  );
}

function ReviewsLoading() {
  return (
    <div className="grid min-h-[65vh] place-items-center">
      <div className="text-center">
        <LoaderCircle
          aria-hidden="true"
          className="mx-auto h-9 w-9 animate-spin text-cyan-700"
        />
        <p className="mt-4 font-bold text-[#263346]">Loading reviews…</p>
      </div>
    </div>
  );
}

function ReviewsError({ error, retry }: { error: string; retry: () => void }) {
  return (
    <div className="grid min-h-[65vh] place-items-center">
      <section className="max-w-md rounded-2xl border border-red-200 bg-white p-7 text-center">
        <RefreshCw
          aria-hidden="true"
          className="mx-auto h-8 w-8 text-red-600"
        />
        <h1 className="mt-4 text-xl font-black text-[#031635]">
          Unable to load reviews
        </h1>
        <p className="mt-2 text-sm leading-6 text-[#68707d]">{error}</p>
        <button
          className="mt-5 h-10 rounded-lg bg-[#031635] px-5 text-sm font-bold text-white"
          onClick={retry}
          type="button"
        >
          Try again
        </button>
      </section>
    </div>
  );
}
