import { LoaderCircle, X } from 'lucide-react';
import { useEffect } from 'react';

export type ListingAction =
  'mark-sold' | 'mark-inactive' | 'reactivate' | 'delete';

const actionCopy: Record<
  ListingAction,
  { title: string; description: string; confirm: string; danger?: boolean }
> = {
  'mark-sold': {
    title: 'Mark this listing as sold?',
    description:
      'Buyers will no longer be able to purchase it, but it will remain in your marketplace history.',
    confirm: 'Mark as sold',
  },
  'mark-inactive': {
    title: 'Make this listing inactive?',
    description:
      'The item will be hidden from your college marketplace until you reactivate it.',
    confirm: 'Make inactive',
  },
  reactivate: {
    title: 'Reactivate this listing?',
    description:
      'The item will return to your college marketplace and become available to buyers.',
    confirm: 'Reactivate',
  },
  delete: {
    title: 'Delete this listing?',
    description:
      'It will be removed from your seller workspace and hidden from buyers. This action cannot be undone here.',
    confirm: 'Delete listing',
    danger: true,
  },
};

export function ConfirmListingActionModal({
  action,
  listingTitle,
  busy,
  onCancel,
  onConfirm,
}: {
  action: ListingAction;
  listingTitle: string;
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const copy = actionCopy[action];

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !busy) onCancel();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [busy, onCancel]);

  return (
    <div
      aria-labelledby="listing-action-title"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#031635]/55 p-4 backdrop-blur-[2px]"
      role="dialog"
    >
      <div className="w-full max-w-md rounded-2xl border border-[#dce2eb] bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.14em] text-[#007b95]">
              Listing action
            </p>
            <h2
              className="mt-2 text-xl font-black text-[#071b33]"
              id="listing-action-title"
            >
              {copy.title}
            </h2>
          </div>
          <button
            aria-label="Close confirmation"
            className="rounded-lg p-2 text-[#687587] transition hover:bg-[#eef3f8] hover:text-[#071b33]"
            disabled={busy}
            onClick={onCancel}
            type="button"
          >
            <X aria-hidden="true" className="h-5 w-5" />
          </button>
        </div>
        <p className="mt-3 text-sm font-bold text-[#25384f]">{listingTitle}</p>
        <p className="mt-2 text-sm leading-6 text-[#667386]">
          {copy.description}
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            className="h-10 rounded-xl border border-[#cfd8e5] px-4 text-sm font-bold text-[#25384f] transition hover:bg-[#f4f7fb]"
            disabled={busy}
            onClick={onCancel}
            type="button"
          >
            Cancel
          </button>
          <button
            className={`inline-flex h-10 items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${
              copy.danger
                ? 'bg-rose-700 hover:bg-rose-800'
                : 'bg-[#071b33] hover:bg-[#0c2a4c]'
            }`}
            disabled={busy}
            onClick={onConfirm}
            type="button"
          >
            {busy && (
              <LoaderCircle
                aria-hidden="true"
                className="h-4 w-4 animate-spin"
              />
            )}
            {copy.confirm}
          </button>
        </div>
      </div>
    </div>
  );
}
