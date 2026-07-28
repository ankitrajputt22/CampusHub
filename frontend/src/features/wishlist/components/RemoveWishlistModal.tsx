import { LoaderCircle, X } from 'lucide-react';
import { useEffect } from 'react';

export function RemoveWishlistModal({
  itemTitle,
  busy,
  onCancel,
  onConfirm,
}: {
  itemTitle: string;
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !busy) onCancel();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [busy, onCancel]);

  return (
    <div
      aria-labelledby="remove-wishlist-title"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#031635]/55 p-4 backdrop-blur-[2px]"
      role="dialog"
    >
      <div className="w-full max-w-md rounded-2xl border border-[#dce2eb] bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.14em] text-[#007b95]">
              Saved item
            </p>
            <h2
              className="mt-2 text-xl font-black text-[#071b33]"
              id="remove-wishlist-title"
            >
              Remove from your wishlist?
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
        <p className="mt-3 font-bold text-[#25384f]">{itemTitle}</p>
        <p className="mt-2 text-sm leading-6 text-[#667386]">
          This item will disappear from your saved items. You can save it again
          later if the listing is still available.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            className="h-10 rounded-xl border border-[#cfd8e5] px-4 text-sm font-bold text-[#25384f] hover:bg-[#f4f7fb]"
            disabled={busy}
            onClick={onCancel}
            type="button"
          >
            Keep item
          </button>
          <button
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-rose-700 px-4 text-sm font-bold text-white hover:bg-rose-800 disabled:cursor-wait disabled:opacity-60"
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
            {busy ? 'Removing…' : 'Remove item'}
          </button>
        </div>
      </div>
    </div>
  );
}
