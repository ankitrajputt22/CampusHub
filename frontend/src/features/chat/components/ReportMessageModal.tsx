import { AlertTriangle, LoaderCircle, X } from 'lucide-react';
import { useEffect, useState } from 'react';

import type { ChatReportReason } from '../api/chatApi';

const reasons: { value: ChatReportReason; label: string }[] = [
  { value: 'HARASSMENT', label: 'Harassment' },
  { value: 'SCAM_ATTEMPT', label: 'Scam attempt' },
  { value: 'ABUSIVE_LANGUAGE', label: 'Abusive language' },
  { value: 'ASKING_FOR_OTP_PASSWORD', label: 'Asking for OTP or password' },
  { value: 'PAYMENT_FRAUD', label: 'Payment fraud' },
  { value: 'UNSAFE_PICKUP_BEHAVIOR', label: 'Unsafe pickup behavior' },
  { value: 'SPAM', label: 'Spam' },
  { value: 'OTHER', label: 'Other' },
];

export function ReportMessageModal({
  open,
  submitting,
  error,
  onClose,
  onSubmit,
}: {
  open: boolean;
  submitting: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (reason: ChatReportReason, description: string) => Promise<void>;
}) {
  const [reason, setReason] = useState<ChatReportReason>('SCAM_ATTEMPT');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (!open) return;
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape' && !submitting) onClose();
    }
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose, open, submitting]);

  if (!open) return null;

  return (
    <div
      aria-label="Report chat message"
      aria-modal="true"
      className="fixed inset-0 z-[80] flex items-center justify-center bg-[#031635]/55 p-4"
      role="dialog"
    >
      <div className="w-full max-w-lg rounded-2xl border border-[#d9e0e9] bg-white p-5 shadow-2xl sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-50 text-rose-700">
              <AlertTriangle aria-hidden="true" className="h-5 w-5" />
            </span>
            <h2 className="mt-4 text-xl font-black text-[#071b33]">
              Report this message
            </h2>
            <p className="mt-1 text-sm leading-6 text-[#687587]">
              Campus Hub moderators receive the report reason, message, and
              conversation context needed for a safety review.
            </p>
          </div>
          <button
            aria-label="Close report dialog"
            className="rounded-lg p-2 text-[#687587] hover:bg-[#eff4ff]"
            disabled={submitting}
            onClick={onClose}
            type="button"
          >
            <X aria-hidden="true" className="h-5 w-5" />
          </button>
        </div>

        <label className="mt-5 block text-sm font-black text-[#203650]">
          Reason
          <select
            className="mt-2 h-11 w-full rounded-xl border border-[#cbd5e1] bg-white px-3 font-semibold outline-none focus:border-[#007b95] focus:ring-2 focus:ring-cyan-100"
            onChange={(event) =>
              setReason(event.target.value as ChatReportReason)
            }
            value={reason}
          >
            {reasons.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>

        <label className="mt-4 block text-sm font-black text-[#203650]">
          Additional details {reason === 'OTHER' ? '(required)' : '(optional)'}
          <textarea
            className="mt-2 min-h-28 w-full resize-y rounded-xl border border-[#cbd5e1] p-3 text-sm font-medium leading-6 outline-none focus:border-[#007b95] focus:ring-2 focus:ring-cyan-100"
            maxLength={500}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Explain the concern without sharing private contact or payment details."
            value={description}
          />
        </label>
        <p className="mt-1 text-right text-xs text-[#7a8797]">
          {description.length}/500
        </p>

        {error && (
          <p
            className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-bold text-rose-800"
            role="alert"
          >
            {error}
          </p>
        )}

        <div className="mt-5 flex justify-end gap-3">
          <button
            className="h-10 rounded-xl border border-[#cbd5e1] px-4 text-sm font-black text-[#3d5067]"
            disabled={submitting}
            onClick={onClose}
            type="button"
          >
            Cancel
          </button>
          <button
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-rose-700 px-4 text-sm font-black text-white disabled:opacity-60"
            disabled={submitting || (reason === 'OTHER' && !description.trim())}
            onClick={() => void onSubmit(reason, description.trim())}
            type="button"
          >
            {submitting && (
              <LoaderCircle
                aria-hidden="true"
                className="h-4 w-4 animate-spin"
              />
            )}
            Submit report
          </button>
        </div>
      </div>
    </div>
  );
}
