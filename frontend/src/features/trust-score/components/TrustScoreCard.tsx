import { CheckCircle2, CircleAlert, LoaderCircle } from 'lucide-react';
import type { TrustScoreDetails } from '../api/trustScoreApi';
import { TrustScoreBadge } from './TrustScoreBadge';

export function TrustScoreCard({
  score,
  loading = false,
  error = '',
}: {
  score?: TrustScoreDetails;
  loading?: boolean;
  error?: string;
}) {
  if (loading) {
    return (
      <section className="grid min-h-32 place-items-center rounded-2xl border border-[#dce2eb] bg-white p-5">
        <LoaderCircle
          aria-label="Loading Campus Trust Score"
          className="h-6 w-6 animate-spin text-[#007b95]"
        />
      </section>
    );
  }
  if (error || !score) {
    return (
      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
        <p className="flex items-center gap-2 font-bold">
          <CircleAlert className="h-4 w-4" /> Campus Trust Score unavailable
        </p>
        {error && <p className="mt-1 text-xs">{error}</p>}
      </section>
    );
  }
  const rows = [
    ['Verification', score.breakdown.verification, 30],
    ['Profile completion', score.breakdown.profileCompletion, 15],
    ['Marketplace activity', score.breakdown.marketplaceActivity, 15],
    ['Completed orders', score.breakdown.orderCompletion, 20],
    ['Reviews', score.breakdown.reviews, 15],
    ['Account security', score.breakdown.accountSecurity, 5],
  ] as const;
  return (
    <section className="rounded-2xl border border-[#dce2eb] bg-white p-5 shadow-[0_4px_18px_rgba(3,22,53,0.05)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.13em] text-[#007b95]">
            Reputation
          </p>
          <h2 className="mt-1 text-xl font-black text-[#10233d]">
            Campus Trust Score
          </h2>
        </div>
        <TrustScoreBadge score={score.score} level={score.levelLabel} />
      </div>
      <div className="mt-5 grid gap-2 sm:grid-cols-2">
        {rows.map(([label, value, maximum]) => (
          <div key={label} className="rounded-lg bg-[#f7f9fc] px-3 py-2">
            <div className="flex justify-between text-xs font-bold text-[#52617a]">
              <span>{label}</span>
              <span>
                {value}/{maximum}
              </span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[#e2e8f0]">
              <div
                className="h-full rounded-full bg-[#11a6a6]"
                style={{ width: `${(value / maximum) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
      {score.breakdown.penalties > 0 && (
        <p className="mt-3 text-xs font-semibold text-rose-700">
          Confirmed moderation deductions: -{score.breakdown.penalties}
        </p>
      )}
      {score.suggestions.length > 0 && (
        <div className="mt-4 border-t border-[#edf0f4] pt-3">
          <p className="text-xs font-black uppercase tracking-[0.1em] text-[#687384]">
            Ways to improve
          </p>
          <ul className="mt-2 space-y-1.5 text-xs text-[#52617a]">
            {score.suggestions.slice(0, 3).map((suggestion) => (
              <li key={suggestion} className="flex gap-2">
                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#0b8b83]" />
                {suggestion}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
