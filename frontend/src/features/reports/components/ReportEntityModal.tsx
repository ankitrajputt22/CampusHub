import { AlertTriangle, Flag, ShieldAlert, X } from 'lucide-react';
import { useEffect, useState } from 'react';

import type {
  ReportReason,
  ReportType,
  ReviewReportReason,
  UserReportReason,
} from '../api/reportsApi';

const userReasons: Array<{ value: UserReportReason; label: string }> = [
  { value: 'SUSPICIOUS_BEHAVIOR', label: 'Suspicious behavior' },
  { value: 'FAKE_IDENTITY', label: 'Fake identity' },
  { value: 'SCAM_ATTEMPT', label: 'Scam attempt' },
  { value: 'HARASSMENT', label: 'Harassment' },
  { value: 'REPEATED_FAKE_LISTINGS', label: 'Repeated fake listings' },
  { value: 'PAYMENT_RELATED_ISSUE', label: 'Payment-related issue' },
  { value: 'UNSAFE_PICKUP_BEHAVIOR', label: 'Unsafe pickup behavior' },
  { value: 'OTHER', label: 'Other' },
];

const reviewReasons: Array<{ value: ReviewReportReason; label: string }> = [
  { value: 'ABUSIVE_LANGUAGE', label: 'Abusive language' },
  { value: 'FAKE_REVIEW', label: 'Fake review' },
  { value: 'SPAM', label: 'Spam' },
  {
    value: 'PERSONAL_INFORMATION_EXPOSED',
    label: 'Personal information exposed',
  },
  { value: 'IRRELEVANT_REVIEW', label: 'Irrelevant review' },
  { value: 'FALSE_CLAIM', label: 'False claim' },
  { value: 'OTHER', label: 'Other' },
];

export function ReportEntityModal({
  open,
  type,
  targetName,
  onClose,
  onSubmit,
}: {
  open: boolean;
  type: Exclude<ReportType, 'LISTING'>;
  targetName: string;
  onClose: () => void;
  onSubmit: (reason: ReportReason, description: string) => Promise<void>;
}) {
  const [reason, setReason] = useState<ReportReason | ''>('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const reasons = type === 'USER' ? userReasons : reviewReasons;
  const label = type === 'USER' ? 'student' : 'review';

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
      setError(`Please select why you are reporting this ${label}.`);
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await onSubmit(reason, description.trim());
      setReason('');
      setDescription('');
      onClose();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : 'Unable to submit the report.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      aria-labelledby="report-entity-title"
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
            <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.13em] text-rose-700">
              <ShieldAlert aria-hidden="true" className="h-4 w-4" />
              Campus safety
            </p>
            <h2
              className="mt-2 text-xl font-black text-[#071b33]"
              id="report-entity-title"
            >
              Report this {label}
            </h2>
            <p className="mt-1 line-clamp-2 text-sm text-[#667386]">
              {targetName}
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
              setReason(event.target.value as ReportReason | '')
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
            Additional details{' '}
            <span className="font-medium normal-case tracking-normal text-[#8490a0]">
              (optional)
            </span>
          </span>
          <textarea
            className="mt-2 min-h-28 w-full resize-y rounded-xl border border-[#cbd3de] p-3 text-sm outline-none focus:border-[#007b95] focus:ring-2 focus:ring-cyan-100"
            maxLength={500}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Briefly explain what happened. Do not include phone numbers, email addresses, or other private information."
            value={description}
          />
          <span className="mt-1 block text-right text-xs text-[#8490a0]">
            {description.length}/500
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
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-rose-700 px-5 text-sm font-bold text-white hover:bg-rose-800 disabled:cursor-wait disabled:opacity-60"
            disabled={submitting}
            type="submit"
          >
            <Flag aria-hidden="true" className="h-4 w-4" />
            {submitting ? 'Submitting…' : 'Submit report'}
          </button>
        </div>
      </form>
    </div>
  );
}
