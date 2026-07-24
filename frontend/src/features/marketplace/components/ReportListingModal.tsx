import { AlertTriangle, Flag, X } from 'lucide-react';
import { useEffect, useState } from 'react';

import type { ListingReportReason } from '../api/marketplaceApi';

const reasons: { value: ListingReportReason; label: string }[] = [
  { value: 'FAKE_LISTING', label: 'Fake listing' },
  { value: 'WRONG_PRODUCT_DETAILS', label: 'Wrong product details' },
  { value: 'SUSPICIOUS_SELLER', label: 'Suspicious seller' },
  { value: 'PROHIBITED_ITEM', label: 'Prohibited item' },
  { value: 'ABUSIVE_CONTENT', label: 'Abusive content' },
  { value: 'DUPLICATE_LISTING', label: 'Duplicate listing' },
  { value: 'PRICE_SCAM', label: 'Price scam' },
  { value: 'OTHER', label: 'Other' },
];

export function ReportListingModal({
  productTitle,
  open,
  onClose,
  onSubmit,
}: {
  productTitle: string;
  open: boolean;
  onClose: () => void;
  onSubmit: (reason: ListingReportReason, description: string) => Promise<void>;
}) {
  const [reason, setReason] = useState<ListingReportReason | ''>('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape' && !submitting) onClose();
    }
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [onClose, open, submitting]);

  if (!open) return null;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!reason) {
      setError('Please select why you are reporting this listing.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit(reason, description.trim());
      setReason('');
      setDescription('');
      onClose();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'Unable to submit the report.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      aria-labelledby="report-listing-title"
      aria-modal="true"
      className="fixed inset-0 z-[90] flex items-center justify-center bg-[#031635]/65 p-4"
      role="dialog"
    >
      <form
        className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl sm:p-6"
        onSubmit={submit}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.13em] text-rose-700">
              <Flag aria-hidden="true" className="h-4 w-4" />
              Campus safety report
            </p>
            <h2
              className="mt-2 text-xl font-black text-[#071b33]"
              id="report-listing-title"
            >
              Report this listing
            </h2>
            <p className="mt-1 line-clamp-1 text-sm text-[#667386]">
              {productTitle}
            </p>
          </div>
          <button
            aria-label="Close report form"
            className="rounded-lg p-2 text-[#667386] hover:bg-[#eff4ff]"
            disabled={submitting}
            onClick={onClose}
            type="button"
          >
            <X aria-hidden="true" className="h-5 w-5" />
          </button>
        </div>

        <label className="mt-6 block">
          <span className="text-xs font-bold uppercase tracking-[0.1em] text-[#526075]">
            Reason
          </span>
          <select
            className="mt-2 h-11 w-full rounded-xl border border-[#cbd3de] bg-white px-3 text-sm outline-none focus:border-[#007b95] focus:ring-2 focus:ring-cyan-100"
            onChange={(event) =>
              setReason(event.target.value as ListingReportReason | '')
            }
            value={reason}
          >
            <option value="">Select a reason</option>
            {reasons.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>

        <label className="mt-4 block">
          <span className="text-xs font-bold uppercase tracking-[0.1em] text-[#526075]">
            Additional details
            <span className="ml-1 font-medium normal-case tracking-normal text-[#8490a0]">
              (optional)
            </span>
          </span>
          <textarea
            className="mt-2 min-h-28 w-full resize-y rounded-xl border border-[#cbd3de] p-3 text-sm outline-none focus:border-[#007b95] focus:ring-2 focus:ring-cyan-100"
            maxLength={1000}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Briefly explain what seems wrong or unsafe."
            value={description}
          />
          <span className="mt-1 block text-right text-xs text-[#8490a0]">
            {description.length}/1000
          </span>
        </label>

        {error && (
          <div
            className="mt-4 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-3 text-sm text-rose-800"
            role="alert"
          >
            <AlertTriangle
              aria-hidden="true"
              className="mt-0.5 h-4 w-4 shrink-0"
            />
            {error}
          </div>
        )}

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            className="h-11 rounded-xl border border-[#c3ccd8] px-5 text-sm font-bold text-[#263a52]"
            disabled={submitting}
            onClick={onClose}
            type="button"
          >
            Cancel
          </button>
          <button
            className="h-11 rounded-xl bg-rose-700 px-5 text-sm font-bold text-white hover:bg-rose-800 disabled:cursor-wait disabled:opacity-60"
            disabled={submitting}
            type="submit"
          >
            {submitting ? 'Submitting report...' : 'Submit report'}
          </button>
        </div>
      </form>
    </div>
  );
}
