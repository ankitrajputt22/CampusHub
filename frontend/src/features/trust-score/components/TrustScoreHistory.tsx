import type { TrustScoreHistoryEntry } from '../api/trustScoreApi';

export function TrustScoreHistory({
  entries,
}: {
  entries: TrustScoreHistoryEntry[];
}) {
  if (entries.length === 0) {
    return (
      <p className="text-sm text-[#687384]">
        No Campus Trust Score changes yet.
      </p>
    );
  }
  return (
    <ol className="space-y-2" aria-label="Campus Trust Score history">
      {entries.map((entry) => (
        <li
          key={entry.id}
          className="flex items-center justify-between gap-3 rounded-lg bg-[#f7f9fc] px-3 py-2 text-xs"
        >
          <span className="min-w-0">
            <strong className="block text-[#263a52]">
              {entry.reason.split('_').join(' ')}
            </strong>
            <span className="text-[#687384]">
              {new Date(entry.createdAt).toLocaleDateString('en-IN')}
            </span>
          </span>
          <span
            className={`shrink-0 font-black ${entry.change >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}
          >
            {entry.change >= 0 ? '+' : ''}
            {entry.change}
          </span>
        </li>
      ))}
    </ol>
  );
}
