import { ShieldCheck } from 'lucide-react';

export function TrustScoreBadge({
  score,
  level,
  compact = false,
}: {
  score: number;
  level?: string;
  compact?: boolean;
}) {
  const safeScore = Math.max(0, Math.min(100, Math.round(score)));
  const label = level || trustLevelLabel(safeScore);
  return (
    <span
      aria-label={`Campus Trust Score ${safeScore} out of 100`}
      className={`inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 font-bold text-emerald-800 ${compact ? 'px-2 py-1 text-[10px]' : 'px-2.5 py-1.5 text-xs'}`}
    >
      <ShieldCheck
        aria-hidden="true"
        className={compact ? 'h-3 w-3' : 'h-3.5 w-3.5'}
      />
      {safeScore}/100{compact ? '' : ` · ${label}`}
    </span>
  );
}

function trustLevelLabel(score: number) {
  if (score >= 91) return 'Campus Verified Seller';
  if (score >= 71) return 'Trusted Student';
  if (score >= 41) return 'Average Trust';
  return 'New / Low Trust';
}
